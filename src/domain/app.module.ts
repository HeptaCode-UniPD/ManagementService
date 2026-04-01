import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisManagementService } from './analysismanagement.service';
import { AnalysisManagementPersistence } from '../persistence/analysismanagement.persistence';
import { PersistenceAdapter } from '../persistence/adapter.persistence';
import { AnalysisManagementInfrastructure } from '../infrastructure/analysismanagement.infrastructure';
import { GithubAdapter } from '../infrastructure/github.adapter';
import { AnalysisSchema } from '../persistence/analysis.schema';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI!, {
      connectionFactory: (connection) => {
        console.log('MongoDB Connected to:', connection.name);
        return connection;
      }
    }),

    MongooseModule.forFeature([{ name: 'Analysis', schema: AnalysisSchema }])
  ],
  controllers: [
  ],
  providers: [
    AnalysisManagementService,

    AnalysisManagementPersistence,
    PersistenceAdapter,

    AnalysisManagementInfrastructure,
    GithubAdapter,
  ],
})
export class AppModule {}