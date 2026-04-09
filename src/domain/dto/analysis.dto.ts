import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalysisDTO {
  @ApiProperty({
    description: 'The URL of the repository',
    example: 'https://github.com/user/repo',
  })
  @IsUrl()
  @IsNotEmpty()
  repoUrl!: string;

  @ApiProperty({
    description: 'The unique job ID',
    example: 'job-12345',
  })
  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @ApiProperty({
    description: 'The commit hash',
    example: 'a1b2c3d4',
  })
  @IsString()
  @IsNotEmpty()
  commitId!: string;

  @ApiProperty({
    description: 'Date of the analysis',
    example: '2024-03-20T10:00:00Z',
  })
  date!: Date;
}