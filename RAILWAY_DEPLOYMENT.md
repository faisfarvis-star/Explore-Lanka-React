# Railway Deployment Guide — Explore Lanka

This guide provides step-by-step instructions for deploying the Explore Lanka web application (React/Vite frontend + Node/Express backend + MySQL database) to [Railway](https://railway.app/).

---

## Overview Architecture

- **Frontend**: Built with React 18 & Vite into static bundle (`dist/`).
- **Backend**: Express API server running on Node.js.
- **Database**: MySQL 8.0 / MariaDB service.
- **Static Assets**: Sri Lankan destination images (`/Tourist_Images`) built directly into `dist/`.
- **User Uploads**: Stored persistently on a Railway Persistent Volume mounted at `/app/uploads`.

---

## 1. Build and Start Commands

Configure these settings in your Railway Web Service:

- **Build Command**: `npm run build`
- **Start Command**: `npm start` (runs `cross-env NODE_ENV=production node server/index.js`)

> Note: The Express server automatically binds to host `0.0.0.0` and listens on `process.env.PORT` assigned dynamically by Railway.

---

## 2. Environment Variables Reference

Add the following environment variables in the **Variables** tab of your Railway Web Service:

| Variable Name | Required | Default / Example | Description |
|---|---|---|---|
| `PORT` | Auto | Assigned by Railway | Port where Express listens (`0.0.0.0:$PORT`) |
| `NODE_ENV` | Yes | `production` | Enables production static file serving and SPA fallback |
| `MYSQLHOST` or `DB_HOST` | Yes | From MySQL Plugin | MySQL database host address |
| `MYSQLPORT` or `DB_PORT` | Yes | `3306` | MySQL database port |
| `MYSQLUSER` or `DB_USER` | Yes | From MySQL Plugin | MySQL database username |
| `MYSQLPASSWORD` or `DB_PASSWORD` | Yes | From MySQL Plugin | MySQL database password |
| `MYSQLDATABASE` or `DB_NAME` | Yes | From MySQL Plugin | MySQL database name |
| `MYSQL_URL` or `DATABASE_URL` | Optional | `mysql://...` | Connection URL (supported as alternative to individual `DB_*` vars) |
| `SESSION_SECRET` | Yes | `a-long-secure-random-secret` | Random secret used for `express-session` signing |
| `COOKIE_SECURE` | Yes | `true` | Enables secure session cookies over Railway's HTTPS proxy |
| `UPLOAD_DIR` | Yes | `/app/uploads` | Path to Railway Persistent Volume mount directory |

---

## 3. Database Setup & Safe Migrations

### Step A: Provision MySQL Plugin
1. In your Railway project canvas, click **+ New** → **Database** → **Add MySQL**.
2. Railway automatically provisions MySQL and provides connection variables (`MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`, `MYSQL_URL`).

### Step B: Import Base Schema & Data
Using a MySQL GUI client (such as DBeaver, TablePlus, VS Code Database Client, or `mysql` CLI connected via Railway's public connection string):

1. Execute `database/explore_lanka.sql` to create core tables (`users`, `remember_tokens`, `features`, `adds`).
2. Execute `database/hotel_system.sql` to create hotel & booking tables (`hotels`, `hotel_rooms`, `bookings`, `contacts`, `hotel_reviews`, `product_feedback`).

### Step C: Run Safe Migration Scripts
Run the automated migration scripts to apply schema updates without dropping existing tables or data:

```bash
# Set your environment variables or connection string
export MYSQLHOST="<railway-mysql-host>"
export MYSQLUSER="<railway-user>"
export MYSQLPASSWORD="<railway-password>"
export MYSQLDATABASE="<railway-db-name>"
export MYSQLPORT="<railway-port>"

# Run safe migrations
node database/run-migration-003.js
node database/run-migration-004.mjs
node database/run-alter-media-type.mjs
```

### Step D: Import SLTDA Open Tourism Dataset
Populate the Stays page with 3,649 official accommodations from the Sri Lanka Tourism Development Authority dataset:

```bash
node database/import-tourism-dataset.js
```

> **MariaDB to MySQL Compatibility Note**: All schema files and migration scripts use idempotent `CREATE TABLE IF NOT EXISTS` and standard `InnoDB` engines with `utf8mb4` character set, ensuring 100% compatibility between MariaDB and MySQL 8.0+.

---

## 4. Persistent Storage for Media Uploads

User profile pictures and community post media are uploaded to `/uploads/...`. To prevent data loss when container builds re-deploy, use a **Railway Persistent Volume**.

### Step A: Mount Persistent Volume
1. In Railway Service Settings, go to **Volumes**.
2. Click **Add Volume**.
3. Set the Mount Path to `/app/uploads`.
4. Set environment variable `UPLOAD_DIR=/app/uploads` on your web service.

### Step B: Transfer Existing Uploads to Volume
To migrate existing local uploaded images into the Railway volume:

```bash
# Using Railway CLI:
railway volume upload /app/uploads ./public/uploads/

# Alternatively, copy files using SFTP/SCP or upload subdirectories:
# ./public/uploads/profiles/ -> /app/uploads/profiles/
# ./public/uploads/posts/ -> /app/uploads/posts/
```

### Destination Images (`Tourist_Images`)
Existing static destination assets in `public/Tourist_Images` are automatically included in the production build output (`dist/Tourist_Images`) when `npm run build` runs, and are served via portable web URLs (`/Tourist_Images/...`).

---

## 5. HTTPS & Cookie Security behind Proxy

Railway runs apps behind an edge HTTPS reverse proxy. The server is configured for secure production authentication:

- `app.set('trust proxy', 1);` reads proxy headers (`X-Forwarded-Proto`).
- Session cookies use `sameSite: 'lax'`, `httpOnly: true`, and `secure: true` when `COOKIE_SECURE=true`.

---

## 6. Verification and Health Checks

After deployment, verify the installation with these checks:

### Health Check Endpoint
- **URL**: `GET /health` or `GET /api/health`
- **Expected Response**:
  ```json
  {
    "status": "ok",
    "database": "connected",
    "timestamp": "2026-10-08T17:10:16.872Z"
  }
  ```

### Unknown API Route Check
- **URL**: `GET /api/nonexistent-route`
- **Expected Response** (HTTP 404):
  ```json
  {
    "error": "API endpoint not found."
  }
  ```
  *(Confirms API requests never leak the frontend `index.html` file).*

### React SPA Fallback Check
- **URL**: `GET /hotels` or `GET /places`
- **Expected Response** (HTTP 200 `text/html`):
  Renders the React app `index.html`.
