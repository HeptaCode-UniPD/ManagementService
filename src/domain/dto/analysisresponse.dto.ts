export class AnalysisResponseDTO {
  private status: string;
  private response: string;

  constructor(status?: string, response?: string) {
    this.status = status || '';
    this.response = response || '';
  }

  public getStatus(): string {
    return this.status;
  }

  public getResponse(): string {
    return this.response;
  }

  public setStatus(status: string): void {
    this.status = status;
  }

  public setResponse(response: string): void {
    this.response = response;
  }
}