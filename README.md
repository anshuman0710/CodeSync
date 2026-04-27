# ⚡ CodeSync — Real-Time Collaborative Code Editor

A production-quality full-stack web application for real-time collaborative coding, built for teams and technical interviews.

![CodeSync](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=node.js) ![Socket.io](https://img.shields.io/badge/Socket.io-4.6-010101?logo=socket.io) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)

---

## ✨ Features

| Feature | Details |
|---|---|
| **Real-time sync** | WebSocket-based code changes broadcast as deltas (not full rewrites) |
| **Multi-cursor** | Each user gets a unique color cursor with their username label |
| **Chat** | Live chat with typing indicators and timestamps |
| **Code execution** | Judge0 integration — run JS, Python, C++ with stdin support |
| **Room persistence** | MongoDB stores code state; rejoin and resume any session |
| **Version history** | Save up to 20 named snapshots, restore any previous version |
| **Interview mode** | Host locks editing, sets a countdown timer |
| **Language switching** | Switch between JS / Python / C++ — synced across all clients |
| **Dark / Light theme** | Toggle with Monaco editor theme sync |

---

## 🗂 Project Structure

```
codesync/
├── frontend/                   # React app (Vercel)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   │   └── CodeEditor.jsx      # Monaco editor + cursor decorations
│   │   │   ├── Chat/
│   │   │   │   └── ChatPanel.jsx       # Chat with typing indicators
│   │   │   ├── Users/
│   │   │   │   └── UsersPanel.jsx      # Active users + roles
│   │   │   ├── Console/
│   │   │   │   └── ConsolePanel.jsx    # Run output + stdin
│   │   │   └── Toolbar/
│   │   │       └── Toolbar.jsx         # Top bar controls
│   │   ├── hooks/
│   │   │   ├── useSocket.js            # Socket.io connection manager
│   │   │   └── useRoom.js              # All room state + socket events
│   │   ├── pages/
│   │   │   ├── Home.jsx                # Create / join room
│   │   │   └── Room.jsx                # Main editor layout
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── package.json
│
└── backend/                    # Node.js + Express + Socket.io (Render/Railway)
    ├── server.js               # Entry point: HTTP + WebSocket server
    ├── models/
    │   └── Room.js             # Mongoose schema (rooms, users, snapshots)
    ├── controllers/
    │   ├── roomController.js   # CRUD for rooms + snapshots
    │   └── executeController.js # Judge0 API integration
    ├── routes/
    │   ├── roomRoutes.js
    │   └── executeRoutes.js
    ├── sockets/
    │   └── socketHandlers.js   # All Socket.io event handlers
    └── package.json
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier is fine)
- Judge0 API key from [RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce) (free tier available)

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/codesync.git
cd codesync

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

**backend/.env**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/codesync
FRONTEND_URL=http://localhost:3000
JUDGE0_API_KEY=your_rapidapi_key_here
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
```

**frontend/.env**
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev     # uses nodemon for hot reload

# Terminal 2 — Frontend
cd frontend
npm start
```

App is live at **http://localhost:3000**

---

## 🌐 Deployment

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import into [vercel.com](https://vercel.com)
3. Set build command: `npm run build`
4. Set output directory: `build`
5. Add environment variable: `REACT_APP_BACKEND_URL=https://your-backend.onrender.com`
6. Deploy — Vercel auto-handles SPA routing via `vercel.json`

### Backend → Render

1. Push `backend/` to GitHub (or as a monorepo subfolder)
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set:
   - Build command: `npm install`
   - Start command: `node server.js`
4. Add all environment variables from `.env`
5. Enable **Auto-Deploy** on push

> **Important:** On Render free tier, the service sleeps after inactivity. Use [UptimeRobot](https://uptimerobot.com) to ping `/health` every 5 minutes to keep it awake.

### MongoDB → Atlas

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user
3. Add `0.0.0.0/0` to IP Access List (or your Render IP)
4. Copy the connection string into `MONGODB_URI`

---

## 🔌 Socket.io Event Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join-room` | `{ roomId, username }` | Join a room, receive full state |
| `code-change` | `{ roomId, delta, fullCode }` | Broadcast a code edit delta |
| `cursor-move` | `{ roomId, position }` | Share cursor position |
| `selection-change` | `{ roomId, selection }` | Share text selection |
| `chat-message` | `{ roomId, message }` | Send a chat message |
| `typing-start` | `{ roomId }` | Show typing indicator |
| `typing-stop` | `{ roomId }` | Hide typing indicator |
| `language-change` | `{ roomId, language }` | Change editor language |
| `save-snapshot` | `{ roomId }` | Save current code as snapshot |
| `toggle-interview-mode` | `{ roomId, enabled, timerMinutes }` | Host: start/end interview |
| `toggle-editing-lock` | `{ roomId, locked }` | Host: lock/unlock editing |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `room-joined` | `{ code, language, users, userInfo, ... }` | Initial room state on join |
| `code-update` | `{ delta, senderId }` | Remote code change to apply |
| `cursor-update` | `{ socketId, username, color, position }` | Remote cursor moved |
| `selection-update` | `{ socketId, username, color, selection }` | Remote selection changed |
| `user-joined` | `{ userInfo, users }` | New user joined |
| `user-left` | `{ socketId, users }` | User disconnected |
| `chat-message` | `{ id, username, color, message, timestamp }` | New chat message |
| `user-typing` | `{ socketId, username }` | User started typing |
| `user-stopped-typing` | `{ socketId }` | User stopped typing |
| `language-updated` | `{ language }` | Language changed |
| `editing-lock-changed` | `{ locked }` | Editor lock state changed |
| `interview-mode-changed` | `{ enabled, timerEnd }` | Interview mode toggled |
| `snapshot-saved` | `{ snapshot }` | Snapshot confirmed saved |
| `host-changed` | `{ socketId }` | Host role transferred |
| `error` | `{ message }` | Server-side error |

---

## 🛠 REST API Reference

### Rooms

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/rooms/create` | Create a new room |
| `GET` | `/api/rooms/:roomId` | Get room details + code |
| `GET` | `/api/rooms/:roomId/snapshots` | Get version history |
| `POST` | `/api/rooms/:roomId/restore` | Restore a snapshot |

### Execution

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/execute` | `{ code, language, stdin }` | Execute code via Judge0 |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |

---

## 🏗 Architecture Decisions

### Why delta-based sync instead of full document broadcast?

Broadcasting the full document on every keystroke is wasteful. Instead, Monaco Editor emits **change deltas** (range + new text) on each edit. The server relays only these small deltas to other clients, who apply them to their local Monaco instance via `executeEdits()`. This keeps bandwidth minimal and avoids cursor position resets.

### Why in-memory room state + MongoDB?

Active room data (user list, cursors) lives in a `Map` on the server for O(1) access. MongoDB is used only for persistence — code is written on each change, user lists on join/leave. This avoids a DB query on every cursor move while still surviving server restarts for code content.

### Why not Operational Transform (OT) or CRDTs?

For an interview/team coding tool with typically 2–5 users and a trusted server relay, delta broadcasting with Monaco's built-in conflict handling is sufficient and vastly simpler to implement. Production tools like VS Code Live Share use more sophisticated algorithms for larger scale.

---

## 🧩 Extending CodeSync

### Add a new language

1. **backend/controllers/executeController.js** — add to `LANGUAGE_IDS`:
   ```js
   java: 62,   // Judge0 language ID for Java
   ```

2. **frontend/src/components/Toolbar/Toolbar.jsx** — add to `LANGUAGES` array:
   ```js
   { value: "java", label: "Java" }
   ```

3. **frontend/src/components/Editor/CodeEditor.jsx** — add to `MONACO_LANGUAGE_MAP`:
   ```js
   java: "java"
   ```

### Add authentication

Replace `sessionStorage` username with a proper auth system:
1. Add `jsonwebtoken` + `bcryptjs` to backend
2. Create `/api/auth/register` and `/api/auth/login` routes
3. Pass JWT in socket handshake: `io({ auth: { token } })`
4. Verify token in `socketHandlers.js` via `io.use()` middleware

---

## 📦 Key Dependencies

### Frontend
- `@monaco-editor/react` — VS Code editor in React
- `socket.io-client` — WebSocket client
- `react-router-dom` — SPA routing
- `tailwindcss` — utility CSS
- `date-fns` — timestamp formatting

### Backend
- `socket.io` — WebSocket server
- `express` — HTTP server + REST API
- `mongoose` — MongoDB ODM
- `nanoid` — short unique room IDs
- `axios` — Judge0 API calls

---

## 📄 License

MIT — free to use, fork, and deploy.
