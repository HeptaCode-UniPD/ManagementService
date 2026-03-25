export class GithubRepositoryEntity {
    constructor(
        public readonly id:string,
        public readonly userId : string[],
        public readonly repositoryUrl: string,
        public readonly token:string,
        public readonly lastCommitDate: Date,
        public readonly s3Location: string
    ) {}

    getS3FolderPath(): string {
        return `${this.s3Location}`;
    }

    getLastCommitDate():Date {
        return this.lastCommitDate;
    }
}