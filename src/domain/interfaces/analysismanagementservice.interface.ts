import { RequestDTO } from '../dto/request.dto'
import { AnalysisResponseDTO } from '../dto/analysisresponse.dto'

export abstract class AnalysisManagementServiceInterface {
    abstract exists(request: RequestDTO): Promise<Boolean>;
    abstract isLast(request: RequestDTO): Promise<Boolean>;
    abstract startAnalysis(request: RequestDTO): Promise<AnalysisResponseDTO>;
    abstract getAnalysis(request: RequestDTO): Promise<AnalysisResponseDTO>;
}