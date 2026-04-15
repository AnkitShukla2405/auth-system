# 🔐 Full-Stack Authentication System

A production-ready, role-based authentication system built with **Next.js**, **Express.js**, **MySQL**, and **Prisma ORM**. Features JWT access/refresh token rotation, HttpOnly cookie security, and multi-role authorization — fully containerized with Docker.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Authentication Flow](#-authentication-flow)
- [Role-Based Access Control](#-role-based-access-control)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development (Without Docker)](#local-development-without-docker)
  - [Docker Setup](#docker-setup)
- [Environment Variables](#-environment-variables)
- [Security Design](#-security-design)
- [Note](#-note)
- [Troubleshooting](#-troubleshooting)

---

## 🗺 Overview

This project implements a **complete authentication and authorization system** designed for an educational platform. It supports four distinct user roles (`super_admin`, `admin`, `teacher`, `student`) with role-specific access to protected resources.

Key highlights:
- ♻️ **Refresh token rotation** — old tokens are invalidated on every refresh
- 🍪 **HttpOnly cookies** — refresh tokens are never exposed to JavaScript
- 🔒 **Bcrypt password hashing** with salt rounds
- 🐳 **Fully Dockerized** — one command to spin up the entire stack
- 🗄️ **Prisma ORM** — type-safe database access with MySQL

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4 |
| **Backend** | Express.js 5, Node.js (ESM) |
| **Database** | MySQL 8 |
| **ORM** | Prisma 5 |
| **Auth** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Forms** | `react-hook-form`, `react-hot-toast` |
| **HTTP Client** | Axios |
| **Containerization** | Docker, Docker Compose |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Docker Network                       │
│                                                           │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐  │
│  │  Next.js    │───▶│  Express.js │───▶│   MySQL 8    │  │
│  │  :3000      │    │   :5001     │    │   :3307      │  │
│  └─────────────┘    └─────────────┘    └──────────────┘  │
│       Frontend           Backend           Database        │
└──────────────────────────────────────────────────────────┘
```

**Request Flow:**
1. Client sends credentials → Backend validates → Issues **Access Token** (15m) + **Refresh Token** (7d)
2. Access Token stored in memory (frontend state), Refresh Token in `HttpOnly` cookie
3. On expiry, `/auth/refresh` silently issues a new pair (**token rotation**)
4. Logout deletes the refresh token from the database and clears the cookie

---

## 📁 Project Structure

```
autth/
├── docker-compose.yml          # Orchestrates all 3 services
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   └── schema.prisma       # DB schema (users + refresh_tokens)
│   └── src/
│       ├── app.js              # Express app entry point
│       ├── config/
│       │   ├── db.js           # MySQL connection with retry logic
│       │   └── prisma.js       # Prisma client singleton
│       ├── controllers/
│       │   └── authController.js   # register, login, refresh, logout
│       ├── middleware/
│       │   ├── authMiddleware.js   # JWT verification (Bearer token)
│       │   └── roleMiddleware.js   # Role-based access control
│       ├── routes/
│       │   ├── authRoutes.js       # /auth/* endpoints
│       │   └── protectedRoutes.js  # /dashboard (role-aware)
│       └── utils/
└── frontend/
    ├── Dockerfile
    └── src/app/
        ├── page.js             # Dashboard / home
        ├── login/              # Login page
        ├── register/           # Registration page
        └── components/         # Shared UI components
```

---

## 🗄 Database Schema

### `users`

| Column | Type | Details |
|--------|------|---------|
| `id` | INT | Primary key, auto-increment |
| `name` | VARCHAR(100) | User's display name |
| `email` | VARCHAR(100) | Unique identifier |
| `password` | VARCHAR(255) | Bcrypt hashed |
| `role` | ENUM | `super_admin` \| `admin` \| `teacher` \| `student` |

### `refresh_token`

| Column | Type | Details |
|--------|------|---------|
| `id` | INT | Primary key, auto-increment |
| `user_id` | INT | FK → `users.id` (CASCADE on delete) |
| `token` | TEXT | Hashed refresh token string |
| `created_at` | TIMESTAMP | Auto-set on creation |

> Refresh tokens are stored in the database to support **server-side invalidation** (logout from all devices, token rotation).

---

## 📡 API Reference

### Auth Routes — `/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | ❌ | Register a new user |
| `POST` | `/auth/login` | ❌ | Login and receive tokens |
| `GET` | `/auth/refresh` | 🍪 Cookie | Rotate refresh token, get new access token |
| `POST` | `/auth/logout` | 🍪 Cookie | Invalidate refresh token |

### Protected Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/dashboard` | ✅ Bearer Token | Returns role-specific welcome message |

#### `POST /auth/register`
```json
// Request Body
{
  "name": "Ankit Shukla",
  "email": "ankit@example.com",
  "password": "securepassword",
  "role": "student"         // optional, defaults to "student"
}

// 201 Created
{ "message": "User registered successfully" }
```

#### `POST /auth/login`
```json
// Request Body
{ "email": "ankit@example.com", "password": "securepassword" }

// 200 OK
{
  "message": "Logged in successfully",
  "accessToken": "<jwt>",
  "user": { "id": 1, "name": "Ankit Shukla", "email": "...", "role": "student" }
}
// + Sets HttpOnly cookie: refreshToken
```

#### `GET /auth/refresh`
```
Reads refreshToken from HttpOnly cookie.

// 200 OK
{ "accessToken": "<new_jwt>" }
// + Sets new HttpOnly cookie: refreshToken
```

#### `GET /dashboard` _(Protected)_
```
Authorization: Bearer <accessToken>

// 200 OK
{ "name": "Ankit Shukla", "role": "student", "message": "Welcome Student 🎓 - Access learning" }
```

---

## 🔄 Authentication Flow

```
  Client                     Backend                    Database
    │                           │                           │
    │──── POST /auth/login ────▶│                           │
    │                           │── findUnique(email) ─────▶│
    │                           │◀─────────── user ─────────│
    │                           │── bcrypt.compare()        │
    │                           │── sign accessToken (15m)  │
    │                           │── sign refreshToken (7d)  │
    │                           │── create refresh_token ──▶│
    │◀─── 200 + cookie ─────────│                           │
    │                           │                           │
    │  [15 min later]           │                           │
    │──── GET /auth/refresh ───▶│                           │
    │     (cookie sent auto)    │── verify token            │
    │                           │── findFirst(token) ──────▶│
    │                           │── delete old token ──────▶│
    │                           │── create new token ──────▶│
    │◀─── new accessToken ──────│                           │
    │                           │                           │
    │──── POST /auth/logout ───▶│                           │
    │                           │── deleteMany(token) ─────▶│
    │                           │── clearCookie             │
    │◀─── 200 Logged out ───────│                           │
```

---

## 👥 Role-Based Access Control

The system defines 4 roles with a hierarchy:

| Role | Description | Dashboard Message |
|------|-------------|-------------------|
| `super_admin` | Full system control | 👑 Welcome Super Admin - Full system control |
| `admin` | Platform management | ⚙️ Welcome Admin - Manage platform |
| `teacher` | Course management | 📚 Welcome Teacher - Manage courses |
| `student` | Default role | 🎓 Welcome Student - Access learning |

**Middleware stack for protected routes:**

```js
// Verify JWT
router.get("/dashboard", verifyToken, handler);

// Restrict by role (can be layered)
router.get("/admin-panel", verifyToken, allowRoles("super_admin", "admin"), handler);
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8 (or Docker)
- npm or yarn

### Local Development (Without Docker)

**1. Clone the repository**
```bash
git clone <repo-url>
cd autth
```

**2. Backend setup**
```bash
cd backend
cp .env.example .env      # fill in your values
npm install
npx prisma generate
npx prisma db push        # creates tables from schema
npm run dev               # starts on :5001
```

**3. Frontend setup**
```bash
cd ../frontend
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_API_URL
npm install
npm run dev               # starts on :3000
```

### Docker Setup

Spin up the full stack (MySQL + Backend + Frontend) with a single command:

```bash
# From the project root
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001 |
| MySQL | localhost:3307 |

To stop and remove containers:
```bash
docker-compose down
```

To also remove the database volume:
```bash
docker-compose down -v
```

---

## 🔑 Environment Variables

### Backend — `backend/.env`

```env
# Database
DATABASE_URL=mysql://root:rootpassword@localhost:3306/auth_db
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=auth_db

# JWT Secrets (use strong random strings in production)
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

> ⚠️ **Never commit `.env` files.** Both are listed in `.gitignore`.

---

## 🛡 Security Design

| Concern | Implementation |
|---------|---------------|
| **Password Storage** | Bcrypt with cost factor 10 |
| **Access Token** | Short-lived JWT (15 min), stored in memory |
| **Refresh Token** | Long-lived JWT (7 days), HttpOnly cookie — not accessible via JS |
| **Token Rotation** | Every refresh invalidates old token and issues a new one |
| **Server-Side Logout** | Refresh token deleted from DB — cannot be reused |
| **CORS** | Strict origin whitelist with `credentials: true` |
| **SQL Injection** | Prevented via Prisma's parameterized queries |

---

## 📝 Note

> ⚠️ Due to ongoing university exams, the CRUD module (tasks/products) has **not been implemented**.
>
> However, the system is designed with a scalable architecture that allows easy addition of new modules.
>
> The project goes beyond basic assignment requirements and focuses on:
> - Secure authentication (JWT + refresh token rotation)
> - Role-based authorization
> - Clean and modular backend structure
> - Dockerized full-stack setup

---

## 🔧 Troubleshooting

### Prisma Error: Table does not exist

If you encounter a Prisma error stating that a table does not exist after starting the containers, the database may not have been migrated yet. Run the following command to push the schema:

```bash
docker exec -it backend-container npx prisma db push
```

This syncs your `schema.prisma` with the running MySQL database inside the container.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">
  <p>Built with ❤️ by <strong>Ankit Shukla</strong></p>
</div>
