export class AnalysisDetail {
  agentName?: string;
  summary?: string;
  report?: string;
}

export class AnalysisResponseDTO {
  analysisDetails?: AnalysisDetail[];
  repoUrl?: string;
  commitId?: string;
  jobId?: string;
  status!: 'done' | 'processing' | 'error';
}