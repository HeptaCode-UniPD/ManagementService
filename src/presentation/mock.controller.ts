import { Controller, Get, Post, Body, Param } from '@nestjs/common';

const PROCESSING_TICKS = 3;

@Controller('analysis')
export class AnalysisMockController {
  private readonly pollCount = new Map<string, number>();

  @Post('request')
  startAnalysis(@Body() body: { repoUrl: string }) {
    const jobId = `mock-job-${Date.now()}`;
    this.pollCount.set(jobId, 0);

    return {
      status: 'processing',
      repoUrl: body.repoUrl,
      commitId: 'mock-commit-abc123',
      jobId,
    };
  }

  @Get('status/:jobId')
  getStatus(@Param('jobId') jobId: string) {
    const count = this.pollCount.get(jobId) ?? 0;
    const next = count + 1;
    this.pollCount.set(jobId, next);

    const status = next >= PROCESSING_TICKS ? 'done' : 'processing';
    console.log(`[Mock] poll #${next} per jobId=${jobId} → ${status}`);

    return { status };
  }
}