# FinTrack — MERN Stack Finance Tracker

A full-stack conversion of the original vanilla HTML/CSS/JS FinTrack app into a **MERN** (MongoDB, Express, React, Node.js) application.

---

## Project Structure

```
fintrack-mern/
├── backend/                  # Express + MongoDB API
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Transaction.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── transactions.js
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT protect middleware
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/                 # React SPA
│   ├── public/
│   │   ├── index.html
│   │   └── fin.jpg           # Background image (from original)
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── ThemeContext.js
│   │   ├── components/
│   │   │   ├── Header.js
│   │   │   ├── PrivateRoute.js
│   │   │   └── PublicRoute.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js       # index.html → React
│   │   │   ├── SignIn.js          # signin.html → React
│   │   │   ├── SignUp.js          # signup.html → React
│   │   │   ├── ForgotPassword.js  # forgot-password.html → React
│   │   │   └── Profile.js         # profile.html → React
│   │   ├── style.css              # ORIGINAL CSS — unchanged
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── package.json              # Root: concurrently dev script
```

---

## Prerequisites

- Node.js v18+
- MongoDB running locally (`mongodb://localhost:27017`) **or** a MongoDB Atlas connection string

---

## Setup & Run

### 1. Configure environment variables

```bash
cd backend
cp .env.example .env
# Edit .env and set your MONGO_URI and JWT_SECRET
```

**backend/.env:**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/fintrack
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
```

### 2. Install all dependencies

```bash
# From the root fintrack-mern/ folder:
npm install          # installs concurrently
npm run install:all  # installs backend + frontend deps
```

### 3. Run in development mode

```bash
npm run dev
```

This starts:
- **Backend** on `http://localhost:5000` (with nodemon auto-reload)
- **Frontend** on `http://localhost:3000` (CRA dev server, proxies `/api` → port 5000)

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint              | Auth? | Description                     |
|--------|-----------------------|-------|---------------------------------|
| POST   | `/signup`             | No    | Register new user               |
| POST   | `/signin`             | No    | Login, returns JWT              |
| POST   | `/forgot-password`    | No    | Request password reset link     |
| PUT    | `/change-password`    | Yes   | Update password                 |
| GET    | `/me`                 | Yes   | Get current user info           |

### Transactions (`/api/transactions`)

| Method | Endpoint         | Auth? | Description                     |
|--------|------------------|-------|---------------------------------|
| GET    | `/`              | Yes   | Get all user's transactions     |
| POST   | `/`              | Yes   | Add new transaction             |
| DELETE | `/:id`           | Yes   | Delete a transaction            |

---

## What Changed vs the Original

| Feature                | Original                        | MERN Version                        |
|------------------------|---------------------------------|-------------------------------------|
| Auth                   | Mock token in localStorage      | Real JWT + bcrypt-hashed passwords  |
| Data storage           | localStorage                    | MongoDB via Mongoose                |
| Routing                | Multi-page HTML files           | React Router v6 SPA                 |
| State management       | Vanilla JS + DOM manipulation   | React useState / useContext         |
| Theme toggle           | theme.js + classList            | ThemeContext (same behavior)        |
| CSS                    | style.css (unchanged)           | Imported as-is into React           |
| Background image       | img/fin.jpg                     | public/fin.jpg (same path logic)    |
| CSV Download           | home.js downloadCSV()           | Same logic in Dashboard.js          |

---
screenshot:-
<img width="1336" height="573" alt="Screenshot 2026-06-09 155851" src="https://github.com/user-attachments/assets/ca714bdc-79ce-4758-9e44-11cdd54ac03f" />


## Notes

- The **CSS is completely unchanged** from the original — all class names, IDs, and CSS variables are preserved.
- Authentication uses real JWT tokens stored in `localStorage` with automatic verification on app load.
- Transactions are scoped per user — each user only sees their own data.
- The `proxy` field in `frontend/package.json` handles `/api` calls during development.
- For production, build the frontend (`npm run build --prefix frontend`) and serve it from Express or a CDN.
