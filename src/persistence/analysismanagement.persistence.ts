import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalysisManagementPersistenceInterface } from '../domain/interfaces/analysismanagementpersistence.interface';
import { AnalysisDetail, AnalysisResponseDTO } from '../domain/dto/analysisresponse.dto';

@Injectable()
export class AnalysisManagementPersistence extends AnalysisManagementPersistenceInterface {

  private readonly logger = new Logger(AnalysisManagementPersistence.name);

  constructor(
    @InjectModel('Analysis') private readonly analysisModel: Model<any>,
  ) {
    super();
  }

  async getAnalysisByCommit(commitId: string): Promise<AnalysisResponseDTO | null> {
    const record = await this.analysisModel
      .findOne({ commit_id: commitId })
      .lean()
      .exec();

    if (!record) return null;

    return {
      commitId: record.commit_id,
      repoUrl: record.repository_url,
      jobId: record.job_id,
      status: record.status,
      analysisDetails: record.analysis_data ?? [],
      date: record.createdAt ?? new Date(),
      error: record.error_message, // <--- AGGIUNTO
    };
  }

  async getAnalysisByJob(jobId: string): Promise<AnalysisResponseDTO | null> {
  const record = await this.analysisModel
    .findOne({ job_id: jobId })
    .lean()
    .exec();

  if (!record) return null;

  const analysisDetails: AnalysisDetail[] = record.analysis_data ?? [];

  const scores = analysisDetails
  .map(detail => {
    const text = `${detail.summary ?? ''} ${detail.report ?? ''}`;
    const match = text.match(/Global Maturity Score[:\s*]*(\d+)/i);
    return match ? parseInt(match[1]) : null;
  })
  .filter((score): score is number => score !== null);

  return {
      commitId: record.commit_id,
      repoUrl: record.repository_url,
      jobId: record.job_id,
      status: record.status,
      analysisDetails,
      scores,
      date: record.createdAt ?? new Date(),
      error: record.error_message, // <--- AGGIUNTO
    };
}

  // src/persistence/analysismanagement.persistence.ts

async saveAnalysis(payload: AnalysisResponseDTO): Promise<void> {
  const updateData = {
    job_id: payload.jobId,
    status: payload.status,
    repository_url: payload.repoUrl,
    // Se lo stato è processing, resettiamo esplicitamente errori o dati vecchi
    ...(payload.status === 'processing' ? { analysis_data: [], error_message: null } : {}),
    // Se è un errore, aggiorniamo solo il campo messaggio
    ...(payload.error && { error_message: payload.error }),
    // Se l'analisi è conclusa, salviamo i dettagli
    ...(payload.analysisDetails && { analysis_data: payload.analysisDetails }),
    updatedAt: new Date(),
  };

  await this.analysisModel.findOneAndUpdate(
    { commit_id: payload.commitId.trim() }, // Identifica univocamente l'analisi
    { $set: updateData },
    { upsert: true, new: true }
  ).exec();
}

  async getLastAnalysis(repoUrl: string): Promise<AnalysisResponseDTO | null> {
  try {
    const record = await this.analysisModel
      .findOne({ repository_url: repoUrl })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (!record) {
      this.logger.warn(`[Persistence] Nessuna analisi trovata per il repo: ${repoUrl}`);
      return null;
    }

    const analysisDetails: AnalysisDetail[] = record.analysis_data ?? [];

    this.logger.log('record.analysis_data: ' + JSON.stringify(record.analysis_data));

    const scores = analysisDetails
      .map(detail => {
        const text = `${detail.summary ?? ''} ${detail.report ?? ''}`;
        const match = text.match(/Global Maturity Score[:\s*]*(\d+)/i);
        return match ? parseInt(match[1]) : null;
      })
      .filter((score): score is number => score !== null);

    return {
      repoUrl: record.repository_url,
      jobId: record.job_id,
      commitId: record.commit_id,
      status: record.status,
      analysisDetails,
      scores,
      date: record.createdAt ?? new Date(),
      error: record.error_message, // <--- AGGIUNTO
    };
  } catch (error: unknown) {
    this.logger.error(`[Persistence] Errore nel recupero dell'ultima analisi: ${error}`);
    throw error;
  }
}
}