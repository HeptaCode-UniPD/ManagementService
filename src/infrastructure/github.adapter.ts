import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import type { Octokit } from '@octokit/rest';

@Injectable()
export class GithubAdapter {
  private octokit!: any;

  private async getOctokit(): Promise<Octokit> {
    if (!this.octokit) {
      const { Octokit } = require('@octokit/rest');
      this.octokit = new Octokit();
    }
    return this.octokit;
  }

  async getLatestCommit(repoUrl: string): Promise<string> {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    const octokit = await this.getOctokit();
    try {
      const { data: repoData } = await octokit.repos.get({ owner, repo });

      const { data: branchData } = await octokit.repos.getBranch({
        owner,
        repo,
        branch: repoData.default_branch,
      });

      return branchData.commit.sha;

    } catch (error: any) {
      this.handleError(error);
    }
  }

  private parseRepoUrl(url: string): { owner: string; repo: string } {
    try {
      const cleanUrl = url.startsWith('http') ? url : `https://github.com/${url}`;
      const path = new URL(cleanUrl).pathname;
      const [owner, repo] = path.split('/').filter(Boolean);

      if (!owner || !repo) throw new Error();

      return { owner, repo };
    } catch (e) {
      throw new HttpException('Invalid GitHub Repository URL', HttpStatus.BAD_REQUEST);
    }
  }

  private handleError(error: any): never {
    const message = error.message || 'Unknown GitHub error';
    const status = error.status || HttpStatus.BAD_GATEWAY;

    console.error(`[GithubAdapter] Error: ${message}`);

    throw new HttpException(`GitHub API Error: ${message}`, status);
  }
}