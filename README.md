# ConnectWorld

ConnectWorld is a beginner-friendly full-stack starter for a supervised, age-appropriate international friendship prototype.

## Important safety and production note

This is a learning prototype, **not a ready-to-launch public social network**. The 13–17 age field is self-reported and is not age verification. Before any public release, the project needs expert safeguarding/privacy review, reliable age assurance appropriate to the countries served, trained moderation, abuse escalation procedures, data-retention/deletion policies, security testing, and legal review. Do not use real minors' personal data while testing. Never ask users to share phone numbers, addresses, schools, passwords, or live location. Private messaging is restricted to accepted friends in this prototype.

## Requirements

- Node.js 18 or newer
- MySQL 8 or compatible local MySQL server
- VS Code (recommended)

## Setup

1. Extract the ZIP and open the `ConnectWorld` folder in VS Code.
2. Open a terminal in that folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. In MySQL Workbench or your MySQL terminal, create the database:

   ```sql
   CREATE DATABASE connectworld_db;
   ```

5. Copy `.env.example` and rename the copy to `.env`.
6. Edit `.env` and enter your local MySQL username/password. Replace `JWT_SECRET` with a long random secret. Do not share `.env` or upload it to GitHub.
7. Start the app:

   ```bash
   npm run dev
   ```

8. Open `http://localhost:5000`.

Sequelize creates the tables on first start. Keep MySQL running while using the app.

## Pages

- `/` — landing page
- `/register.html` — create account
- `/login.html` — log in
- `/dashboard.html` — discover people
- `/friends.html` — requests and accepted friends
- `/profile.html` — edit your profile
- `/chat.html?user=ID` — chat with an accepted friend

## Implemented API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/users/discover`
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/friendships`
- `POST /api/friendships/request/:userId`
- `PATCH /api/friendships/:id/respond`
- `GET /api/messages/:userId`
- `POST /api/messages/:userId`
- `POST /api/safety/block/:userId`
- `POST /api/safety/report/:userId`

## Notes

- Passwords are hashed with bcrypt.
- API requests use a short-lived JWT.
- Chat history and sending are checked against accepted friendships and blocks.
- Socket.IO is included for real-time message delivery; the chat page also sends through the protected HTTP endpoint.
- For a real deployment, add CSRF protection, stronger validation and moderation tooling, automated tests, database migrations, secure age assurance, rate limits per account/IP, audit logs, and a formal privacy/security review.
