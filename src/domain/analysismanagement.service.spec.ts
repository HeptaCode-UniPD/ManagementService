import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisManagementService } from './analysismanagement.service';
import { AnalysisManagementPersistenceInterface } from './interfaces/analysismanagementpersistence.interface';
import { AnalysisManagementInfrastructureInterface } from './interfaces/analysismanagementinfrastructure.interface';
import { RequestDTO } from './dto/request.dto';
import { AnalysisResponseDTO } from './dto/analysisresponse.dto';

describe('AnalysisManagementService', () => {
  let service: AnalysisManagementService;

  const mockPersistence = {
    getAnalysisByCommit: jest.fn(),
    getAnalysisByJob: jest.fn(),
    getLastAnalysis: jest.fn(),
    saveAnalysis: jest.fn(),
  };

  const mockInfra = {
    getLatestCommitSha: jest.fn(),
    startAnalysis: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisManagementService,
        { provide: AnalysisManagementPersistenceInterface, useValue: mockPersistence },
        { provide: AnalysisManagementInfrastructureInterface, useValue: mockInfra },
      ],
    }).compile();

    service = module.get<AnalysisManagementService>(AnalysisManagementService);
    jest.clearAllMocks(); // clearAllMocks, non resetAllMocks
  });

  // ─── startAnalysis ───────────────────────────────────────────────

  describe('startAnalysis', () => {
    const request: RequestDTO = { repoUrl: 'https://github.com/owner/repo' } as RequestDTO;

    it('should return status "done" if cached analysis has analysisDetails', async () => {
      mockInfra.getLatestCommitSha.mockResolvedValue('sha-123');
      mockPersistence.getAnalysisByCommit.mockResolvedValue({
        jobId: 'job-abc',
        analysisDetails: [{ file: 'index.ts', issues: [] }], // length > 0 → done
      });

      const result = await service.startAnalysis(request);

      expect(mockInfra.getLatestCommitSha).toHaveBeenCalledWith(request.repoUrl);
      expect(mockPersistence.getAnalysisByCommit).toHaveBeenCalledWith('sha-123');
      expect(result.status).toBe('done');
      expect(result.jobId).toBe('job-abc');
      expect(result.commitId).toBe('sha-123');
      expect(mockInfra.startAnalysis).not.toHaveBeenCalled();
    });

    it('should return status "processing" if cached analysis exists but has no analysisDetails', async () => {
      mockInfra.getLatestCommitSha.mockResolvedValue('sha-123');
      mockPersistence.getAnalysisByCommit.mockResolvedValue({
        jobId: 'job-abc',
        analysisDetails: [], // length === 0 → processing
      });

      const result = await service.startAnalysis(request);

      expect(result.status).toBe('processing');
      expect(result.jobId).toBe('job-abc');
      expect(mockInfra.startAnalysis).not.toHaveBeenCalled();
    });

    it('should return status "processing" if cached analysis exists with no analysisDetails field', async () => {
      mockInfra.getLatestCommitSha.mockResolvedValue('sha-123');
      mockPersistence.getAnalysisByCommit.mockResolvedValue({
        jobId: 'job-abc',
        // analysisDetails assente
      });

      const result = await service.startAnalysis(request);

      expect(result.status).toBe('processing');
      expect(mockInfra.startAnalysis).not.toHaveBeenCalled();
    });

    it('should start a new analysis if no cached analysis found', async () => {
      mockInfra.getLatestCommitSha.mockResolvedValue('sha-new');
      mockPersistence.getAnalysisByCommit.mockResolvedValue(null);
      mockPersistence.saveAnalysis.mockResolvedValue(undefined);
      mockInfra.startAnalysis.mockResolvedValue(undefined);

      const result = await service.startAnalysis(request);

      expect(mockPersistence.saveAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'processing',
          repoUrl: request.repoUrl,
          commitId: 'sha-new',
          jobId: expect.any(String),
        }),
      );
      // verifica che il jobId venga iniettato nel request prima di chiamare infra
      expect(mockInfra.startAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ jobId: expect.any(String) }),
      );
      expect(result.status).toBe('processing');
      expect(result.commitId).toBe('sha-new');
    });
  });

  // ─── handleWebhookResponse ───────────────────────────────────────

  describe('handleWebhookResponse', () => {
    it('should save the analysis payload received from webhook', async () => {
      const payload: AnalysisResponseDTO = {
        status: 'done',
        repoUrl: 'https://github.com/owner/repo',
        commitId: 'sha-123',
        jobId: 'job-abc',
        date: new Date(),
      };
      mockPersistence.saveAnalysis.mockResolvedValue(undefined);

      await service.handleWebhookResponse(payload);

      expect(mockPersistence.saveAnalysis).toHaveBeenCalledWith(payload);
    });
  });

  // ─── getAnalysisStatus ───────────────────────────────────────────

  describe('getAnalysisStatus', () => {
    it('should return status "error" if job not found', async () => {
      mockPersistence.getAnalysisByJob.mockResolvedValue(null);

      const result = await service.getAnalysisStatus('missing-job');

      expect(result.status).toBe('error');
      expect(result.repoUrl).toBe('');
    });

    it('should return status "done" if analysisDetails is populated', async () => {
      mockPersistence.getAnalysisByJob.mockResolvedValue({
        repoUrl: 'https://github.com/owner/repo',
        commitId: 'sha-123',
        date: new Date(),
        analysisDetails: [{ file: 'index.ts' }],
      });

      const result = await service.getAnalysisStatus('job-abc');

      expect(result.status).toBe('done');
      expect(result.jobId).toBe('job-abc');
    });

    it('should return status "processing" if analysisDetails is empty', async () => {
      mockPersistence.getAnalysisByJob.mockResolvedValue({
        repoUrl: 'https://github.com/owner/repo',
        commitId: 'sha-123',
        date: new Date(),
        analysisDetails: [],
      });

      const result = await service.getAnalysisStatus('job-abc');

      expect(result.status).toBe('processing');
    });
  });

  // ─── getLastAnalysis ─────────────────────────────────────────────

  describe('getLastAnalysis', () => {
    const repoUrl = 'https://github.com/owner/repo';

    it('should return null if no analysis found in DB', async () => {
      mockPersistence.getLastAnalysis.mockResolvedValue(null);

      const result = await service.getLastAnalysis(repoUrl);

      expect(result).toBeNull();
      expect(mockInfra.getLatestCommitSha).not.toHaveBeenCalled();
    });

    it('should return isLatest=true if commitId matches latest GitHub commit', async () => {
      mockPersistence.getLastAnalysis.mockResolvedValue({
        commitId: 'sha-latest',
        repoUrl,
        status: 'done',
        date: new Date(),
      });
      mockInfra.getLatestCommitSha.mockResolvedValue('sha-latest');

      const result = await service.getLastAnalysis(repoUrl);

      expect(result?.isLatest).toBe(true);
    });

    it('should return isLatest=false if commitId does not match latest GitHub commit', async () => {
      mockPersistence.getLastAnalysis.mockResolvedValue({
        commitId: 'sha-old',
        repoUrl,
        status: 'done',
        date: new Date(),
      });
      mockInfra.getLatestCommitSha.mockResolvedValue('sha-new');

      const result = await service.getLastAnalysis(repoUrl);

      expect(result?.isLatest).toBe(false);
    });
  });
});