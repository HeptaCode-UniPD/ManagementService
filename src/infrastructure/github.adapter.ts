import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Octokit } from '@octokit/rest';

@Injectable()
export class GithubAdapter {
  
  async getLatestCommit(repoUrl: string, token: string): Promise<string> {
    try {
      const { owner, repo } = this.parseRepoUrl(repoUrl);

      const octokit = new Octokit({ auth: token });

      const { data: repoData } = await octokit.repos.get({
        owner,
        repo,
      });

      const defaultBranch = repoData.default_branch;

      const { data: branchData } = await octokit.repos.getBranch({
        owner,
        repo,
        branch: defaultBranch,
      });

      return branchData.commit.sha;

    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`[GithubAdapter] Error fetching commit: ${error.message}`);
        
        const status = (error as any).status || HttpStatus.BAD_GATEWAY;

        throw new HttpException(
        `GitHub API Error: ${error.message}`,
        status,
        );
      }

      console.error('[GithubAdapter] An unexpected error occurred', error);
      throw new HttpException(
        'An unknown error occurred while communicating with GitHub',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  private parseRepoUrl(url: string): { owner: string; repo: string } {
    try {
      const path = new URL(url).pathname;
      const parts = path.split('/').filter(Boolean);
      return { owner: parts[0], repo: parts[1] };
    } catch (e) {
      throw new HttpException('Invalid GitHub Repository URL', HttpStatus.BAD_REQUEST);
    }
  }
}