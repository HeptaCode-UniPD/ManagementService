import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisManagementPresentation } from './analysismanagement.presentation';
import { AnalysisManagementServiceInterface } from '../domain/interfaces/analysismanagementservice.interface';
import { UnauthorizedException, InternalServerErrorException } from '@nestjs/common';

describe('AnalysisManagementPresentation', () => {
  let controller: AnalysisManagementPresentation;
  let service: AnalysisManagementServiceInterface;

  const mockService = {
    startAnalysis: jest.fn(),
    getAnalysisStatus: jest.fn(),
    getLastAnalysis: jest.fn(),
    saveAnalysis: jest.fn(),
  };

  beforeEach(async () => {
    process.env.MS1_API_KEY = 'secret-key'; // Mock della variabile d'ambiente

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisManagementPresentation],
      providers: [
        { provide: AnalysisManagementServiceInterface, useValue: mockService },
      ],
    }).compile();

    controller = module.get<AnalysisManagementPresentation>(AnalysisManagementPresentation);
    service = module.get<AnalysisManagementServiceInterface>(AnalysisManagementServiceInterface);
  });

  describe('handleWebhook', () => {
    const validPayload = { jobId: '123', status: 'done' };

    it('should throw UnauthorizedException if API Key is missing', async () => {
      await expect(controller.handleWebhook({}, validPayload as any))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if API Key is wrong', async () => {
      const headers = { 'x-ms1-key': 'wrong-key' };
      await expect(controller.handleWebhook(headers, validPayload as any))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should call service.saveAnalysis if API Key is valid', async () => {
      const headers = { 'x-ms1-key': 'secret-key' };
      mockService.saveAnalysis.mockResolvedValue(undefined);

      const result = await controller.handleWebhook(headers, validPayload as any);

      expect(service.saveAnalysis).toHaveBeenCalledWith(validPayload);
      expect(result).toEqual({ status: 'success' });
    });

    it('should throw InternalServerErrorException if service fails', async () => {
      const headers = { 'x-ms1-key': 'secret-key' };
      mockService.saveAnalysis.mockRejectedValue(new Error('DB Fail'));

      await expect(controller.handleWebhook(headers, validPayload as any))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('viewLastAnalysis', () => {
    it('should return service response', async () => {
      const mockResponse = { jobId: 'abc' };
      mockService.getLastAnalysis.mockResolvedValue(mockResponse);

      const result = await controller.viewLastAnalysis('http://repo.com');
      expect(result).toBe(mockResponse);
    });
  });
});