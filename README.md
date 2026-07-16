# Chat App Backend

A Node.js/Express backend (TypeScript) providing authentication, friend management, and messaging (with file uploads) for a chat application. Uses MongoDB with session-based auth.

## Features

- **Authentication**: Signup, login, logout, and session persistence via `express-session` + `connect-mongo`.
- **Friends**: Send, accept, and decline friend requests; fetch friends list and pending requests.
- **Messaging**: Send and retrieve messages between two users, with support for text, images, audio, and file attachments.
- **File Uploads**: Upload files via `multer`, served statically from `/uploads`.

## Tech Stack

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- express-session with connect-mongo store
- Multer (file uploads)
- CORS

## Prerequisites

- Node.js (v18+ recommended)
- MongoDB instance (local or hosted, e.g. MongoDB Atlas)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your_session_secret_here
PORT=5000
```

> Note: `JWT_SECRET` is used as the session secret for `express-session` (naming is a holdover — no JWTs are actually used; auth is session/cookie based).

## Running the Server

```bash
# development
npm run dev

# build
npm run build

# production
npm start
```

The server starts on `http://localhost:5000` by default (or the `PORT` from your `.env`).

## Project Structure

```
.
├── models/
│   ├── User.ts
│   └── Message.ts
├── uploads/          # uploaded files served at /uploads
├── index.ts           # main server file
└── .env
```

## API Reference

All authenticated routes require a valid session cookie (`connect.sid`), set after login. CORS is configured for `http://localhost:5173` with `credentials: true`, so the frontend must send requests with `credentials: "include"`.

### Auth

| Method | Endpoint    | Description                          | Body                                  |
|--------|-------------|---------------------------------------|----------------------------------------|
| POST   | `/signup`   | Create a new user                     | `{ firstName, username, password }`    |
| POST   | `/login`    | Log in and start a session            | `{ username, password }`               |
| POST   | `/logout`   | Destroy the session                   | —                                       |
| GET    | `/me`       | Get the currently logged-in user      | —                                       |

### Friends

| Method | Endpoint          | Description                              | Body                    |
|--------|-------------------|-------------------------------------------|--------------------------|
| POST   | `/friends/send`   | Send a friend request                     | `{ toUsername }`         |
| POST   | `/friends/accept` | Accept a pending friend request           | `{ fromUserId }`         |
| POST   | `/friends/decline`| Decline a pending friend request          | `{ fromUserId }`         |
| GET    | `/friends`        | Get friends, incoming, and sent requests  | —                        |

### Messages

| Method | Endpoint              | Description                                | Body                                              |
|--------|-----------------------|----------------------------------------------|-----------------------------------------------------|
| POST   | `/messages`           | Send a message to a user                     | `{ to, text?, imageUrl?, audioUrl?, fileUrl? }`     |
| GET    | `/messages/:contactId`| Get message history with a specific contact  | —                                                    |

### File Upload

| Method | Endpoint  | Description                          | Body (form-data)     |
|--------|-----------|---------------------------------------|-----------------------|
| POST   | `/upload` | Upload a file, returns its public URL | `file` (single file) |

Uploaded files are saved to the `uploads/` directory and served at `http://localhost:5000/uploads/<filename>`.

## Security Notes

Before deploying to production, consider addressing the following:

- **Cookie security**: `cookie.secure` is currently `false`; set to `true` and serve over HTTPS in production.
- **CORS origin**: Currently hardcoded to `http://localhost:5173`; update for your production frontend domain.
- **Upload URLs**: The `/upload` and file-serving URLs are hardcoded to `http://localhost:5000`; parameterize this via an environment variable for other environments.
- **File validation**: `multer` is configured without file type/size restrictions — add validation before production use.
- **Session secret**: Use a strong, unique `JWT_SECRET`/session secret in production, never the default fallback.

## License

Add your license of choice here.
