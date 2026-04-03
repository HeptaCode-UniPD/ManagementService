import { RequestDTO } from '../dto/request.dto'

export abstract class AnalysisManagementInfrastructureInterface {
    abstract startAnalysis(request: RequestDTO): Promise<void>;
    abstract getLatestCommitSha(repoUrl: string): Promise<string>;
}