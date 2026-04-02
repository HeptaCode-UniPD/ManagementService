import { Controller, Post, Body, HttpCode, HttpStatus, Get, Query, Param } from '@nestjs/common';
import { RequestDTO } from '../domain/dto/request.dto';
import { AnalysisResponseDTO } from '../domain/dto/analysisresponse.dto';
import { AnalysisManagementServiceInterface } from '../domain/interfaces/analysismanagementservice.interface';
import { AnalysisDTO } from '../domain/dto/analysis.dto';
import { AnalysisManagement } from '../domain/interfaces/analysismanagement.interface';

@Controller('analysis')
export class AnalysisManagementPresentation implements AnalysisManagement{
  constructor(
    private readonly analysisService: AnalysisManagementServiceInterface,
  ) {}
  abstract: any;

  @Post('request')
  @HttpCode(HttpStatus.OK)
  async requestAnalysis(@Body() request: RequestDTO): Promise<AnalysisResponseDTO> {
    console.log('DEBUG request body:', request);
    return await this.analysisService.startAnalysis(request);
  }

  @Get('status/:jobId')
  @HttpCode(HttpStatus.OK)
  async getStatus(@Param('jobId') jobId: string): Promise<AnalysisResponseDTO> {
    return await this.analysisService.getAnalysisStatus(jobId);
  }

  @Get('view')
  @HttpCode(HttpStatus.OK)
  async viewLastAnalysis(@Query('url') repoUrl: string): Promise<AnalysisDTO | null> {
    const response = await this.analysisService.getLastAnalysis(repoUrl);
    return response;
  }

  @Post('webhook')
  async handleWebhook(@Body() payload: AnalysisResponseDTO) {
    console.log(`Ricevuti risultati per la repo: ${payload.repoUrl}`);
    
    await this.analysisService.saveAnalysis(payload);
    
    return { received: true };
  }
}