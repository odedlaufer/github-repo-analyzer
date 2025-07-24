import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import { Router, Request, Response } from 'express';
import { fetchRepoMetadata, analyzeRepoTree, detectTechStack, detectGitHubPages, analyzeCommunityHealth } from '../services/repoAnalyzerService.js';


const router = Router();

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

router.post('/', async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid GitHub URL' });
  }

  // Extract owner and repo from the URL
  const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)(\/)?$/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid GitHub repository URL format' });
  }

  const [, owner, repo] = match;

  try {
    const metadata = await fetchRepoMetadata(owner, repo);
    const { structure, tree } = await analyzeRepoTree(owner, repo);
    const techStack = await detectTechStack(owner, repo);
    const githubPagesEnabled = await detectGitHubPages(owner, repo, octokit);
    const communityHealthScore = analyzeCommunityHealth(tree)
    res.json({
    analysisReport: {
        metadata,
        structure,
        techStack,
        githubPages: githubPagesEnabled,
        communityHealthScore,
    },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to analyze repo' });
  }
});

export default router;
