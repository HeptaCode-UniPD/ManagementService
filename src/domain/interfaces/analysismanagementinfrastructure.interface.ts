import { RequestDTO } from '../dto/request.dto'
import { AnalysisResponseDTO } from '../dto/analysisresponse.dto'

export abstract class AnalysisManagementInfrastructureInterface {
    abstract startAnalysis(repoUrl: string, commitId: string): Promise<AnalysisResponseDTO>;
    abstract getLatestCommitSha(repoUrl: string): Promise<string>;
}