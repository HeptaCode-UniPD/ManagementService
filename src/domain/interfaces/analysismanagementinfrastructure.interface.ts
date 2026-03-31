import { RequestDTO } from '../dto/request.dto'
import { AnalysisResponseDTO } from '../dto/analysisresponse.dto'

export abstract class AnalysisManagementInfrastructureInterface {
    abstract checkLastCommit(request: RequestDTO): Promise<boolean>;
    abstract startAnalysis(request: RequestDTO): Promise<AnalysisResponseDTO>;
}