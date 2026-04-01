import { RequestDTO } from '../dto/request.dto'
import { AnalysisResponseDTO } from '../dto/analysisresponse.dto'

export abstract class AnalysisManagementPersistenceInterface {
    abstract saveAnalysis(commitId: string, analysis: AnalysisResponseDTO, repoUrl: string): Promise<void>;
    abstract getAnalysisByCommit(commitId: string): Promise<AnalysisResponseDTO | null>;
}