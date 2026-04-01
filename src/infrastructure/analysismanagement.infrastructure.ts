import { Injectable } from '@nestjs/common';
import { AnalysisManagementInfrastructureInterface } from '../domain/interfaces/analysismanagementinfrastructure.interface';
import { GithubAdapter } from './github.adapter';
import { AnalysisResponseDTO } from '../domain/dto/analysisresponse.dto';
import { RequestDTO } from '../domain/dto/request.dto';

@Injectable()
export class AnalysisManagementInfrastructure extends AnalysisManagementInfrastructureInterface {
  constructor(
    private readonly githubAdapter: GithubAdapter,
  ) {
    super();
  }

  async getLatestCommitSha(repoUrl: string): Promise<string> {
    console.log(`[Infrastructure] Fetching latest commit SHA for: ${repoUrl}`);
    
    const latestSha = await this.githubAdapter.getLatestCommit(repoUrl);
    
    console.log(`[Infrastructure] Current GitHub SHA: ${latestSha}`);
    return latestSha;
  }

  async startAnalysis(repoUrl: string, commitId: string): Promise<AnalysisResponseDTO> {
      return {
        status: 'mock',
        response: `Analisi mock per commit ${commitId}. Il microservizio LLM non è ancora implementato.`
      };
  }
}