# Chrio Life Daily Devotional

A progressive web app (PWA) for a daily Christian devotional.

- **Readers** (public, no login): read today's devotional, go back to earlier days, search past days, share a devotional, change text size, install the app on their phone, and re-read days they have opened even when offline.
- **Admin dashboard** (`/admin`, login required): upload devotionals in bulk from a CSV file, add or edit a single day, delete days, see which of the next 30 days are still empty, and download a full backup as CSV.
- Readers can never see future devotionals. This is enforced by the database itself, not just hidden in the app, so you can safely upload months in advance.

**Stack:** React + Vite (front end, hosted on Vercel) and Supabase (database and admin login). Both have free plans that are enough for this app.

---

## Setup (about 20 minutes, one time)

### 1. Create the database on Supabase
1. Sign up at https://supabase.com and click **New project**. Pick any name (e.g. `chrio-life`), set a database password (store it safely), and choose the region closest to your readers (e.g. *West EU (London)* or *Europe (Frankfurt)* for Nigeria).
2. When the project is ready, open **SQL Editor → New query**, paste the full contents of `supabase/schema.sql`, and click **Run**. You should see "Success. No rows returned".

### 2. Turn off public sign-ups
Go to **Authentication → Sign In / Providers** (called *Providers* on some plans) and switch off **Allow new users to sign up**. Only people you add can log in.

### 3. Create your admin account
1. Go to **Authentication → Users → Add user → Create new user**.
2. Enter your email and a strong password, and tick **Auto Confirm User**.

### 4. Give that account admin rights
Back in **SQL Editor**, run this with your email:

```sql
insert into public.admins (user_id)
  select id from auth.users where email = 'you@example.com'
  on conflict do nothing;
```

Repeat steps 3–4 for anyone else who should manage devotionals.

### 5. Copy your API keys
Go to **Project Settings → API** (or **Data API**) and copy:
- **Project URL** → this is `VITE_SUPABASE_URL`
- **anon / public key** (or *publishable key*) → this is `VITE_SUPABASE_ANON_KEY`

The anon key is safe to put in a website; the database rules in `schema.sql` decide what it can do. **Never** use the `service_role` / secret key in this app.

### 6. Put the code on GitHub
1. Create a free account at https://github.com and a new **private** repository called `chrio-life-devotional`.
2. Upload all the files from this folder (drag and drop the folder contents on the repository page works), then **Commit changes**.

### 7. Deploy on Vercel
1. Sign in at https://vercel.com with your GitHub account and click **Add New → Project**. Import `chrio-life-devotional`.
2. Vercel detects **Vite** automatically. Leave the build settings as they are.
3. Open **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
   - `VITE_TIMEZONE` = `Africa/Lagos` (optional; this is the default)
4. Click **Deploy**. In about a minute you get a link like `https://chrio-life-devotional.vercel.app`.

### 8. Tell Supabase your website address
Go to **Authentication → URL Configuration**:
- **Site URL**: your Vercel link (or custom domain)
- **Redirect URLs**: add `https://YOUR-SITE/admin/reset`

This makes the "Forgot password" email work.

### 9. Upload your devotionals
Open `https://YOUR-SITE/admin`, sign in, choose **Upload CSV**, and upload your file. `sample-devotionals.csv` shows the format.

### Custom domain (optional)
In Vercel: **Project → Settings → Domains → Add** (e.g. `devotional.chriolife.org`) and follow the DNS instructions. Then update the Site URL and Redirect URL in step 8.

---

## CSV format

| Column | Required | Notes |
|---|---|---|
| `date` | yes | `2026-09-18`, `18/09/2026`, `18 September 2026`, or a spreadsheet date |
| `message` | yes | The devotional. New line inside the cell = new paragraph |
| `title` | | |
| `scripture` | | The verse text |
| `reference` | | e.g. `John 15:5` |
| `prayer` | | |
| `declaration` | | Also accepts a column called `confession` |
| `further_reading` | | Also accepts `bible reading`, `bible in one year` |
| `author` | | |

- Column names are matched loosely, so "Memory Verse", "Topic" and "Bible Reference" also work. The upload screen lists any columns it could not use.
- Uploading a date that already exists **replaces** that day. You can fix mistakes by editing the sheet and uploading again.
- Save from Excel as **CSV UTF-8** so quotes and special characters stay correct.
- Before anything is saved, the app shows a preview with any problem rows (unreadable dates, empty messages, duplicate dates).

---

## How readers install the app
- **Android (Chrome):** an **Install app** button appears in the header, or use the browser menu → *Add to Home screen*.
- **iPhone (Safari):** tap **Share → Add to Home Screen**.

---

## Developing locally
Requires Node.js 18 or newer.

```bash
cp .env.example .env.local   # then fill in your two Supabase values
npm install
npm run dev                  # http://localhost:5173
npm run build                # production build in /dist
```

The offline service worker only runs in the production build.

### Project structure
```
public/
  manifest.webmanifest   PWA name, colours, icons
  sw.js                  service worker (offline shell + offline reading)
  icons/                 app icons
supabase/schema.sql      tables, security rules, admin setup
src/
  main.jsx               entry point, service worker registration
  App.jsx                routes
  styles.css             all styles and colour tokens
  lib/
    supabase.js          database client
    api.js               all database reads and writes
    auth.jsx             admin login state
    csv.js               CSV parsing, date parsing, template, export
    dates.js             dates and the ministry time zone
    hooks.js             text size, install prompt, midnight rollover
  components/            header, logo, toast, setup notice
  pages/
    DayPage.jsx          reader: one day's devotional
    Archive.jsx          reader: past days
    admin/               login, password reset, overview, upload, list, edit
```

### Common changes
- **Colours and fonts:** the variables at the top of `src/styles.css`. Update `theme_color` in `public/manifest.webmanifest` and `index.html` to match.
- **Time zone:** change `Africa/Lagos` in `supabase/schema.sql` (function `local_today`, then re-run the file) **and** `VITE_TIMEZONE` on Vercel.
- **New field** (e.g. `audio_url`): add the column in Supabase (`alter table devotionals add column audio_url text not null default '';`), add it to `FIELDS` and `ALIASES` in `src/lib/csv.js`, to the form in `pages/admin/EditEntry.jsx`, and to `pages/DayPage.jsx`.
- **After changing `public/sw.js`,** bump `VERSION` at the top so phones pick up the new version.

## Backups
Use **Download backup** on the admin overview regularly. The file can be uploaded again as-is to restore everything.
