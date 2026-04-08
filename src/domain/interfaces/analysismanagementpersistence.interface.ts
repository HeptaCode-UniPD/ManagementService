import { RequestDTO } from '../dto/request.dto'
import { AnalysisResponseDTO } from '../dto/analysisresponse.dto'

export abstract class AnalysisManagementPersistenceInterface {
    abstract saveAnalysis(payload: AnalysisResponseDTO): Promise<void>;
    abstract updateAnalysisToError(jobId: string, errorMessage: string): Promise<void>; // NUOVO
    abstract getAnalysisByCommit(commitId: string): Promise<AnalysisResponseDTO | null>;
    abstract getAnalysisByJob(jobId: string): Promise<AnalysisResponseDTO | null>;
    abstract getLastAnalysis(repoUrl: string): Promise<AnalysisResponseDTO | null>;
}