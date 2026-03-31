import { RequestDTO } from '../dto/request.dto'
import { AnalysisResponseDTO } from '../dto/analysisresponse.dto'

export abstract class AnalysisManagementPersistenceInterface {
    abstract check(request: RequestDTO): Promise<boolean>;
    abstract saveAnalysis(request: RequestDTO, analysis: AnalysisResponseDTO): Promise<void>;
    abstract getAnalysis(request: RequestDTO): Promise<AnalysisResponseDTO>;
}