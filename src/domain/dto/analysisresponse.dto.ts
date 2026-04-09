import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalysisDetail {
  @ApiProperty({ description: 'Name of the analysis agent', example: 'CodeQualityAgent' })
  agentName?: string;
  
  @ApiProperty({ description: 'Short summary of the analysis', example: 'Potential security vulnerability found' })
  summary?: string;
  
  @ApiProperty({ description: 'Full report from the agent', example: 'Detailed analysis of the code...' })
  report?: string;
}

export class AnalysisResponseDTO {
  @ApiProperty({ type: [AnalysisDetail], description: 'List of detailed analysis from different agents' })
  analysisDetails?: AnalysisDetail[];

  @ApiProperty({ description: 'The repository URL analyzed', example: 'https://github.com/user/repo' })
  repoUrl?: string;

  @ApiProperty({ description: 'The specific commit ID analyzed', example: 'a1b2c3d4e5f6' })
  commitId?: string;

  @ApiProperty({ description: 'The unique job ID for this analysis', example: 'job-789' })
  jobId?: string;

  @ApiProperty({ enum: ['done', 'processing', 'error'], description: 'Current status of the analysis' })
  status!: 'done' | 'processing' | 'error';

  @ApiPropertyOptional({ description: 'Error message if status is error', example: 'Failed to clone repository' })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({ type: [Number], description: 'Scoring results', example: [85, 90, 78] })
  scores?: number[];

  @ApiProperty({ description: 'Date and time of the analysis', example: '2024-03-20T10:00:00Z' })
  date!: Date;

  @ApiPropertyOptional({ description: 'Whether this is the latest analysis for the repository', example: true })
  isLatest?: boolean;
}