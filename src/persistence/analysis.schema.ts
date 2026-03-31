import { Schema } from 'mongoose';

export const AnalysisSchema = new Schema({
  commit_id: { type: String, required: true, index: true },
  
  repository_url: { type: String, required: true },
  
  user_token: { type: String, required: false },

  analysis_data: { type: Schema.Types.Mixed, required: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  versionKey: false 
});

AnalysisSchema.index({ commit_id: 1 }, { unique: true });