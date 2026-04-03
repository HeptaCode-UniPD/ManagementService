import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisManagementService } from './domain/analysismanagement.service';
import { AnalysisManagementPersistence } from './persistence/analysismanagement.persistence';
import { PersistenceAdapter } from './persistence/adapter.persistence';
import { AnalysisManagementInfrastructure } from './infrastructure/analysismanagement.infrastructure';
import { GithubAdapter } from './infrastructure/github.adapter';
import { AnalysisSchema } from './persistence/analysis.schema';
import { AnalysisManagementPersistenceInterface } from './domain/interfaces/analysismanagementpersistence.interface';
import { AnalysisManagementInfrastructureInterface } from './domain/interfaces/analysismanagementinfrastructure.interface';
import { AnalysisManagementPresentation } from './presentation/analysismanagement.presentation';
// import { AnalysisMockController } from './presentation/mock.controller';
import { AnalysisManagementServiceInterface } from './domain/interfaces/analysismanagementservice.interface';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forRoot(process.env.MONGO_URI!, {
      connectionFactory: (connection) => {
        console.log('MongoDB Connected to:', connection.name);
        return connection;
      }
    }),
    MongooseModule.forFeature([{ name: 'Analysis', schema: AnalysisSchema }])
  ],
  controllers: [
    // AnalysisMockController,
    AnalysisManagementPresentation,
  ],
  providers: [
    {
      provide: AnalysisManagementServiceInterface,
      useClass: AnalysisManagementService,
    },
    {
      provide: AnalysisManagementPersistenceInterface,
      useClass: AnalysisManagementPersistence,
    },
    {
      provide: AnalysisManagementInfrastructureInterface,
      useClass: AnalysisManagementInfrastructure,
    },
    PersistenceAdapter,
    GithubAdapter,
  ],
})
export class AppModule {}