import { Schema } from 'mongoose';

export const AnalysisSchema = new Schema({
  commit_id: { 
    type: String, 
    required: true, 
    index: true, 
    unique: true 
  },
  
  repository_url: { 
    type: String, 
    required: true,
    index: true 
  },
  user_token: { 
    type: String, 
    required: false 
  },

  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
    required: true
  },

  analysis_data: { 
    type: Schema.Types.Mixed, 
    required: true 
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