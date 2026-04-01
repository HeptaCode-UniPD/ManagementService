import { Injectable } from '@nestjs/common';
import { RequestDTO } from '../domain/dto/request.dto';

@Injectable()
export class PersistenceAdapter {
  public internalToExternal(repoUrl: string): any {
    return {
      repository_url: repoUrl,
      processedAt: new Date(),
    };
  }
  public externalToInternal(json: any): RequestDTO {
    const dto = new RequestDTO();
    
    dto.setRepoUrl(json.repository_url);
    
    return dto;
  }
}