import { RequestDTO } from '../dto/request.dto'
import { AnalysisResponseDTO } from '../dto/analysisresponse.dto'

export abstract class AnalysisManagementServiceInterface {
    abstract startAnalysis(repoUrl: string): Promise<AnalysisResponseDTO>;
}