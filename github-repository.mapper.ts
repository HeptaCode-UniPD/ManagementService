import { GithubRepositoryEntity } from "./github-repository.entity";
import { GithubRepositoryPersistence } from "./github-repository.schema";

export class GithubRepositoryMapper {
    static toDomain(p: GithubRepositoryPersistence): GithubRepositoryEntity {
        return new GithubRepositoryEntity(
            p._id,
            p.userId,
            p.repositoryUrl,
            p.token,
            p.lastCommitDate,
            p.s3Location
        );
    }

    static toPersistence(e: GithubRepositoryEntity): GithubRepositoryPersistence {
        const p =  new GithubRepositoryPersistence();

        p._id = e.id;
        p.userId = e.userId;
        p.repositoryUrl = e.repositoryUrl;
        p.token = e.token;
        p.lastCommitDate = e.lastCommitDate;
        p.s3Location = e.s3Location;

        return p;
    }
}