import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';

export class RequestDTO {
  @IsUrl()
  @IsNotEmpty()
  repoUrl!: string;

  @IsOptional()
  @IsString()
  jobId?: string;
}