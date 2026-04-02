import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class RequestDTO {
  @IsUrl()
  @IsNotEmpty()
  repoUrl!: string;

  @IsString()
  @IsNotEmpty()
  jobId!: string;
}