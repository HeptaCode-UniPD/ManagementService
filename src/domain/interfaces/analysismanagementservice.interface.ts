import { RequestDTO } from '../dto/request.dto'
import { AnalysisResponseDTO } from '../dto/analysisresponse.dto'
import { AnalysisDTO } from '../dto/analysis.dto' 

export abstract class AnalysisManagementServiceInterface {
    abstract startAnalysis(request: RequestDTO): Promise<AnalysisResponseDTO>;
    abstract saveAnalysis(payload: AnalysisResponseDTO): Promise<void>;
    abstract getLastAnalysis(repoUrl: string): Promise<AnalysisDTO | null>;
    abstract getAnalysisStatus(jobId: string): Promise<AnalysisResponseDTO>
}