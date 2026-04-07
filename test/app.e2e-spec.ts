import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common'; // Aggiunto Logger
import request from 'supertest';
import { AnalysisManagementPresentation } from '../src/presentation/analysismanagement.presentation';
import { AnalysisManagementService } from '../src/domain/analysismanagement.service';
import { GithubAdapter } from '../src/infrastructure/github.adapter';
import { AnalysisManagementServiceInterface } from '../src/domain/interfaces/analysismanagementservice.interface';
import { AnalysisManagementPersistenceInterface } from '../src/domain/interfaces/analysismanagementpersistence.interface';
import { AnalysisManagementInfrastructureInterface } from '../src/domain/interfaces/analysismanagementinfrastructure.interface';

describe('AnalysisManagement (e2e)', () => {
  let app: INestApplication;

  const mockInfrastructure = { 
    getLatestCommitSha: jest.fn().mockResolvedValue('sha-123'),
    getLatestCommit: jest.fn().mockResolvedValue('sha-123'), 
    startAnalysis: jest.fn().mockResolvedValue({ jobId: 'mock-id', status: 'processing' }), 
    getAnalysisStatus: jest.fn().mockResolvedValue({ status: 'done' }) 
  };
  
  const mockPersistence = { 
    saveAnalysis: jest.fn().mockResolvedValue(true), 
    getLastAnalysis: jest.fn().mockResolvedValue(null),
    getAnalysisByCommit: jest.fn().mockResolvedValue(null), 
  };

  const mockGithubAdapter = { 
    getLatestCommit: jest.fn().mockResolvedValue('sha-123') 
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisManagementPresentation],
      providers: [
        { provide: AnalysisManagementServiceInterface, useClass: AnalysisManagementService },
        { provide: AnalysisManagementPersistenceInterface, useValue: mockPersistence },
        { provide: AnalysisManagementInfrastructureInterface, useValue: mockInfrastructure },
        { provide: GithubAdapter, useValue: mockGithubAdapter },
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() } },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it('/analysis/request (POST) - Success', async () => {
    const response = await request(app.getHttpServer())
      .post('/analysis/request')
      .send({ repoUrl: 'https://github.com/owner/repo' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('jobId');
    expect(typeof response.body.jobId).toBe('string');
    expect(response.body.status).toBe('processing');
  });

  it('/analysis/webhook (POST) - Unauthorized without API Key', () => {
    return request(app.getHttpServer())
      .post('/analysis/webhook')
      .send({ jobId: '123', status: 'done' })
      .expect(401);
  });

  it('/analysis/webhook (POST) - Success with API Key', () => {
    const apiKey = 'test-key';
    process.env.MS1_API_KEY = apiKey;
    return request(app.getHttpServer())
      .post('/analysis/webhook')
      .set('x-ms1-key', apiKey)
      .send({ 
        jobId: '123', 
        status: 'done',
        date: new Date() // Aggiunto per il DTO
      })
      .expect(200);
  });

  afterAll(async () => {
    if (app) await app.close();
  });
});