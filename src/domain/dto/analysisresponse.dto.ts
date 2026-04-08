import { IsOptional, IsString } from 'class-validator'; // Assicurati di importare questi

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
  @IsOptional()
  @IsString()
  error?: string; // Aggiungi questi decoratori      
  scores?: number[];
  date!: Date;
  isLatest?: boolean; // true se il commit in DB == ultimo commit su GitHub
}