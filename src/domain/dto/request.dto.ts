export class RequestDTO {
  private repoUrl: string;

  constructor(commitId?: string, repoUrl?: string) {
    this.repoUrl = repoUrl || '';
  }

  public getRepoUrl(): string {
    return this.repoUrl;
  }

  public setRepoUrl(repoUrl: string): void {
    this.repoUrl = repoUrl;
  }
}