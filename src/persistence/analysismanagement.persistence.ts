import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalysisManagementPersistenceInterface } from '../domain/interfaces/analysismanagementpersistence.interface';
import { RequestDTO } from '../domain/dto/request.dto';
import { PersistenceAdapter } from './adapter.persistence';
import { AnalysisResponseDTO } from '../domain/dto/analysisresponse.dto';

@Injectable()
export class AnalysisManagementPersistence implements AnalysisManagementPersistenceInterface {
  constructor(
    @InjectModel('Analysis') private readonly analysisModel: Model<any>,
    private readonly adapter: PersistenceAdapter,
  ) {}

  async check(request: RequestDTO): Promise<boolean> {
    const dbCriteria = this.adapter.internalToExternal(request);

    const existingRecord = await this.analysisModel
      .findOne({ commit_id: dbCriteria.commit_id })
      .exec();

    return !!existingRecord; 
  }

  async saveAnalysis(request: RequestDTO, analysis: any): Promise<void> {
    const dbData = this.adapter.internalToExternal(request);

    const newRecord = new this.analysisModel({
      ...dbData,
      result: analysis,
      updatedAt: new Date(),
    });

    await newRecord.save();
  }

  async getAnalysis(request: RequestDTO): Promise<AnalysisResponseDTO> {
    const dbCriteria = this.adapter.internalToExternal(request);

    const result = await this.analysisModel
        .findOne({ commit_id: dbCriteria.commit_id })
        .lean()
        .exec();

    return result.analysis_data as AnalysisResponseDTO;
    }
}