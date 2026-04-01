import { Injectable } from '@nestjs/common';
import { AnalysisManagementServiceInterface } from './interfaces/analysismanagementservice.interface';
import { AnalysisManagementPersistenceInterface } from './interfaces/analysismanagementpersistence.interface';
import { AnalysisManagementInfrastructureInterface } from './interfaces/analysismanagementinfrastructure.interface';
import { RequestDTO } from './dto/request.dto';
import { AnalysisResponseDTO } from './dto/analysisresponse.dto';

@Injectable()
export class AnalysisManagementService implements AnalysisManagementServiceInterface {
  constructor(
    private readonly database: AnalysisManagementPersistenceInterface,
    private readonly infrastructure: AnalysisManagementInfrastructureInterface,
  ) {}
  async startAnalysis(repoUrl: string): Promise<AnalysisResponseDTO> {

    const latestCommitId = await this.infrastructure.getLatestCommitSha(repoUrl);

    const cachedAnalysis = await this.database.getAnalysisByCommit(latestCommitId);

    if (cachedAnalysis) {
      console.log(`[Service] Commit ${latestCommitId} already analyzed. Returning cache.`);
      return cachedAnalysis;
    }

    console.log(`[Service] New commit ${latestCommitId} detected. Starting analysis...`);
    const newAnalysis = await this.infrastructure.startAnalysis(repoUrl, latestCommitId);

    await this.database.saveAnalysis(latestCommitId, newAnalysis);

    return newAnalysis;
  }
}