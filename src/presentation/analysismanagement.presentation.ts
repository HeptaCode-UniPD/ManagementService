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
  async viewLastAnalysis(@Query('url') repoUrl: string): Promise<AnalysisResponseDTO | null> {
    const response = await this.analysisService.getLastAnalysis(repoUrl);
    return response;
  }

 @Post('webhook')
@HttpCode(HttpStatus.OK)
async handleWebhook(
  @Headers() headers: Record<string, string>,
  @Body() payload: AnalysisResponseDTO
) {
  this.logger.log('Headers ricevuti: ' + JSON.stringify(headers));
  
  const apiKey = headers['x-ms1-key'];
  const expectedApiKey = process.env.MS1_API_KEY;

  if (!apiKey || apiKey !== expectedApiKey) {
    this.logger.error(`Accesso negato. Key ricevuta: ${apiKey}`);
    throw new UnauthorizedException('API Key non valida o mancante');
  }

  if (payload.analysisDetails) {
    this.logger.log(JSON.stringify(payload.analysisDetails, null, 2));
  }

  this.logger.log(JSON.stringify(payload));

  if(payload.error) {
    return {status: 'error', error: payload.error};
  }

  try {
    await this.analysisService.saveAnalysis(payload);
    return { status: 'success' };
  } catch (error) {
    this.logger.error("Errore nel salvataggio dell'analisi", error);
    throw new InternalServerErrorException('Errore nel salvataggio');
  }
}
}