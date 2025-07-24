import {
  fetchRepoMetadata,
  analyzeRepoTree,
  detectTechStack,
  analyzeCommunityHealth,
} from './repoAnalyzerService';

export async function analyzeRepo(owner: string, repo: string) {
  const metadata = await fetchRepoMetadata(owner, repo);
  const { tree, structure } = await analyzeRepoTree(owner, repo);
  const techStack = await detectTechStack(owner, repo);
  const community = analyzeCommunityHealth(tree);

  return {
    metadata,
    structure,
    techStack,
    community,
  };
}
