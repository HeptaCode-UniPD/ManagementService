export class AnalysisResponseDTO {
  status: string;
  response: string;

  constructor(status: string, response: string) {
    this.status = status;
    this.response = response;
  }
}