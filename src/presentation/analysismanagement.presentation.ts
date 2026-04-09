import { 
  Controller, Post, Body, HttpCode, HttpStatus, Get, Query, Param, 
  Headers, UnauthorizedException, InternalServerErrorException, Logger 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RequestDTO } from '../domain/dto/request.dto';
import { AnalysisResponseDTO } from '../domain/dto/analysisresponse.dto';
import { AnalysisManagementServiceInterface } from '../domain/interfaces/analysismanagementservice.interface';
import { AnalysisManagement } from '../domain/interfaces/analysismanagement.interface';

@ApiTags('Analysis')
@Controller('analysis')
export class AnalysisManagementPresentation implements AnalysisManagement {
  private readonly logger = new Logger(AnalysisManagementPresentation.name);
  constructor(
    private readonly analysisService: AnalysisManagementServiceInterface,
  ) {}
  abstract: any;

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a new repository analysis' })
  @ApiResponse({ status: 200, description: 'Analysis request started successfully', type: AnalysisResponseDTO })
  async requestAnalysis(@Body() request: RequestDTO): Promise<AnalysisResponseDTO> {
    console.log('DEBUG request body:', request);
    return await this.analysisService.startAnalysis(request);
  }

  @Get('status/:jobId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the status of an analysis job' })
  @ApiParam({ name: 'jobId', description: 'The unique ID of the analysis job' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully', type: AnalysisResponseDTO })
  async getStatus(@Param('jobId') jobId: string): Promise<AnalysisResponseDTO> {
    return await this.analysisService.getAnalysisStatus(jobId);
  }

  @Get('view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'View the last analysis for a repository' })
  @ApiQuery({ name: 'url', description: 'The absolute URL of the repository' })
  @ApiResponse({ status: 200, description: 'Latest analysis retrieved successfully', type: AnalysisResponseDTO })
  async viewLastAnalysis(@Query('url') repoUrl: string): Promise<AnalysisResponseDTO | null> {
    const response = await this.analysisService.getLastAnalysis(repoUrl);
    return response;
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook for receiving analysis results' })
  @ApiHeader({ name: 'x-ms1-key', description: 'Security key for authentication' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid API key' })
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

    try {
      await this.analysisService.saveAnalysis(payload);
      return { status: 'success' };
    } catch (error) {
      this.logger.error("Errore nel salvataggio dell'analisi", error);
      throw new InternalServerErrorException('Errore nel salvataggio');
    }
  }
}
