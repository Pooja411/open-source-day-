// 1. Load Environment Variables with absolute path detection
// const path = require('path');
// const dotenv = require('dotenv');
// const envPath = path.join(__dirname, '.env');
// dotenv.config({ path: envPath });

// // 2. Fail-safe check: Stop the server if secrets are missing
// if (!process.env.SESSION_SECRET || !process.env.GITHUB_CLIENT_ID) {
//     console.error("❌ ERROR: Missing environment variables in backend/.env");
//     console.error("Path searched:", envPath);
//     process.exit(1);
// }
require('dotenv').config();

if (!process.env.SESSION_SECRET || !process.env.GITHUB_CLIENT_ID) {
    console.error("❌ ERROR: Missing environment variables");
    process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const session = require('express-session');
const { User, Submission } = require('./models/Schemas');

const app = express();

// ============================================================================
// CONFIGURATION - Easy to modify settings
// ============================================================================

const CONFIG = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // GitHub OAuth
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GITHUB_OAUTH_URL: 'https://github.com/login/oauth/authorize',
  GITHUB_TOKEN_URL: 'https://github.com/login/oauth/access_token',
  GITHUB_USER_API: 'https://api.github.com/user',
  
  // GitHub Actions API
  GITHUB_API_BASE: 'https://api.github.com',
  GITHUB_USER_AGENT: 'open-source-day-backend',
  GITHUB_API_VERSION: 'application/vnd.github+json',
  
  // Scoring System
  POINTS_PER_LEVEL: 100, // Level 1 = 100pts, Level 2 = 200pts, etc.
  
  // Level Configuration
  LEVEL_LINKS: {
    0: 'https://classroom.github.com/a/-mDK6v1a',
    1: 'https://classroom.github.com/a/gF1BxiUa',
    2: 'https://classroom.github.com/a/qtiNJt92',
    3: 'https://classroom.github.com/a/IkeIkRUT',
    4: 'https://classroom.github.com/a/v-vPXsGd',
    5: 'https://classroom.github.com/a/TA8NqnQY'
  },
  
  // Database
  MONGO_URI: process.env.MONGO_URI,
  
  // Session
  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  
  // Regex Patterns
  REPO_URL_PATTERN: /github\.com\/([^\/]+)\/([^\/]+)/,
  USERNAME_PATTERN: /level-\d+-(.*?)(?:-\d+)?(?:\.git)?$/,
};

// ============================================================================
// MIDDLEWARES
// ============================================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
      console.log("GitHub token loaded:", !!process.env.GITHUB_TOKEN);
// CORS Configuration for development (React runs on different port)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CONFIG.FRONTEND_URL);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files from React build in production
// if (CONFIG.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../frontend/dist')));
// }

// Session Configuration
app.use(session({
  secret: CONFIG.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: CONFIG.SESSION_MAX_AGE
  }
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Extract GitHub username from repository URL
function extractGithubUsername(repoUrl) {
  const match = repoUrl.match(CONFIG.USERNAME_PATTERN);
  return match ? match[1] : 'unknown';
}

// Parse repository owner and name from URL
function parseRepoUrl(repoUrl) {
  const match = repoUrl.match(CONFIG.REPO_URL_PATTERN);
  if (!match) return null;
  
  const [, owner, repoName] = match;
  const repo = repoName.replace(/\.git$/, '');
  return { owner, repo };
}

// Build GitHub API URLs
function buildGithubApiUrls(owner, repo, runId = null) {
  const base = `${CONFIG.GITHUB_API_BASE}/repos/${owner}/${repo}`;
  return {
    workflows: `${base}/actions/runs`,
    jobs: runId ? `${base}/actions/runs/${runId}/jobs` : null
  };
}

// Calculate score based on level
function calculateScore(level, passed) {
  if (!passed) return 0;
  const levelNum = parseInt(level) || 1;
  // Level 0 is demo level, gives 100 points
  if (levelNum === 0) return 100;
  return levelNum * CONFIG.POINTS_PER_LEVEL;
}

// Create or get test user (for development without OAuth)
async function getOrCreateTestUser() {
  try {
    let testUser = await User.findOne({ username: 'test-user' });
    if (!testUser) {
      testUser = await User.create({
        githubId: 'test-123',
        username: 'test-user',
        profileUrl: 'https://github.com/test-user',
        avatarUrl: 'https://github.com/identicons/test-user.png',
        lastActive: new Date()
      });
      console.log('✨ Created test user');
    }
    return testUser;
  } catch (error) {
    // If duplicate key error, find and return existing user
    if (error.code === 11000) {
      console.log('⚠️ Test user already exists, fetching...');
      return await User.findOne({ githubId: 'test-123' });
    }
    throw error;
  }
}

// ============================================================================
// AUTHENTICATION & DATABASE
// ============================================================================

// Authentication Middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized. Please login first.' });
  }
  next();
};

// Database Connection
mongoose.connect(CONFIG.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ============================================================================
// ROUTES - Authentication
// ============================================================================

// Redirect to GitHub OAuth login
app.get('/auth/github', (req, res) => {
  const url = `${CONFIG.GITHUB_OAUTH_URL}?client_id=${CONFIG.GITHUB_CLIENT_ID}&scope=user`;
  res.redirect(url);
});

// GitHub OAuth Callback Handler
app.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  try {
    // Exchange code for Access Token
    const tokenRes = await axios.post(CONFIG.GITHUB_TOKEN_URL, {
      client_id: CONFIG.GITHUB_CLIENT_ID,
      client_secret: CONFIG.GITHUB_CLIENT_SECRET,
      code
    }, { headers: { Accept: 'application/json' } });

    const accessToken = tokenRes.data.access_token;

    // Fetch User Profile from GitHub
    const userRes = await axios.get(CONFIG.GITHUB_USER_API, {
      headers: { Authorization: `token ${accessToken}` }
    });

    // Find or Create User (Lazy Creation)
    let user = await User.findOne({ githubId: userRes.data.id.toString() });
    if (!user) {
      user = await User.create({
        githubId: userRes.data.id.toString(),
        username: userRes.data.login,
        profileUrl: userRes.data.html_url,
        avatarUrl: userRes.data.avatar_url,
        lastActive: new Date()
      });
      console.log(`✨ New user registered: ${user.username}`);
    } else {
      // Update last active time
      user.lastActive = new Date();
      await user.save();
    }

    // Save user info in session
    req.session.userId = user._id;
    req.session.username = user.username;
    
    // Redirect to the dashboard
    res.redirect('/dashboard.html');
  } catch (err) {
    console.error("Auth Error:", err.response ? err.response.data : err.message);
    res.status(500).send("Authentication failed. Check server logs.");
  }
});

// ============================================================================
// ROUTES - Submission & Evaluation
// ============================================================================

// Submission API - Accepts GitHub repo URL and evaluates via GitHub Actions
app.post('/api/submit', async (req, res) => {
  // For testing: create a mock user if not authenticated
  let userId = req.session.userId;
  
  if (!userId) {
    console.log('⚠️ No session found, using test user for development');
    const testUser = await getOrCreateTestUser();
    userId = testUser._id;
    req.session.userId = userId;
  }
  
 

  console.log('📥 Submission received:', { repoUrl: req.body.repoUrl, userId });
  
  try {
    const { repoUrl, level } = req.body;
    
    // Validate GitHub URL
    if (!repoUrl || !repoUrl.includes('github.com')) {
      console.log('❌ Invalid URL');
      return res.status(400).json({ 
        error: 'Invalid repository URL. Must be a valid GitHub URL.',
        status: 'failed'
      });
    }
     if (repoUrl.includes('classroom.github.com')) {
  return res.status(400).json({
    status: 'failed',
    message: 'Please submit your forked GitHub repository URL, not the Classroom invite link.'
  });
}
    // First evaluate the submission to check its status
    console.log('🔍 Evaluating submission...');
    const evaluationResult = await evaluateSubmission(repoUrl, level);
    
    // Check for duplicate passing submissions - only block if previous was passed AND new is also passed
    const existingSubmission = await Submission.findOne({
      userId: userId,
      repoUrl: repoUrl,
      status: 'passed'
    });

    if (existingSubmission && evaluationResult.status === 'passed') {
      console.log('⚠️ Duplicate passing submission');
      return res.status(400).json({ 
        error: 'This repository has already been submitted successfully.',
        status: 'duplicate'
      });
    }
    
    // If there's a previous submission (passed or failed), delete it to allow the new one
    if (existingSubmission || await Submission.findOne({ userId, repoUrl })) {
      console.log('🗑️ Removing previous submission to allow update');
      await Submission.deleteMany({ userId, repoUrl });
    }

    // Extract GitHub username from repo URL and update user
    const githubUsername = extractGithubUsername(repoUrl);
    if (githubUsername !== 'unknown') {
      console.log('👤 Extracted GitHub username:', githubUsername);
      await User.findByIdAndUpdate(userId, {
        username: githubUsername,
        lastActive: new Date()
      });
    }

    // Use the already-evaluated result
    console.log('📊 Evaluation result:', evaluationResult.status, 'Score:', evaluationResult.score);
    
    const submission = new Submission({
      userId: userId,
      level: level || "1",
      repoUrl: repoUrl,
      status: evaluationResult.status,
      score: evaluationResult.score,
      testResults: evaluationResult.testResults,
      submittedAt: new Date(),
      evaluatedAt: new Date()
    });

    await submission.save();
    console.log('💾 Submission saved to database');

    // Update user statistics
    if (evaluationResult.status === 'passed') {
      await User.findByIdAndUpdate(userId, {
        $inc: { totalScore: evaluationResult.score, submissionCount: 1 },
        $set: { lastActive: new Date() }
      });
      console.log('✅ User stats updated');
    }

    res.json({ 
      status: evaluationResult.status,
      score: evaluationResult.score,
      message: evaluationResult.message,
      testResults: evaluationResult.testResults
    });
  } catch (err) {
    console.error('❌ Submission error:', err.message);
    console.error(err.stack);
    res.status(500).json({ 
      error: 'Submission failed. Please try again.',
      status: 'error',
      message: err.message
    });
  }
});

// ============================================================================
// EVALUATION FUNCTION - GitHub Actions Workflow Checker
// ============================================================================

async function evaluateSubmission(repoUrl, level) {
  try {
    // Parse repository URL
    const repoInfo = parseRepoUrl(repoUrl);
    if (!repoInfo) {
      return {
        status: 'failed',
        score: 0,
        message: 'Invalid repository URL format',
        testResults: { total: 0, passed: 0, failed: 0, details: 'Invalid URL' }
      };
    }

    const { owner, repo } = repoInfo;
    const apiUrls = buildGithubApiUrls(owner, repo);

    console.log(`🔍 Checking GitHub Actions for: ${owner}/${repo}`);
    console.log(`📡 API URL: ${apiUrls.workflows}`);

    // Fetch latest workflow run from GitHub Actions API
    let workflowResponse;
    try {
      workflowResponse = await axios.get(apiUrls.workflows, {
        headers: {
          'User-Agent': CONFIG.GITHUB_USER_AGENT,
          'Accept': CONFIG.GITHUB_API_VERSION,
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
        },
        params: {
          per_page: 5 // Only get the latest run
        }
      });


    } catch (axiosError) {
      // Handle GitHub API errors
      if (axiosError.response) {
        const status = axiosError.response.status;
        if (status === 404) {
          return {
            status: 'failed',
            score: 0,
            message: 'Repository not found or GitHub Actions not enabled',
            testResults: { 
              total: 0, 
              passed: 0, 
              failed: 0, 
              details: 'Enable GitHub Actions in your repository' 
            }
          };
        } else if (status === 403) {
          return {
            status: 'failed',
            score: 0,
            message: 'GitHub API rate limit exceeded',
            testResults: { 
              total: 0, 
              passed: 0, 
              failed: 0, 
              details: 'Please try again later' 
            }
          };
        }
      }
      throw axiosError;
    }

    // Check if workflow runs exist
    const workflowRuns = workflowResponse.data.workflow_runs || [];
    
    if (workflowRuns.length === 0) {
      return {
        status: 'failed',
        score: 0,
        message: 'No GitHub Actions workflows found',
        testResults: { 
          total: 0, 
          passed: 0, 
          failed: 0, 
          details: 'Add a workflow file to .github/workflows/ directory' 
        }
      };
    }
const completedRun = workflowRuns.find(
  run => run.status === 'completed' && run.conclusion === 'success'
);

if (!completedRun) {
  return {
    status: 'failed',
    score: 0,
    message: 'No successful GitHub Actions run found yet',
    testResults: {
      total: 0,
      passed: 0,
      failed: 0,
      details: 'Wait for Actions to complete successfully'
    }
  };
}

    const latestRun = completedRun;
    console.log(`📊 Workflow Status: ${latestRun.status}, Conclusion: ${latestRun.conclusion}`);

    // Fetch job-level details for scoring breakdown
    let jobs = [];
    let jobsPassed = 0;
    let jobsFailed = 0;
    
    try {
      const jobsApiUrl = buildGithubApiUrls(owner, repo, latestRun.id).jobs;
      const jobsResponse = await axios.get(jobsApiUrl, {
        headers: {
          'User-Agent': CONFIG.GITHUB_USER_AGENT,
          'Accept': CONFIG.GITHUB_API_VERSION,
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
        }
      });

      jobs = jobsResponse.data.jobs || [];
      
      // Count successful and failed jobs
      jobs.forEach(job => {
        if (job.conclusion === 'success') jobsPassed++;
        else if (job.conclusion === 'failure') jobsFailed++;
      });
    } catch (jobError) {
      console.warn('Could not fetch job details:', jobError.message);
    }

    // Determine pass/fail based on workflow conclusion
    const workflowPassed = latestRun.status === 'completed' && latestRun.conclusion === 'success';
    
    // Calculate score using helper function
    const score = calculateScore(level, workflowPassed);

    // Build detailed test results
    const totalJobs = jobs.length || 1;
    const details = jobs.length > 0 
      ? jobs.map(job => `${job.name}: ${job.conclusion || job.status}`).join(', ')
      : `Workflow: ${latestRun.conclusion || latestRun.status}`;

    return {
      status: workflowPassed ? 'passed' : 'failed',
      score: score,
      message: workflowPassed 
        ? `PASSED` 
        : `FAILED - ${latestRun.conclusion || latestRun.status}`,
      testResults: {
        total: totalJobs,
        passed: jobsPassed,
        failed: jobsFailed,
        details: details,
        workflow_url: latestRun.html_url,
        commit: latestRun.head_sha.substring(0, 7)
      }
    };

  } catch (error) {
    console.error('Evaluation error:', error.message);
    return {
      status: 'failed',
      score: 0,
      message: 'Evaluation error occurred',
      testResults: { total: 0, passed: 0, failed: 0, details: error.message }
    };
  }
}

// ============================================================================
// ROUTES - Leaderboard & User Data
// ============================================================================

// Leaderboard API - Get top users by score
app.get('/api/leaderboard', async (req, res) => {
  try {
    const lb = await Submission.aggregate([
      { $match: { status: "passed" } },
      { $group: { 
          _id: "$userId", 
          totalScore: { $sum: "$score" }, 
          lastSub: { $max: "$submittedAt" },
          submissionCount: { $sum: 1 }
      } },
      { $lookup: { 
          from: "users", 
          localField: "_id", 
          foreignField: "_id", 
          as: "user" 
      } },
      { $unwind: "$user" },
      { $sort: { totalScore: -1, lastSub: 1 } },
      { $limit: 100 } // Limit to top 100 for performance
    ]);
    res.json(lb);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: "Could not fetch leaderboard" });
  }
});

// User Profile API - Get user details and submission history
app.get('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId)
      .select('-githubId -__v');
    
    const submissions = await Submission.find({ 
      userId: req.session.userId 
    })
      .sort({ submittedAt: -1 })
      .limit(10)
      .select('level repoUrl status score submittedAt');

    res.json({
      user,
      recentSubmissions: submissions,
      stats: {
        totalSubmissions: await Submission.countDocuments({ userId: req.session.userId }),
        passedSubmissions: await Submission.countDocuments({ userId: req.session.userId, status: 'passed' }),
        failedSubmissions: await Submission.countDocuments({ userId: req.session.userId, status: 'failed' })
      }
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Could not fetch profile' });
  }
});

// Check Authentication Status
app.get('/api/auth/status', (req, res) => {
  if (req.session.userId) {
    res.json({ 
      authenticated: true, 
      username: req.session.username,
      userId: req.session.userId
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Get user's completed levels and level links
app.get('/api/user/levels', async (req, res) => {
  try {
    // For testing: create a mock user if not authenticated
    let userId = req.session.userId;
    
    if (!userId) {
      console.log('⚠️ No session found, using test user for development');
      const testUser = await getOrCreateTestUser();
      userId = testUser._id;
      req.session.userId = userId;
    }

    // Get all passed submissions for this user
    const passedSubmissions = await Submission.find({
      userId: userId,
      status: 'passed'
    }).select('level');

    // Extract completed level numbers
    const completedLevels = passedSubmissions.map(sub => parseInt(sub.level)).sort((a, b) => a - b);

    res.json({
      levelLinks: CONFIG.LEVEL_LINKS,
      completedLevels: completedLevels
    });
  } catch (err) {
    console.error('Get levels error:', err);
    res.status(500).json({ error: 'Could not fetch levels' });
  }
});

// Logout - Destroy user session
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// ============================================================================
// PRODUCTION - Serve React Frontend
// ============================================================================

// // Serve React app for all other routes (production)
// if (CONFIG.NODE_ENV === 'production') {
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
//   });
// }

// ============================================================================
// START SERVER
// ============================================================================

// Start Server
app.listen(CONFIG.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${CONFIG.PORT}`);
  console.log(`📝 Environment: ${CONFIG.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${CONFIG.FRONTEND_URL}`);
  console.log(`💯 Points per level: ${CONFIG.POINTS_PER_LEVEL}`);
});