import { Injectable } from '@nestjs/common';
import { AnalysisManagementInfrastructureInterface } from '../domain/interfaces/analysismanagementinfrastructure.interface';
import { GithubAdapter } from './github.adapter';
import { RequestDTO } from '../domain/dto/request.dto';
import { AnalysisResponseDTO } from '../domain/dto/analysisresponse.dto';

@Injectable()
export class AnalysisManagementInfrastructure extends AnalysisManagementInfrastructureInterface {
  constructor(
    private readonly githubAdapter: GithubAdapter,
  ) {
    super();
  }

  async checkLastCommit(request: RequestDTO): Promise<boolean> {
    console.log(`[Infrastructure] Checking if ${request.getCommitId()} is the latest commit...`);

    const latestCommitSha = await this.githubAdapter.getLatestCommit(
      request.getRepoUrl(),
      request.getUserToken()
    );

    const isLatest = request.getCommitId() === latestCommitSha;

    if (!isLatest) {
      console.warn(`[Infra] Validation failed: Request commit is NOT the latest.`);
    }

    return isLatest;
  }

  async startAnalysis(request: RequestDTO): Promise<AnalysisResponseDTO> {
    throw new Error('Method not implemented.');
  }
}