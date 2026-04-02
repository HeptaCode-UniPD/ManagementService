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

    console.log('DEBUG cachedAnalysis:', JSON.stringify(cachedAnalysis, null, 2));

    // Analisi già pronta e completa
    if (cachedAnalysis && cachedAnalysis.analysisDetails) {
      this.logger.log(`[Service] Analisi per il commit ${latestCommitId} già presente.`);
      return { status: 'done', repoUrl: request.repoUrl, commitId: latestCommitId };
    }

    // Analisi già in corso
    if (cachedAnalysis && !cachedAnalysis.analysisDetails) {
      this.logger.log(`[Service] Analisi per il commit ${latestCommitId} già in corso.`);
      return { status: 'processing', repoUrl: request.repoUrl, commitId: latestCommitId, jobId: latestCommitId };
    }

    // Nuova analisi
    this.logger.log(`[Service] Avvio nuova analisi per il commit ${latestCommitId}...`);
    const initialPayload: AnalysisResponseDTO = {
      status: 'processing',
      repoUrl: request.repoUrl,
      commitId: latestCommitId,
      analysisDetails: [],
    };

    await this.database.saveAnalysis(initialPayload);
    await this.infrastructure.startAnalysis(request, latestCommitId);

    return { status: 'processing', repoUrl: request.repoUrl, commitId: latestCommitId, jobId: latestCommitId };
  }

  async handleWebhookResponse(payload: AnalysisResponseDTO): Promise<void> {
    this.logger.log(`[Service] Ricevuto Webhook per il repo: ${payload.repoUrl}`);

    await this.database.saveAnalysis(payload);
    
    this.logger.log(`[Service] Risultati dell'analisi salvati correttamente per ${payload.repoUrl}`);
  }

  async saveAnalysis(payload: AnalysisResponseDTO): Promise<void> {
    await this.database.saveAnalysis(payload);
  }

  async getAnalysisStatus(jobId: string): Promise<AnalysisResponseDTO> {
    const analysis = await this.database.getAnalysisByCommit(jobId);

    if (!analysis) {
      return { status: 'error', repoUrl: '' };
    }

    const isDone = analysis.analysisDetails && analysis.analysisDetails.length > 0;
    return {
      status: isDone ? 'done' : 'processing',
      repoUrl: analysis.repoUrl,
      commitId: jobId,
    };
  }

  async getLastAnalysis(repoUrl: string): Promise<AnalysisDTO | null> {
    return await this.database.getLastAnalysis(repoUrl);
  }
}