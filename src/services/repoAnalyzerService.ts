import '../config/env.js';
import { Octokit } from '@octokit/rest';
import type { GitHubTreeItem, RepoStructure } from '../types/github';
import { AppError } from '../utils/AppError.js';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function fetchRepoMetadata(owner: string, repo: string) {
  try {
    const { data } = await octokit.repos.get({ owner, repo });

    return {
      name: data.name,
      full_name: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      open_issues: data.open_issues_count,
      language: data.language,
      license: data.license?.spdx_id || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as { status: number }).status === 404
    ) {
      throw new AppError('Repository not found.', 404);
    }

    console.error('Error fetching repo metadata:', error);
    throw new AppError('Failed to fetch repository metadata.');
  }
}

export async function analyzeRepoTree(owner: string, repo: string) {
  try {
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const branch = repoData.default_branch;

    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });

    const commitSha = refData.object.sha;

    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: commitSha,
    });

    const treeSha = commitData.tree.sha;

    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: treeSha,
      recursive: '1',
    });

    const structure = await analyzeRepoStructure(treeData.tree as GitHubTreeItem[]);

    return { structure, tree: treeData.tree as GitHubTreeItem[] };
  } catch (error: unknown) {
    console.error('Error analyzing repo tree:', error);
    throw new AppError('Failed to analyze repository tree.');
  }
}

export async function detectTechStack(owner: string, repo: string): Promise<string[]> {
  const stack: string[] = [];

  const knownFiles = [
    { name: 'package.json', label: 'Node.js' },
    { name: 'requirements.txt', label: 'Python' },
    { name: 'pyproject.toml', label: 'Python' },
    { name: 'Gemfile', label: 'Ruby' },
    { name: 'composer.json', label: 'PHP' },
    { name: 'build.gradle', label: 'Java' },
    { name: 'pom.xml', label: 'Java' },
    { name: 'Cargo.toml', label: 'Rust' },
    { name: 'go.mod', label: 'Go' },
    { name: 'Dockerfile', label: 'Docker' },
  ];

  for (const file of knownFiles) {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: file.name,
      });

      if ('content' in data && typeof data.content === 'string') {
        const content = Buffer.from(data.content, 'base64').toString();

        if (file.name === 'package.json') {
          const pkg = JSON.parse(content);
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };

          if (deps['next']) stack.push('Next.js');
          if (deps['react']) stack.push('React');
          if (deps['express']) stack.push('Express');
          if (deps['nestjs']) stack.push('NestJS');
        }

        stack.push(file.label);
      }
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'status' in err &&
        (err as { status: number }).status !== 404
      ) {
        console.error(`Error checking ${file.name}`, (err as Error).message);
      }
    }
  }

  return [...new Set(stack)];
}

export async function detectGitHubPages(owner: string, repo: string, octokit: Octokit) {
  try {
    const res = await octokit.request('GET /repos/{owner}/{repo}/pages', {
      owner,
      repo,
    });
    return res.status === 200;
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as { status: number }).status === 404
    ) {
      return false;
    }

    console.error('Error checking GitHub Pages:', error);
    return false;
  }
}

export function analyzeCommunityHealth(tree: GitHubTreeItem[]) {
  const filesToCheck: Record<string, boolean> = {
    'README.md': false,
    '.github/CONTRIBUTING.md': false,
    '.github/CODE_OF_CONDUCT.md': false,
    '.github/ISSUE_TEMPLATE': false,
    '.github/PULL_REQUEST_TEMPLATE.md': false,
  };

  const presentFiles: string[] = [];
  const missingFiles: string[] = [];

  for (const item of tree) {
    for (const file in filesToCheck) {
      if (item.path.startsWith(file)) {
        filesToCheck[file] = true;
      }
    }
  }

  for (const [file, present] of Object.entries(filesToCheck)) {
    if (present) {
      presentFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  }

  return {
    communityHealthScore: presentFiles.length,
    presentFiles,
    missingFiles,
  };
}

export async function analyzeRepoStructure(tree: GitHubTreeItem[]): Promise<RepoStructure> {
  const keyFiles: string[] = [];
  const keyDirs: string[] = [];
  const securityWarnings: string[] = [];

  let maxDepth = 0;

  for (const item of tree) {
    const depth = item.path.split('/').length;
    if (depth > maxDepth) maxDepth = depth;

    if (item.type === 'blob') {
      if (['README.md', 'package.json'].includes(item.path)) {
        keyFiles.push(item.path);
      }

      if (
        item.path.match(/\.env(\..*)?$/) ||
        item.path.match(/secrets?\./i) ||
        item.path.match(/config(\.js|\.ts)?$/)
      ) {
        securityWarnings.push(`Suspicious file detected: ${item.path}`);
      }
    }

    if (item.type === 'tree') {
      if (['.github', '.github/workflows'].includes(item.path)) {
        keyDirs.push(item.path);
      }
    }
  }

  const usesGitHubActions = tree.some(
    (item) =>
      item.type === 'blob' &&
      item.path.startsWith('.github/workflows/') &&
      (item.path.endsWith('.yml') || item.path.endsWith('.yaml'))
  );

  const ciTools: string[] = usesGitHubActions ? ['GitHub Actions'] : [];

  const issues: string[] = maxDepth > 10 ? [`Tree is too deep (${maxDepth} levels)`] : [];

  return {
    depth: maxDepth,
    keyFiles,
    keyDirs,
    issues,
    securityWarnings,
    ciTools,
  };
}
