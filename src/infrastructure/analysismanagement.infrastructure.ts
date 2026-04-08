import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { AnalysisManagementInfrastructureInterface } from '../domain/interfaces/analysismanagementinfrastructure.interface';
import { GithubAdapter } from './github.adapter';
import { RequestDTO } from '../domain/dto/request.dto';

@Injectable()
export class AnalysisManagementInfrastructure extends AnalysisManagementInfrastructureInterface {
  private readonly logger = new Logger(AnalysisManagementInfrastructure.name);

  constructor(
    private readonly githubAdapter: GithubAdapter,
    private readonly httpService: HttpService,
  ) {
    super();
  }

  async getLatestCommitSha(repoUrl: string): Promise<string> {
    this.logger.log(`[Infrastructure] Fetching latest commit SHA for: ${repoUrl}`);
    const latestSha = await this.githubAdapter.getLatestCommit(repoUrl);
    this.logger.log(`[Infrastructure] Current GitHub SHA: ${latestSha}`);
    return latestSha;
  }

  async startAnalysis(request: RequestDTO): Promise<void> {
  const gatewayUrl = process.env.MS2_GATEWAY_URL;
  const apiKey = process.env.MS2_API_KEY;
  const repoUrl = request.repoUrl;
  const jobId = request.jobId;
  const commitSha = request.commitId; // ← usa quello già calcolato dal service, NON ricalcolarlo

  if (!gatewayUrl) { throw new Error('MS2_GATEWAY_URL non configurato'); }
  if (!apiKey) { throw new Error('MS2_API_KEY non configurato'); }

  try {
    this.logger.log(`[Infrastructure] Notifico Lambda per l'analisi di: ${repoUrl}`);

    await firstValueFrom(
      this.httpService.post(
        gatewayUrl,
        { repoUrl, jobId, commitSha },
        { headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' } }
      )
    );

    this.logger.log(`[Infrastructure] Notifica inviata con successo.`);
  } catch (error: unknown) {
    // ... resto invariato
  }
}
}
