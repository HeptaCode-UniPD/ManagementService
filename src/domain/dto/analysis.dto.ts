import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class AnalysisDTO {
  @IsUrl()
  @IsNotEmpty()
  repoUrl!: string;

  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @IsString()
  @IsNotEmpty()
  commitId!: string;

  date!: Date;
}