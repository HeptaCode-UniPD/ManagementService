import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { AnalysisManagementInfrastructure } from './analysismanagement.infrastructure';
import { GithubAdapter } from './github.adapter';
import { RequestDTO } from '../domain/dto/request.dto';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';

describe('AnalysisManagementInfrastructure', () => {
  let infrastructure: AnalysisManagementInfrastructure;

  const mockGithubAdapter = { getLatestCommit: jest.fn() };
  const mockHttpService = { post: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisManagementInfrastructure,
        { provide: GithubAdapter, useValue: mockGithubAdapter },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    infrastructure = module.get<AnalysisManagementInfrastructure>(AnalysisManagementInfrastructure);
    jest.clearAllMocks();
  });

  // ─── getLatestCommitSha ───────────────────────────────────────────

  describe('getLatestCommitSha', () => {
    it('should return the SHA from githubAdapter', async () => {
      mockGithubAdapter.getLatestCommit.mockResolvedValue('sha-abc');

      const result = await infrastructure.getLatestCommitSha('https://github.com/owner/repo');

      expect(mockGithubAdapter.getLatestCommit).toHaveBeenCalledWith('https://github.com/owner/repo');
      expect(result).toBe('sha-abc');
    });
  });

  // ─── startAnalysis ────────────────────────────────────────────────

  describe('startAnalysis', () => {
    const request: RequestDTO = {
      repoUrl: 'https://github.com/owner/repo',
      jobId: 'job-123',
    } as RequestDTO;

    beforeEach(() => {
      process.env.MS2_GATEWAY_URL = 'https://gateway.example.com';
      process.env.MS2_API_KEY = 'test-api-key';
      mockGithubAdapter.getLatestCommit.mockResolvedValue('sha-xyz');
    });

    afterEach(() => {
      delete process.env.MS2_GATEWAY_URL;
      delete process.env.MS2_API_KEY;
    });

    it('should throw if MS2_GATEWAY_URL is not set', async () => {
      delete process.env.MS2_GATEWAY_URL;

      await expect(infrastructure.startAnalysis(request)).rejects.toThrow('MS2_GATEWAY_URL non configurato');
      expect(mockHttpService.post).not.toHaveBeenCalled();
    });

    it('should throw if MS2_API_KEY is not set', async () => {
      delete process.env.MS2_API_KEY;

      await expect(infrastructure.startAnalysis(request)).rejects.toThrow('MS2_API_KEY non configurato');
      expect(mockHttpService.post).not.toHaveBeenCalled();
    });

    it('should POST to gateway with correct payload and headers', async () => {
      mockHttpService.post.mockReturnValue(of({ data: {} }));

      await infrastructure.startAnalysis(request);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://gateway.example.com',
        { repoUrl: request.repoUrl, jobId: request.jobId, commitSha: 'sha-xyz' },
        { headers: { 'x-api-key': 'test-api-key', 'Content-Type': 'application/json' } },
      );
    });

    it('should throw a wrapped error on AxiosError', async () => {
      const axiosError = new AxiosError('Bad Gateway');
      axiosError.response = { status: 502, data: { message: 'Upstream error' } } as any;
      mockHttpService.post.mockReturnValue(throwError(() => axiosError));

      await expect(infrastructure.startAnalysis(request)).rejects.toThrow(
        "Impossibile avviare l'analisi: Upstream error",
      );
    });

    it('should throw a wrapped error on generic Error', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Network failure')));

      await expect(infrastructure.startAnalysis(request)).rejects.toThrow(
        "Impossibile avviare l'analisi: Network failure",
      );
    });
  });
});