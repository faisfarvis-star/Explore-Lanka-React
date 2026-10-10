# Explore Lanka — React + Node.js

A JavaScript rewrite of the Explore Lanka tourism guide. The interface is built with React and Vite; the API uses Node.js, Express, and MySQL. The previous PHP runtime is not required.

## What is included

- Destination search, filters, detail pages, saved places, and visitor reviews
- Interactive Sri Lankan photo gallery (`/gallery`) with destination grouping, search, category filters, and keyboard-navigable lightbox
- **Community Feed & Member Profiles** (`/feed`, `/community/members/:id`) — authentic travel community where members share moments, photos, and Sri Lanka destination tags, like/unlike posts, comment in real time, and view public member profiles with privacy protections (emails and phone numbers remain strictly private)
- Experiences and tourism feature pages
- Hotel search, hotel/room details, date-based booking requests, and booking cancellation
- **Stays page** (`/hotels`) showing 3,649 accommodations from the Sri Lanka Tourism Authority (SLTDA) open dataset — guest houses, bungalows, villas, hostels, homestays and hotels — with licence/record status badges, contact details, and booking links
- Account registration, sign-in, profile editing, and user dashboard
- Contact form
- Administrator dashboard and management views for destinations, features, users, hotels, rooms, bookings, contacts, and reviews
- Existing Sri Lankan destination photos and MySQL schema
- Responsive layout with light/dark theme

## Run on Windows with XAMPP MySQL

1. Install Node.js 22 or newer and XAMPP.
2. Open XAMPP Control Panel and start **MySQL**. Start **Apache** too while using phpMyAdmin for the import. Apache can be stopped afterwards; Node.js runs the app.
3. Open `http://localhost/phpmyadmin` and import these files into `explore_lanka_db`, in this order:
   - `database/explore_lanka.sql`
   - `database/hotel_system.sql`
   - `database/migrations/001_add_product_feedback_comment.sql`
   - `database/migrations/002_add_dataset_fields_to_hotels.sql`
   - `database/migrations/003_community_posts_comments_likes.sql`
4. In this project folder, copy `.env.example` to `.env`. The defaults work with a typical local XAMPP MySQL setup. If your MySQL has a password, set `DB_PASSWORD` in `.env`.
5. Open Command Prompt or PowerShell in this project folder and run:

   ```bash
   npm install
   npm run dev
   ```

   On Windows, after importing the database, you can also double-click `run-windows.bat`; it creates `.env` and installs packages the first time.

6. Open **http://localhost:5173**. The React site uses the Express API on port 3000, which connects to MySQL.

### Demo accounts

- Admin: `admin@explorelanka.lk` / `password123`
- User: `kamal@email.com` / `password123`

The included fresh-install SQL uses bcrypt hashes for the documented demo password. Existing accounts keep their passwords; no login bypass is used. Back up an existing database before importing sample SQL.

## Production build & Railway Deployment

```bash
npm run build
npm start
```

For full Railway cloud deployment instructions, variable definitions, database migration steps, persistent volume setup, and health verification, refer to [RAILWAY_DEPLOYMENT.md](file:///c:/Users/X1%20CARBON/OneDrive%20-%20International%20Campus%20of%20Science%20and%20Technology/Desktop/Explore-Lanka-React/RAILWAY_DEPLOYMENT.md).

## Database Migrations (For Existing Databases)

If you already have an existing `explore_lanka_db` database with user accounts and bookings, **do not re-import the full schema or drop tables**. Instead, run the safe migrations to update your schema without losing data:

### Migration 001 — Add comment column to product_feedback

1. Open phpMyAdmin at `http://localhost/phpmyadmin`.
2. In the left sidebar, click on your existing database: **`explore_lanka_db`**.
3. Go to the **Import** tab, click **Choose File**, select `database/migrations/001_add_product_feedback_comment.sql`, and click **Go**.

This migration safely checks if the `comment` column already exists, adds it without touching existing records, and migrates any legacy `message` field data. Idempotent — safe to run multiple times.

### Migration 002 — Add dataset fields to hotels table

Required before importing the tourism dataset:

1. In phpMyAdmin, import `database/migrations/002_add_dataset_fields_to_hotels.sql` against `explore_lanka_db`.

This adds the columns `accommodation_type`, `grade`, `registration_number`, `licence_status`, `record_status`, `booking_link`, `mobile`, and `dataset_source` to the `hotels` table.

### Migration 003 — Add Community Feed, Comments, and Likes

Enables the social travel feed and public member profiles:

1. Open phpMyAdmin at `http://localhost/phpmyadmin` and select `explore_lanka_db`.
2. Go to the **Import** tab, select `database/migrations/003_community_posts_comments_likes.sql`, and click **Go**.

**What Migration 003 does safely:**
- Adds `bio`, `city`, and `country` columns to the `users` table (if missing).
- Creates `community_posts` table with destination tags, image attachments, and status tracking.
- Creates `community_likes` table with a unique constraint (`unique_post_user_like`) preventing duplicate likes.
- Creates `community_comments` table with timestamp and author associations.
- Preserves all existing users, bookings, places, and reviews without deleting anything.

## Tourism Dataset Import

The Stays page is pre-populated from `Sri_Lanka_Tourism_Dataset111.xlsx`, which contains official SLTDA accommodation registry data.

### To import (or re-import) the dataset

```bash
# Install the xlsx package (once)
npm install --save-dev xlsx

# Run migration 002 first (if not already done)
# (import database/migrations/002_add_dataset_fields_to_hotels.sql in phpMyAdmin)

# Run the import script
node database/import-tourism-dataset.js
```

**The import script is safe and repeatable:**
- Never drops or truncates existing data
- Deduplicates by SLTDA Registration Number, then by normalised name + district
- Excludes "Restaurant" and "Tourist Friendly Eating Place" types
- Marks every imported row with `dataset_source = 'sltda_import'`
- Prints an import summary (inserted / skipped / excluded / errors)

### Dataset summary (v1 import)

| Metric | Count |
|--------|-------|
| Inserted | 3,649 |
| Skipped (duplicates) | 6 |
| Excluded (restaurants/dining) | 1,089 |
| Errors | 0 |

### What the Stays page shows

- **Featured Stays** section: the 10 hand-curated hotels with room types and booking
- **Registered Accommodations** section (SLTDA Registry badge): all dataset records
  - Accommodation type, district, grade, and star rating (where available)
  - **Licence status badge** (green = valid; red = expired)
  - **Record status badge** (blue = official; purple = historical; amber = travel-site)
  - ⚠ "Verify before booking" warning for any entry without a valid licence
  - Phone, mobile, email links (clickable)
  - Website and booking links (open in new tab)
  - SLTDA registration number for verification
- Filters: search by name/town/district, dropdown for district, dropdown for accommodation type

### Data quality note

The dataset originates from the SLTDA open registry (circa 2018–2026). Record status and licence status are shown accurately from the source data. Many entries are historical or unverified. Always verify directly with the property before booking.

## Project structure

```text
Explore-Lanka-React/
├── Sri_Lanka_Tourism_Dataset111.xlsx   # SLTDA accommodation dataset
├── database/
│   ├── explore_lanka.sql               # Base schema
│   ├── hotel_system.sql                # Hotel/booking schema
│   ├── import-tourism-dataset.js       # Dataset import script
│   └── migrations/
│       ├── 001_add_product_feedback_comment.sql
│       └── 002_add_dataset_fields_to_hotels.sql
├── public/                 # Logos, banners, and Sri Lankan photos
├── server/index.js         # Express API, MySQL queries, sessions, access checks
├── src/App.jsx             # React routes, pages, forms, and admin views
├── src/styles.css          # Responsive visual design and theme styles
├── .env.example
├── index.html
└── package.json
```

## Troubleshooting

- **"Unknown column 'pf.comment' in 'field list':"** Run `database/migrations/001_add_product_feedback_comment.sql` in phpMyAdmin.
- **Stays page shows no dataset entries:** Run Migration 002 and then `node database/import-tourism-dataset.js`.
- **Cannot connect to the API:** keep `npm run dev` running and check `http://localhost:3000/api/health`.
- **Database connection failed:** ensure XAMPP MySQL is running and check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in `.env`.
- **Hotels or booking tables missing:** import `database/hotel_system.sql` after `database/explore_lanka.sql`.
- **Port already in use:** change `PORT` in `.env` and update the Vite proxy in `vite.config.js` if the API port changes.
- **Import script fails with 'xlsx not found':** run `npm install --save-dev xlsx` first.

## Validation and scope

The React pages and Express API replace the PHP runtime. MySQL is retained. Payment processing and email delivery were not added: bookings are requests, and contact messages are stored for administrators. Profile and admin image uploads support JPEG, PNG and WebP (5 MB). Multi-image gallery management is not ported; records use one main image. The original PHP code is not included in the runtime.

Dataset-imported accommodations are read-only reference listings; they do not support booking through the app. Only the 10 hand-curated hotels have room types and booking flows.


