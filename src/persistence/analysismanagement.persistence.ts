import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalysisManagementPersistenceInterface } from '../domain/interfaces/analysismanagementpersistence.interface';
import { AnalysisResponseDTO } from '../domain/dto/analysisresponse.dto';
import { RequestDTO } from '../domain/dto/request.dto';

@Injectable()
export class AnalysisManagementPersistence extends AnalysisManagementPersistenceInterface {
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

    return record.analysis_data as AnalysisResponseDTO;
  }

  async saveAnalysis(commitId: string, analysis: AnalysisResponseDTO): Promise<void> {
    const newRecord = new this.analysisModel({
      commit_id: commitId,
      analysis_data: analysis, // Storing the whole DTO
      updatedAt: new Date(),
    });

    await newRecord.save();
  }
}