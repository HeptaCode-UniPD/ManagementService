import { 
  Controller, Post, Body, HttpCode, HttpStatus, Get, Query, Param, 
  Headers, UnauthorizedException, InternalServerErrorException, Logger 
} from '@nestjs/common';
import { RequestDTO } from '../domain/dto/request.dto';
import { AnalysisResponseDTO } from '../domain/dto/analysisresponse.dto';
import { AnalysisManagementServiceInterface } from '../domain/interfaces/analysismanagementservice.interface';
import { AnalysisDTO } from '../domain/dto/analysis.dto';
import { AnalysisManagement } from '../domain/interfaces/analysismanagement.interface';

@Controller('analysis')
export class AnalysisManagementPresentation implements AnalysisManagement{
  private readonly logger = new Logger(AnalysisManagementPresentation.name);
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
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Headers('x-api-key') apiKey: string, @Body() payload: AnalysisResponseDTO) {

    if(payload.analysisDetails) {
      this.logger.log(JSON.stringify(payload.analysisDetails, null, 2));
    }

    const expectedApiKey = process.env.MS1_API_KEY;

    if (!apiKey || apiKey !== expectedApiKey) {
      this.logger.error(`Accesso negato. Key ricevuta: ${apiKey}`);
      throw new UnauthorizedException('API Key non valida o mancante');
    }

    try {
      await this.analysisService.saveAnalysis(payload);
      return { status: 'success' };
    } catch (error) {
      this.logger.error('Errore nel salvataggio dell\'analisi', error);
      throw new InternalServerErrorException('Errore nel salvataggio');
    }
  }
}