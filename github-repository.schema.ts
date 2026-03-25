import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { required, string } from "joi";

export type GithubRepositoryDocument = GithubRepositoryPersistence & Document;

@Schema({collection: 'github_repositories', timestamps:true, versionKey:false})
export class GithubRepositoryPersistence {
    @Prop({required: true})
    _id!:string;

    @Prop({required:true, index:true})
    userId: string[];

    @Prop({required:true})
    repositoryUrl:string;

    @Prop({required:true})
    token:string;

    @Prop({required:true})
    lastCommitDate:Date;

    @Prop({required:true})
    s3Location:string;
}

export const GithubRepositorySchema = SchemaFactory.createForClass(GithubRepositoryPersistence);

GithubRepositorySchema.index({userId:1, repositoryUrl:1}, {unique:true});
GithubRepositorySchema.index({userId:1});