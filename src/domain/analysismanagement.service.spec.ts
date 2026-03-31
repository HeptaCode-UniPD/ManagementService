import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisManagementService } from './analysismanagement.service';
import { AnalysisManagementPersistenceInterface } from './interfaces/analysismanagementpersistence.interface';
import { AnalysisManagementInfrastructureInterface } from './interfaces/analysismanagementinfrastructure.interface';
import { RequestDTO } from './dto/request.dto';

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: { get: jest.fn(), getBranch: jest.fn() },
  })),
}));

describe('AnalysisManagementService', () => {
  let service: AnalysisManagementService;

  const mockPersistence = {
    check: jest.fn(),
    getAnalysis: jest.fn(),
    saveAnalysis: jest.fn(),
  };

  const mockInfra = {
    checkLastCommit: jest.fn(), 
    isLast: jest.fn(),
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
    const mockRequest = new RequestDTO();
    
    mockPersistence.check.mockResolvedValue(true);
    mockPersistence.getAnalysis.mockResolvedValue({ score: 95 });

    const result = await service.startAnalysis(mockRequest);

    expect(result.score).toBe(95);
    expect(mockPersistence.getAnalysis).toHaveBeenCalled();
  });

  it('should start a new analysis if NOT in DB and IS the latest commit', async () => {
    const mockRequest = new RequestDTO();
    mockRequest.setCommitId('new-sha-456');

    mockPersistence.check.mockResolvedValue(false); // Matches Service call
    
    const mockResponse = { status: 'newly_analyzed', score: 100 };
    mockInfra.startAnalysis.mockResolvedValue(mockResponse);
    mockPersistence.saveAnalysis.mockResolvedValue(undefined);

    await service.startAnalysis(mockRequest);

    expect(mockInfra.startAnalysis).toHaveBeenCalled();
    expect(mockPersistence.saveAnalysis).toHaveBeenCalled();
  });
});