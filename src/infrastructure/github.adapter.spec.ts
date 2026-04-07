import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';

const mockReposGet = jest.fn();
const mockReposGetBranch = jest.fn();

describe('GithubAdapter', () => {
  let adapter: any; 

  beforeEach(async () => {
    jest.clearAllMocks();

    jest.doMock('@octokit/rest', () => ({
      Octokit: jest.fn().mockImplementation(() => ({
        repos: {
          get: mockReposGet,
          getBranch: mockReposGetBranch,
        },
      })),
    }));

    const { GithubAdapter } = require('./github.adapter');

    const module: TestingModule = await Test.createTestingModule({
      providers: [GithubAdapter],
    }).compile();

    adapter = module.get(GithubAdapter);
    
    if (adapter['octokit']) {
      adapter['octokit'] = null;
    }
  });

  describe('getLatestCommit', () => {
    it('should return the latest commit SHA for a valid repo URL', async () => {
      mockReposGet.mockResolvedValue({ data: { default_branch: 'main' } });
      mockReposGetBranch.mockResolvedValue({ data: { commit: { sha: 'sha-abc123' } } });

      const result = await adapter.getLatestCommit('https://github.com/owner/repo');

      expect(mockReposGet).toHaveBeenCalledWith({ owner: 'owner', repo: 'repo' });
      expect(mockReposGetBranch).toHaveBeenCalledWith({ owner: 'owner', repo: 'repo', branch: 'main' });
      expect(result).toBe('sha-abc123');
    });

    it('should work with a shorthand URL (owner/repo without https)', async () => {
      mockReposGet.mockResolvedValue({ data: { default_branch: 'main' } });
      mockReposGetBranch.mockResolvedValue({ data: { commit: { sha: 'sha-short' } } });

      const result = await adapter.getLatestCommit('owner/repo');

      expect(mockReposGet).toHaveBeenCalledWith({ owner: 'owner', repo: 'repo' });
      expect(result).toBe('sha-short');
    });

    it('should throw HttpException with BAD_REQUEST for an invalid URL', async () => {
      await expect(adapter.getLatestCommit('not-a-valid-url')).rejects.toThrow(
        new HttpException('Invalid GitHub Repository URL', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw HttpException with GitHub status if octokit.repos.get fails', async () => {
      const githubError = { message: 'Not Found', status: 404 };
      mockReposGet.mockRejectedValue(githubError);

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