import { Injectable } from '@nestjs/common';
import { RequestDTO } from '../domain/dto/request.dto';

interface ExternalAnalysis {
  repository_url: string;
  processedAt: Date;
}

@Injectable()
export class PersistenceAdapter {
  public internalToExternal(repoUrl: string): ExternalAnalysis {
    return {
      repository_url: repoUrl,
      processedAt: new Date(),
    };
  }

  public externalToInternal(json: ExternalAnalysis): RequestDTO {
    const dto = new RequestDTO();
    dto.repoUrl = json.repository_url;
    return dto;
  }
}