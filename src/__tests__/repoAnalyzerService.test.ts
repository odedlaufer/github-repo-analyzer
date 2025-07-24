import { fetchRepoMetadata } from '../services/repoAnalyzerService';

describe('fetchRepoMetadata', () => {
  it('fetches metadata for a known GitHub repo', async () => {
    const metadata = await fetchRepoMetadata('vercel', 'next.js');
    expect(metadata.name).toBe('next.js');
    expect(metadata.language).toBeDefined();
    expect(metadata.stars).toBeGreaterThan(1000);
  });
});