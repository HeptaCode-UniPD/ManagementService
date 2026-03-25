import { GithubRepositoryEntity } from "./github-repository.entity";

export interface GithubRepositoryRepository {
    findById(id: string): Promise<GithubRepositoryEntity | null>;
    findByUserId(userId: string): Promise<GithubRepositoryEntity[]>;
    findByUrl(userId: string, repoUrl: string): Promise<GithubRepositoryEntity | null>;
    save(repo: GithubRepositoryEntity): Promise<GithubRepositoryEntity>;
    update(repo: GithubRepositoryEntity): Promise<GithubRepositoryEntity>;
}

export const GITHUB_REPOSITORY_REPOSITORY = Symbol('IGithubRepositoryRepository');