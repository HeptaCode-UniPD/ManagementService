import { Injectable, Logger } from '@nestjs/common';
import { AnalysisManagementServiceInterface } from './interfaces/analysismanagementservice.interface';
import { AnalysisManagementPersistenceInterface } from './interfaces/analysismanagementpersistence.interface';
import { AnalysisManagementInfrastructureInterface } from './interfaces/analysismanagementinfrastructure.interface';
import { AnalysisResponseDTO } from './dto/analysisresponse.dto';
import { randomUUID } from 'node:crypto';
import { RequestDTO } from './dto/request.dto';

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

    // Se esiste un'analisi precedente e NON è in errore, verifichiamo se è completata o in corso
    if (cachedAnalysis && cachedAnalysis.status !== 'error') {
      if (cachedAnalysis.analysisDetails && cachedAnalysis.analysisDetails.length > 0) {
        this.logger.log(`[Service] Analisi per il commit ${latestCommitId} già presente e completata.`);
        return { status: 'done', repoUrl: request.repoUrl, commitId: latestCommitId, jobId: cachedAnalysis.jobId, date: new Date() };
      } else {
        this.logger.log(`[Service] Analisi per il commit ${latestCommitId} già in corso.`);
        return { status: 'processing', repoUrl: request.repoUrl, commitId: latestCommitId, jobId: cachedAnalysis.jobId, date: new Date() };
      }
    }

    // Se arriviamo qui, significa che non c'è nessuna analisi pregressa, 
    // OPPURE l'analisi pregressa aveva status === 'error' e quindi dobbiamo rifarla.
    if (cachedAnalysis && cachedAnalysis.status === 'error') {
      this.logger.warn(`[Service] Trovata analisi precedente in errore per il commit ${latestCommitId}. Ne avvio una nuova.`);
    }

    const jobId = randomUUID();
    this.logger.log(`[Service] Avvio nuova analisi per il commit ${latestCommitId} con jobId ${jobId}...`);

    await this.database.saveAnalysis({
      jobId,
      status: 'processing',
      repoUrl: request.repoUrl,
      commitId: latestCommitId,
      date: new Date(),
    });

    request.jobId = jobId;
    
    this.infrastructure.startAnalysis(request).catch(error => {
      this.logger.error(`[Service] Fallimento asincrono nell'avvio dell'analisi per ${jobId}: ${error.message}`);
    });

    // Risponde immediatamente al chiamante evitando il 504
    return { status: 'processing', repoUrl: request.repoUrl, commitId: latestCommitId, jobId, date: new Date() };
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
    const analysis = await this.database.getAnalysisByJob(jobId);

    if (!analysis) {
      return { status: 'error', repoUrl: '', date: new Date() };
    }

    if (analysis.status === 'error') {
      return {
        status: 'error',
        repoUrl: analysis.repoUrl,
        commitId: analysis.commitId,
        jobId,
        date: analysis.date,
      };
    }

    const isDone = analysis.analysisDetails && analysis.analysisDetails.length > 0;
    return {
      status: isDone ? 'done' : 'processing',
      repoUrl: analysis.repoUrl,
      commitId: analysis.commitId,
      jobId,
      date: analysis.date,
    };
  }

  async getLastAnalysis(repoUrl: string): Promise<AnalysisResponseDTO | null> {
  const lastAnalysis = await this.database.getLastAnalysis(repoUrl);

  if (!lastAnalysis) return null;

  const latestCommitId = await this.infrastructure.getLatestCommitSha(repoUrl);
  const isLatest = lastAnalysis.commitId === latestCommitId;

  this.logger.log(`[Service] Commit in DB: ${lastAnalysis.commitId} | Commit GitHub: ${latestCommitId} | isLatest: ${isLatest}`);

  return {
    ...lastAnalysis,
    isLatest,
  };
}
}