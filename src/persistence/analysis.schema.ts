import { Schema } from 'mongoose';

export const AnalysisSchema = new Schema({
  commit_id: { 
    type: String, 
    required: true, 
    index: true, 
    unique: true // Fondamentale per evitare duplicati
  },
  
  repository_url: { 
    type: String, 
    required: true,
    index: true 
  },

  job_id: {
    type: String,
    required: false,
    index: true
  },

  user_token: { 
    type: String, 
    required: false 
  },

  status: {
    type: String,
    enum: ['processing', 'done', 'error'],
    default: 'processing',
    required: true
  },

  analysis_data: { 
    type: Schema.Types.Mixed, 
    required: false
  },

  error_message: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  versionKey: false 
});

AnalysisSchema.index({ repository_url: 1, commit_id: 1 });