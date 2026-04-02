import { Injectable, Logger } from '@nestjs/common';
import { AnalysisManagementServiceInterface } from './interfaces/analysismanagementservice.interface';
import { AnalysisManagementPersistenceInterface } from './interfaces/analysismanagementpersistence.interface';
import { AnalysisManagementInfrastructureInterface } from './interfaces/analysismanagementinfrastructure.interface';
import { AnalysisResponseDTO } from './dto/analysisresponse.dto';
import { RequestDTO } from './dto/request.dto';
import { AnalysisDTO } from './dto/analysis.dto';

@Injectable()
export class AnalysisManagementService implements AnalysisManagementServiceInterface {
  private readonly logger = new Logger(AnalysisManagementService.name);

  constructor(
    private readonly database: AnalysisManagementPersistenceInterface,
    private readonly infrastructure: AnalysisManagementInfrastructureInterface,
  ) {}

  async startAnalysis(request: RequestDTO): Promise<AnalysisResponseDTO> {
    const latestCommitId = await this.infrastructure.getLatestCommitSha(request.repoUrl);

    const cachedAnalysis = await this.database.getAnalysisByCommit(latestCommitId);

  if (cachedAnalysis && cachedAnalysis.analysisDetails!.length > 0) {
    this.logger.log(`[Service] Analisi per il commit ${latestCommitId} già presente.`);
    return cachedAnalysis;
  }
    this.logger.log(`[Service] Avvio nuova analisi per il commit ${latestCommitId}...`);

    const initialPayload: AnalysisResponseDTO = {
      repoUrl: request.repoUrl,
      analysisDetails: []
    };

    await this.database.saveAnalysis(initialPayload);

    await this.infrastructure.startAnalysis(request, latestCommitId);

    return initialPayload;
  }

  async handleWebhookResponse(payload: AnalysisResponseDTO): Promise<void> {
    this.logger.log(`[Service] Ricevuto Webhook per il repo: ${payload.repoUrl}`);

    await this.database.saveAnalysis(payload);
    
    this.logger.log(`[Service] Risultati dell'analisi salvati correttamente per ${payload.repoUrl}`);
  }

  async saveAnalysis(payload: AnalysisResponseDTO): Promise<void> {
    await this.database.saveAnalysis(payload);
  }

  async getAnalysisStatus(jobId: string): Promise<AnalysisResponseDTO | null> {
    this.logger.log(`[Service] Controllo stato analisi per commit: ${jobId}`);
    
    const analysis = await this.database.getAnalysisByCommit(jobId);
    
    return analysis; 
  }

  async getLastAnalysis(repoUrl: string): Promise<AnalysisDTO | null> {
    return await this.database.getLastAnalysis(repoUrl);
  }
}