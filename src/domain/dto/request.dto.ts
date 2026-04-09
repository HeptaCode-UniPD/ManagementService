import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestDTO {
  @ApiProperty({
    description: 'The URL of the GitHub repository to analyze',
    example: 'https://github.com/user/repo',
  })
  @IsUrl()
  @IsNotEmpty()
  repoUrl!: string;

  @ApiPropertyOptional({
    description: 'The job ID for the analysis task',
    example: 'job-12345',
  })
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiPropertyOptional({
    description: 'The specific commit ID to analyze',
    example: 'a1b2c3d4',
  })
  commitId?: any;
}