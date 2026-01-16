const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  profileUrl: String,
  avatarUrl: String,
  totalScore: { type: Number, default: 0 },
  submissionCount: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  level: { type: String, default: '1' },
  repoUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
  score: { type: Number, default: 0 },
  testResults: {
    total: Number,
    passed: Number,
    failed: Number,
    details: String
  },
  submittedAt: { type: Date, default: Date.now },
  evaluatedAt: Date
});

// Indexes for better query performance
submissionSchema.index({ userId: 1, submittedAt: -1 });
submissionSchema.index({ status: 1, score: -1 });
userSchema.index({ totalScore: -1, lastActive: 1 });

module.exports = { 
  User: mongoose.model('User', userSchema), 
  Submission: mongoose.model('Submission', submissionSchema) 
};