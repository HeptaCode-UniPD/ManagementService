import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AnalysisManagementPersistence } from './analysismanagement.persistence';
import { AnalysisResponseDTO } from '../domain/dto/analysisresponse.dto';

const mockExec = jest.fn();
const mockLean = jest.fn(() => ({ exec: mockExec }));
const mockSort = jest.fn(() => ({ lean: mockLean }));
const mockFindOne = jest.fn(() => ({ lean: mockLean, sort: mockSort }));
const mockFindOneAndUpdate = jest.fn(() => ({ exec: mockExec }));

const mockAnalysisModel = {
  findOne: mockFindOne,
  findOneAndUpdate: mockFindOneAndUpdate,
};

describe('AnalysisManagementPersistence', () => {
  let persistence: AnalysisManagementPersistence;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisManagementPersistence,
        { provide: getModelToken('Analysis'), useValue: mockAnalysisModel },
      ],
    }).compile();

    persistence = module.get<AnalysisManagementPersistence>(AnalysisManagementPersistence);
    jest.clearAllMocks();

    // Ricollega le chain dopo clearAllMocks
    mockFindOne.mockReturnValue({ lean: mockLean, sort: mockSort });
    mockSort.mockReturnValue({ lean: mockLean });
    mockLean.mockReturnValue({ exec: mockExec });
    mockFindOneAndUpdate.mockReturnValue({ exec: mockExec });
  });

  // ─── getAnalysisByCommit ─────────────────────────────────────────

  describe('getAnalysisByCommit', () => {
    it('should return null if no record found', async () => {
      mockExec.mockResolvedValue(null);

      const result = await persistence.getAnalysisByCommit('sha-123');
      expect(result).toBeNull();
    });

    it('should map DB record to AnalysisResponseDTO', async () => {
      mockExec.mockResolvedValue({
        commit_id: 'sha-123',
        repository_url: 'https://github.com/owner/repo',
        job_id: 'job-abc',
        status: 'done',
        analysis_data: [{ summary: 'ok', report: 'ok' }],
        createdAt: new Date('2024-01-01'),
      });

      const result = await persistence.getAnalysisByCommit('sha-123');

      expect(result).toMatchObject({
        commitId: 'sha-123',
        repoUrl: 'https://github.com/owner/repo',
        jobId: 'job-abc',
        status: 'done',
      });
      expect(result?.analysisDetails).toHaveLength(1);
    });

    it('should default analysisDetails to [] if analysis_data is null', async () => {
      mockExec.mockResolvedValue({
        commit_id: 'sha-123',
        repository_url: 'https://github.com/owner/repo',
        status: 'processing',
        analysis_data: null,
      });

      const result = await persistence.getAnalysisByCommit('sha-123');
      expect(result?.analysisDetails).toEqual([]);
    });
  });

  // ─── getAnalysisByJob ────────────────────────────────────────────

  describe('getAnalysisByJob', () => {
    it('should return null if no record found', async () => {
      mockExec.mockResolvedValue(null);

      const result = await persistence.getAnalysisByJob('job-abc');
      expect(result).toBeNull();
    });

    it('should extract scores from Global Maturity Score in summary or report', async () => {
      mockExec.mockResolvedValue({
        commit_id: 'sha-123',
        repository_url: 'https://github.com/owner/repo',
        job_id: 'job-abc',
        status: 'done',
        analysis_data: [
          { summary: 'Global Maturity Score: 82', report: '' },
          { summary: '', report: 'Global Maturity Score 67' },
          { summary: 'No score here', report: 'Nothing useful' },
        ],
      });

      const result = await persistence.getAnalysisByJob('job-abc');

      expect(result?.scores).toEqual([82, 67]);
    });

    it('should return empty scores if no Global Maturity Score found', async () => {
      mockExec.mockResolvedValue({
        commit_id: 'sha-123',
        repository_url: 'https://github.com/owner/repo',
        job_id: 'job-abc',
        status: 'processing',
        analysis_data: [{ summary: 'No score', report: 'Nothing' }],
      });

      const result = await persistence.getAnalysisByJob('job-abc');
      expect(result?.scores).toEqual([]);
    });

    it('should return empty scores if analysis_data is empty', async () => {
      mockExec.mockResolvedValue({
        commit_id: 'sha-123',
        repository_url: 'https://github.com/owner/repo',
        job_id: 'job-abc',
        status: 'processing',
        analysis_data: [],
      });

      const result = await persistence.getAnalysisByJob('job-abc');
      expect(result?.scores).toEqual([]);
    });
  });

  // ─── saveAnalysis ────────────────────────────────────────────────

  describe('saveAnalysis', () => {
    it('should call findOneAndUpdate with upsert and correct fields', async () => {
      mockExec.mockResolvedValue(undefined);

      const payload: AnalysisResponseDTO = {
        commitId: 'sha-123',
        repoUrl: 'https://github.com/owner/repo',
        jobId: 'job-abc',
        status: 'processing',
        date: new Date(),
      };

      await persistence.saveAnalysis(payload);

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { commit_id: 'sha-123' },
        expect.objectContaining({
          $set: expect.objectContaining({
            repository_url: payload.repoUrl,
            job_id: payload.jobId,
            status: payload.status,
          }),
        }),
        { upsert: true },
      );
    });

    it('should include analysis_data in $set when analysisDetails is provided', async () => {
      mockExec.mockResolvedValue(undefined);

      const payload: AnalysisResponseDTO = {
        commitId: 'sha-123',
        repoUrl: 'https://github.com/owner/repo',
        jobId: 'job-abc',
        status: 'done',
        analysisDetails: [{ summary: 'ok', report: 'ok' }],
        date: new Date(),
      };

      await persistence.saveAnalysis(payload);

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { commit_id: 'sha-123' },
        expect.objectContaining({
          $set: expect.objectContaining({ analysis_data: payload.analysisDetails }),
        }),
        { upsert: true },
      );
    });

    it('should NOT include analysis_data in $set when analysisDetails is undefined', async () => {
        mockExec.mockResolvedValue(undefined);

        const payload: AnalysisResponseDTO = {
            commitId: 'sha-123',
            repoUrl: 'https://github.com/owner/repo',
            jobId: 'job-abc',
            status: 'processing',
            date: new Date(),
        };

        await persistence.saveAnalysis(payload);

        const callArgs = (mockFindOneAndUpdate.mock.calls as any[][])[0][1];

        expect(callArgs.$set).not.toHaveProperty('analysis_data');
    });

    it('should rethrow errors from findOneAndUpdate', async () => {
      mockExec.mockRejectedValue(new Error('DB connection lost'));

      await expect(persistence.saveAnalysis({
        commitId: 'sha-123',
        repoUrl: '',
        status: 'processing',
        date: new Date(),
      })).rejects.toThrow('DB connection lost');
    });
  });

  // ─── getLastAnalysis ─────────────────────────────────────────────

  describe('getLastAnalysis', () => {
    it('should return null if no record found', async () => {
      mockExec.mockResolvedValue(null);

      const result = await persistence.getLastAnalysis('https://github.com/owner/repo');
      expect(result).toBeNull();
    });

    it('should sort by createdAt descending', async () => {
      mockExec.mockResolvedValue(null);

      await persistence.getLastAnalysis('https://github.com/owner/repo');

      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should extract scores correctly', async () => {
      mockExec.mockResolvedValue({
        repository_url: 'https://github.com/owner/repo',
        commit_id: 'sha-123',
        job_id: 'job-abc',
        status: 'done',
        analysis_data: [
          { summary: 'Global Maturity Score: 90', report: '' },
        ],
        createdAt: new Date(),
      });

      const result = await persistence.getLastAnalysis('https://github.com/owner/repo');
      expect(result?.scores).toEqual([90]);
    });

    it('should rethrow errors', async () => {
      mockExec.mockRejectedValue(new Error('Timeout'));

      await expect(
        persistence.getLastAnalysis('https://github.com/owner/repo')
      ).rejects.toThrow('Timeout');
    });
  });
});