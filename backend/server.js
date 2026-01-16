// 1. Load Environment Variables with absolute path detection
const path = require('path');
const dotenv = require('dotenv');
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

// 2. Fail-safe check: Stop the server if secrets are missing
if (!process.env.SESSION_SECRET || !process.env.GITHUB_CLIENT_ID) {
    console.error("❌ ERROR: Missing environment variables in backend/.env");
    console.error("Path searched:", envPath);
    process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const session = require('express-session');
const { User, Submission } = require('./models/Schemas');

const app = express();

// 3. Middlewares
app.use(express.json());
// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// 4. Session Configuration (Fixed the "secret option required" error)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// 5. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- ROUTES ---

// A. Redirect to GitHub login
app.get('/auth/github', (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user`;
  res.redirect(url);
});

// B. GitHub Callback Handling
app.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  try {
    // Exchange code for Access Token
    const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    }, { headers: { Accept: 'application/json' } });

    const accessToken = tokenRes.data.access_token;

    // Fetch User Profile from GitHub
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });

    // Find or Create User (Lazy Creation)
    let user = await User.findOne({ githubId: userRes.data.id.toString() });
    if (!user) {
      user = await User.create({
        githubId: userRes.data.id.toString(),
        username: userRes.data.login,
        profileUrl: userRes.data.html_url
      });
      console.log(`✨ New user registered: ${user.username}`);
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

// C. Submission API
app.post('/api/submit', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const { repoUrl, level } = req.body;
    
    const submission = new Submission({
      userId: req.session.userId,
      level: level || "1",
      repoUrl: repoUrl,
      status: "passed", // Mocked as successful for now
      score: 100,
      submittedAt: new Date()
    });

    await submission.save();
    res.json({ status: "passed", score: 100 });
  } catch (err) {
    res.status(500).json({ error: "Submission failed" });
  }
});

// D. Leaderboard API
app.get('/api/leaderboard', async (req, res) => {
  try {
    const lb = await Submission.aggregate([
      { $match: { status: "passed" } },
      { $group: { 
          _id: "$userId", 
          totalScore: { $sum: "$score" }, 
          lastSub: { $max: "$submittedAt" } 
      } },
      { $lookup: { 
          from: "users", 
          localField: "_id", 
          foreignField: "_id", 
          as: "user" 
      } },
      { $unwind: "$user" },
      { $sort: { totalScore: -1, lastSub: 1 } }
    ]);
    res.json(lb);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch leaderboard" });
  }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});