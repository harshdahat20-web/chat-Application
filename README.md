# Convo — Real-Time Chat Application

Convo is a full-stack, real-time messaging application built with the MERN stack and Socket.io. Users can register, log in, start conversations with other users, and exchange messages instantly — with live online/offline presence, an emoji picker, and a customizable profile.

**Live demo:** _add your Vercel URL here_

---

## Features

- **Authentication** — Email/password registration and login with secure, httpOnly cookie-based JWT sessions (no tokens stored in localStorage)
- **Persistent sessions** — Stay logged in across browser restarts and new tabs
- **Real-time messaging** — Instant message delivery via Socket.io, no page refresh required
- **Online presence** — See which contacts are currently online
- **Conversations**
  - Start a new chat with any registered user
  - Conversations automatically appear for both users, even without a refresh
  - Delete a conversation (and its messages) with a confirmation prompt
- **Messages**
  - Send and delete your own messages
  - Emoji picker built into the message composer
- **Profile**
  - Edit display name and bio
  - Choose from a set of preset avatars
  - Changes reflect instantly across the app (navbar, chat list, chat header)
- **Responsive design** — Optimized layouts for both desktop and mobile, including safe-area handling for mobile keyboards

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | UI framework and build tooling |
| Tailwind CSS v4 | Utility-first styling with a custom design token system |
| Framer Motion | Animations and transitions |
| React Router | Client-side routing |
| Axios | HTTP client for API requests |
| Socket.io Client | Real-time bidirectional communication |
| emoji-picker-react | In-app emoji picker |
| lucide-react | Icon set |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database and ODM |
| Socket.io | Real-time messaging and presence tracking |
| JSON Web Tokens (JWT) | Authentication |
| bcrypt | Password hashing |
| cookie-parser | Reading httpOnly auth cookies |
| CORS | Cross-origin request handling |

### Deployment
- **Frontend:** Vercel
- **Backend:** Render

---

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios instance configuration
│   │   ├── services/         # API service functions (auth, etc.)
│   │   ├── context/          # AuthContext for session management
│   │   ├── pages/            # Login, Register, Dashboard
│   │   ├── App.jsx           # Route definitions
│   │   └── main.jsx          # App entry point
│   ├── tailwind.config.js    # Design tokens (colors, fonts)
│   └── vercel.json           # SPA routing config for Vercel
│
└── backend/
    ├── controllers/          # Route handler logic
    ├── routes/                # API route definitions
    ├── models/                # Mongoose schemas
    ├── middleware/             # Auth middleware
    ├── socket/                 # Socket.io setup
    └── server.js               # App entry point
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd <your-repo-folder>
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```env
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

Start the backend server:
```bash
npm start
```

### 3. Frontend setup
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

Start the frontend dev server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Deployment Notes

When deploying to production (e.g., Vercel + Render):

- Set `NODE_ENV=production` on the backend — this automatically switches auth cookies to `sameSite: "none"` and `secure: true`, which is required for cross-domain cookies over HTTPS
- Set `CLIENT_URL` on the backend to your deployed frontend URL (no trailing slash)
- Set `VITE_API_URL` on the frontend to your deployed backend URL, including `/api/v1`
- Add a `vercel.json` file in the frontend root with a rewrite rule so client-side routes don't 404 on refresh:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- On free-tier hosting (e.g., Render), the backend may spin down after inactivity. A scheduled ping (e.g., via [cron-job.org](https://cron-job.org)) can keep it awake.

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create a new account |
| POST | `/api/v1/auth/login` | Log in and receive an auth cookie |
| POST | `/api/v1/auth/logout` | Clear the auth cookie |
| GET | `/api/v1/user/profile` | Get the current user's profile |
| PUT | `/api/v1/user/profile` | Update name, bio, or avatar |
| GET | `/api/v1/user/all` | List all other users |
| GET | `/api/v1/conversation` | Get all conversations for the current user |
| POST | `/api/v1/conversation` | Start a new conversation |
| DELETE | `/api/v1/conversation/:id` | Delete a conversation |
| GET | `/api/v1/message/:conversationId` | Get messages in a conversation |
| POST | `/api/v1/message` | Send a message |
| DELETE | `/api/v1/message/:id` | Delete a message |

All routes except `/auth/register` and `/auth/login` require authentication via the session cookie.

---

## License

This project is open source and available for personal and educational use.
