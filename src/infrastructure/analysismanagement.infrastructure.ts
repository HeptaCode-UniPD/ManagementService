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

  async startAnalysis(request: RequestDTO, commitId: string): Promise<void> {
    const gatewayUrl = process.env.GATEWAY_URL;
    const repoUrl = request.repoUrl;
    const jobId = request.jobId;

    if (!gatewayUrl) {
      throw new Error('GATEWAY_URL non configurato');
    }

    try {
      this.logger.log(`[Infrastructure] Notifico Lambda per l'analisi di: ${request.repoUrl}`);

      await firstValueFrom(
        this.httpService.post(gatewayUrl, {
          repoUrl,
          jobId,
          commitId,
        })
      );

      this.logger.log(`[Infrastructure] Notifica inviata con successo.`);

    } catch (error: unknown) {
      let errorMessage = 'Errore durante la notifica al gateway';

      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || error.message;
        this.logger.error(`[Infrastructure] Gateway Error: ${errorMessage}`);
      } else if (error instanceof Error) {
        errorMessage = error.message;
        this.logger.error(`[Infrastructure] System Error: ${errorMessage}`);
      }

      throw new Error(`Impossibile avviare l'analisi: ${errorMessage}`);
    }
  }
}