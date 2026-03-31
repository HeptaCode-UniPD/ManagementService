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

  async exists(request: RequestDTO): Promise<boolean> {
    return await this.database.check(request);
  }

  async isLast(request: RequestDTO): Promise<boolean> {
    return await this.infrastructure.checkLastCommit(request);
  }

  async getAnalysis(request: RequestDTO): Promise<AnalysisResponseDTO> {
    return await this.database.getAnalysis(request);
  }

  async startAnalysis(request: RequestDTO): Promise<AnalysisResponseDTO> {

    const alreadyAnalyzed = await this.exists(request);

    const isLatest = await this.isLast(request);

    if(!alreadyAnalyzed&& isLatest) {
      console.log('New commit detected and it is the latest. Starting analysis...');
      
      const result = await this.infrastructure.startAnalysis(request);
      
      await this.database.saveAnalysis(request, result);
      
      return result;
    }

    if (alreadyAnalyzed) {
        console.log('Returning cached analysis from DB.');

        return this.getAnalysis(request);
    }

    const response = await this.infrastructure.startAnalysis(request);

    return response;
  }
}