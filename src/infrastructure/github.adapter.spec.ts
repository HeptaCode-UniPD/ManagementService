import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { GithubAdapter } from './github.adapter';

// Mock functions definite qui, niente __mocks__
const mockReposGet = jest.fn();
const mockReposGetBranch = jest.fn();

// Istanza octokit falsa da iniettare direttamente nell'adapter
const mockOctokitInstance = {
  repos: {
    get: mockReposGet,
    getBranch: mockReposGetBranch,
  },
};

describe('GithubAdapter', () => {
  let adapter: GithubAdapter;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [GithubAdapter],
    }).compile();

    adapter = module.get<GithubAdapter>(GithubAdapter);

    (adapter as unknown as { octokit: typeof mockOctokitInstance }).octokit = mockOctokitInstance;
  });

  describe('getLatestCommit', () => {
    it('should return the latest commit SHA for a valid repo URL', async () => {
      mockReposGet.mockResolvedValue({ data: { default_branch: 'main' } });
      mockReposGetBranch.mockResolvedValue({ data: { commit: { sha: 'sha-abc123' } } });

      const result = await adapter.getLatestCommit('https://github.com/owner/repo');

      expect(result).toBe('sha-abc123');
    });

    it('should work with a shorthand URL (owner/repo without https)', async () => {
      mockReposGet.mockResolvedValue({ data: { default_branch: 'main' } });
      mockReposGetBranch.mockResolvedValue({ data: { commit: { sha: 'sha-short' } } });

      const result = await adapter.getLatestCommit('owner/repo');

      expect(result).toBe('sha-short');
    });

    it('should throw HttpException with BAD_REQUEST for an invalid URL', async () => {
      await expect(adapter.getLatestCommit('not-a-valid-url')).rejects.toThrow(
        new HttpException('Invalid GitHub Repository URL', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw HttpException with GitHub status if octokit.repos.get fails', async () => {
      mockReposGet.mockRejectedValue({ message: 'Not Found', status: 404 });

      await expect(adapter.getLatestCommit('https://github.com/owner/repo')).rejects.toThrow(
        new HttpException('GitHub API Error: Not Found', 404),
      );
    });

    it('should throw HttpException with BAD_GATEWAY if error has no status', async () => {
      mockReposGet.mockRejectedValue(new Error('Generic failure'));

      await expect(adapter.getLatestCommit('https://github.com/owner/repo')).rejects.toThrow(
        new HttpException('GitHub API Error: Generic failure', HttpStatus.BAD_GATEWAY),
      );
    });

    it('should use the default_branch returned by repos.get', async () => {
      mockReposGet.mockResolvedValue({ data: { default_branch: 'develop' } });
      mockReposGetBranch.mockResolvedValue({ data: { commit: { sha: 'sha-develop' } } });

      await adapter.getLatestCommit('https://github.com/owner/repo');

      expect(mockReposGetBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branch: 'develop' }),
      );
    });
  });
});