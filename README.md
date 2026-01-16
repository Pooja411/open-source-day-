# Open Source Day - CTF Platform

A full-stack web application for running coding challenges with GitHub OAuth authentication.

## 🏗️ Project Structure

```
open-source-day-/
├── backend/          # Node.js + Express API
│   ├── models/       # MongoDB schemas
│   ├── server.js     # Main server file
│   ├── seed.js       # Database seeding script
│   ├── .env          # Environment variables (not in git)
│   └── package.json  # Backend dependencies
│
├── frontend/         # React + Vite
│   ├── src/          # React components
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
│
└── README.md         # This file
```

## 🚀 Quick Start

### Backend Setup

1. Navigate to backend:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure `.env` file with:

   - MongoDB Atlas URI
   - GitHub OAuth credentials
   - Session secret

4. (Optional) Seed database with dummy data:

```bash
npm run seed
```

5. Start backend server:

```bash
npm start
```

Server runs at: `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start development server:

```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

## 🔑 Environment Variables

Create `backend/.env`:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=your_random_secret_key
```

## 📡 API Endpoints

- `GET /auth/github` - GitHub OAuth login
- `GET /auth/github/callback` - OAuth callback
- `POST /api/submit` - Submit repository
- `GET /api/leaderboard` - Get rankings
- `GET /api/user/profile` - User profile
- `GET /api/auth/status` - Check auth status

## 🛠️ Tech Stack

**Backend:**

- Node.js + Express
- MongoDB + Mongoose
- GitHub OAuth
- Express Session

**Frontend:**

- React 18
- Vite
- React Router
- Fetch API

## 📝 Development

**Backend Dev Mode:**

```bash
cd backend
npm run dev
```

**Frontend Dev Mode:**

```bash
cd frontend
npm run dev
```

## 🌐 Production Build

**Frontend:**

```bash
cd frontend
npm run build
```

**Deploy:**

- Backend: Deploy to Railway, Render, or Heroku
- Frontend: Deploy to Vercel, Netlify, or serve from backend

## 📄 License

MIT
