import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisManagementService } from './analysismanagement.service';
import { AnalysisManagementPersistenceInterface } from './interfaces/analysismanagementpersistence.interface';
import { AnalysisManagementInfrastructureInterface } from './interfaces/analysismanagementinfrastructure.interface';
import { RequestDTO } from './dto/request.dto';

// Mock Octokit to handle ESM issues
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: { get: jest.fn(), getBranch: jest.fn() },
  })),
}));

describe('AnalysisManagementService', () => {
  let service: AnalysisManagementService;

  // Persistence Mock
  const mockPersistence = {
    check: jest.fn(),
    getAnalysis: jest.fn(),
    saveAnalysis: jest.fn(),
  };

  // Infrastructure Mock - NAMES MUST MATCH THE INTERFACE
  const mockInfra = {
    checkLastCommit: jest.fn(), // <--- ADDED THIS TO FIX THE TYPEERROR
    isLast: jest.fn(),
    startAnalysis: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // The Service we are testing
        AnalysisManagementService,
        // Mocking the Persistence Interface
        {
          provide: AnalysisManagementPersistenceInterface,
          useValue: mockPersistence,
        },
        // Mocking the Infrastructure Interface
        {
          provide: AnalysisManagementInfrastructureInterface,
          useValue: mockInfra,
        },
      ],
    }).compile();

    service = module.get<AnalysisManagementService>(AnalysisManagementService);
    
    // Clear all previous call counts and return values
    jest.resetAllMocks();
  });

  it('should return cached analysis if it already exists in DB', async () => {
    const mockRequest = new RequestDTO();
    
    // Setup mocks
    mockPersistence.check.mockResolvedValue(true);
    mockPersistence.getAnalysis.mockResolvedValue({ score: 95 });

    // Act
    const result = await service.startAnalysis(mockRequest);

    // Assert
    expect(result.score).toBe(95);
    expect(mockPersistence.getAnalysis).toHaveBeenCalled();
  });

  it('should start a new analysis if NOT in DB and IS the latest commit', async () => {
    const mockRequest = new RequestDTO();
    mockRequest.setCommitId('new-sha-456');

    // Force logic path: not in DB, is latest commit
    mockPersistence.check.mockResolvedValue(false); 
    mockInfra.checkLastCommit.mockResolvedValue(true); // Matches Service call
    
    const mockResponse = { status: 'newly_analyzed', score: 100 };
    mockInfra.startAnalysis.mockResolvedValue(mockResponse);
    mockPersistence.saveAnalysis.mockResolvedValue(undefined);

    // Act
    await service.startAnalysis(mockRequest);

    // Assert
    expect(mockInfra.startAnalysis).toHaveBeenCalled();
    expect(mockPersistence.saveAnalysis).toHaveBeenCalled();
  });
});