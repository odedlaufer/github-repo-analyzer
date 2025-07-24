// @ts-expect-error: unstable_mockModule is valid in ESM but not yet typed
jest.unstable_mockModule('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      get: jest.fn().mockResolvedValue({
        data: {
          name: 'next.js',
          description: 'Mocked repo',
          html_url: 'https://github.com/vercel/next.js',
        },
      }),
    },
  })),
}));

describe('fetchRepoMetadata', () => {
  let fetchRepoMetadata: typeof import('../services/repoAnalyzerService').fetchRepoMetadata;

  beforeAll(async () => {
    const service = await import('../services/repoAnalyzerService');
    fetchRepoMetadata = service.fetchRepoMetadata;
  });

  it('returns mocked repo metadata', async () => {
    const result = await fetchRepoMetadata('vercel', 'next.js');
    expect(result).toEqual({
      name: 'next.js',
      description: 'Mocked repo',
      url: 'https://github.com/vercel/next.js',
    });
  });
});
