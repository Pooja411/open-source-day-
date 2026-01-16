const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  profileUrl: String,
  createdAt: { type: Date, default: Date.now }
});

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  level: String,
  repoUrl: String,
  status: String,
  score: Number,
  submittedAt: { type: Date, default: Date.now }
});

module.exports = { 
  User: mongoose.model('User', userSchema), 
  Submission: mongoose.model('Submission', submissionSchema) 
};