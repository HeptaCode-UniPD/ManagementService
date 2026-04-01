import { RequestDTO } from '../dto/request.dto'
import { AnalysisResponseDTO } from '../dto/analysisresponse.dto'

export abstract class AnalysisManagement {
    abstract requestAnalysis(repoUrl: string): Promise<AnalysisResponseDTO>;
}