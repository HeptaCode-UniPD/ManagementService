import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RequestDTO } from '../domain/dto/request.dto';
import { AnalysisResponseDTO } from '../domain/dto/analysisresponse.dto';
import { AnalysisManagementServiceInterface } from '../domain/interfaces/analysismanagementservice.interface';

@Controller('analysis')
export class AnalysisManagementPresentation {
  constructor(
    private readonly analysisService: AnalysisManagementServiceInterface,
  ) {}

  @Post('request')
  @HttpCode(HttpStatus.OK)
  async requestAnalysis(@Body() request: RequestDTO): Promise<AnalysisResponseDTO> {
    
    console.log(`[Presentation] Received request for Repo: ${request.getRepoUrl()}`);

    const response = await this.analysisService.startAnalysis(request);

    return response;
  }
}