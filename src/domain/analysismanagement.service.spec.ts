import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisManagementService } from './analysismanagement.service';
import { AnalysisManagementPersistenceInterface } from './interfaces/analysismanagementpersistence.interface';
import { AnalysisManagementInfrastructureInterface } from './interfaces/analysismanagementinfrastructure.interface';

describe('AnalysisManagementService', () => {
  let service: AnalysisManagementService;

  const mockPersistence = {
    getAnalysisByCommit: jest.fn(),
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
        {
          provide: AnalysisManagementPersistenceInterface,
          useValue: mockPersistence,
        },
        {
          provide: AnalysisManagementInfrastructureInterface,
          useValue: mockInfra,
        },
      ],
    }).compile();

    service = module.get<AnalysisManagementService>(AnalysisManagementService);
    jest.resetAllMocks();
  });

  it('should return cached analysis if it already exists in DB', async () => {
    const repoUrl = 'https://github.com/owner/repo';
    
    mockInfra.getLatestCommitSha.mockResolvedValue('sha-123');
    mockPersistence.getAnalysisByCommit.mockResolvedValue({ 
      status: 'completed', 
      response: 'Cache found' 
    });

    const result = await service.startAnalysis(repoUrl);

    expect(mockInfra.getLatestCommitSha).toHaveBeenCalledWith(repoUrl);
    expect(mockPersistence.getAnalysisByCommit).toHaveBeenCalledWith('sha-123');
    expect(result.status).toBe('completed');
    
    expect(mockInfra.startAnalysis).not.toHaveBeenCalled();
  });

  it('should start a new analysis if NOT in DB', async () => {
    const repoUrl = 'https://github.com/owner/repo';

    mockInfra.getLatestCommitSha.mockResolvedValue('new-sha-456');
    mockPersistence.getAnalysisByCommit.mockResolvedValue(null);
    
    const mockNewAnalysis = { 
        status: 'processing', 
        response: 'Analysis started' 
    };
    mockInfra.startAnalysis.mockResolvedValue(mockNewAnalysis);
    mockPersistence.saveAnalysis.mockResolvedValue(undefined);

    const result = await service.startAnalysis(repoUrl);

    expect(mockInfra.startAnalysis).toHaveBeenCalledWith(repoUrl, 'new-sha-456');
    expect(mockPersistence.saveAnalysis).toHaveBeenCalledWith('new-sha-456', mockNewAnalysis);
    expect(result.status).toBe('processing');
  });
});