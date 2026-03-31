export class RequestDTO {
  private commitId: string;
  private userToken: string;
  private repoUrl: string;

  constructor(commitId?: string, userToken?: string, repoUrl?: string) {
    this.commitId = commitId || '';
    this.userToken = userToken || '';
    this.repoUrl = repoUrl || '';
  }

  public getCommitId(): string {
    return this.commitId;
  }

  public getUserToken(): string {
    return this.userToken;
  }

  public getRepoUrl(): string {
    return this.repoUrl;
  }

  public setCommitId(commitId: string): void {
    this.commitId = commitId;
  }

  public setUserToken(userToken: string): void {
    this.userToken = userToken;
  }

  public setRepoUrl(repoUrl: string): void {
    this.repoUrl = repoUrl;
  }
}