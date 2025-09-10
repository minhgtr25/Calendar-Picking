# Availability App (Vercel + Postgres)

- Serverless backend on Vercel (`/api/*`)
- Modern UI in `public/`
- Data in **Vercel Postgres**

## Local Dev (port 4000)
```bash
npm i
cp .env.example .env   # set ADMIN_KEY; optionally set POSTGRES_URL for local DB
npm run dev            # http://localhost:4000
```
Tip: use `vercel link` then `vercel env pull` to fetch Postgres env for local tests.

## Deploy on Vercel
1. Create project on Vercel, attach **Postgres** (free tier).
2. Add env `ADMIN_KEY` in Project Settings.
3. Push to GitHub and Import → Deploy.
4. User: `/` • Admin: `/admin` (enter Admin Key).

## API
- `GET /api/availabilities`
- `POST /api/availabilities` `{ name, date, slots[] }`
- `POST /api/availabilities/bulk` `{ name, days:[{date, slots[]}] }`
- `PUT /api/availabilities/:id` (requires x-admin-key)
- `DELETE /api/availabilities/:id` (requires x-admin-key)
- `GET /api/admin/check`
- `GET /api/health`
