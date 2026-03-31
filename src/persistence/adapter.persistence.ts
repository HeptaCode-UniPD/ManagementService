import { Injectable } from '@nestjs/common';
import { RequestDTO } from '../domain/dto/request.dto';

@Injectable()
export class PersistenceAdapter {
  public internalToExternal(request: RequestDTO): any {
    return {
      commit_id: request.getCommitId(),
      user_token: request.getUserToken(),
      repository_url: request.getRepoUrl(),
      processedAt: new Date(),
    };
  }
  public externalToInternal(json: any): RequestDTO {
    const dto = new RequestDTO();
    
    dto.setCommitId(json.commit_id);
    dto.setUserToken(json.user_token);
    dto.setRepoUrl(json.repository_url);
    
    return dto;
  }
}