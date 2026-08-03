# Public Deployment Guide

Deploy the Padel Booking System for customer testing using **Render** (backend) and **Netlify** (frontend). Both offer free tiers.

---

## Architecture

| Component | Platform | URL (after deploy) |
|-----------|----------|-------------------|
| React frontend | Netlify | `https://YOUR-SITE.netlify.app` |
| ASP.NET Core API | Render | `https://padelbooking-api.onrender.com` |
| Database | SQLite (on Render disk) | Auto-created on startup |

---

## Step 1 — Deploy Backend (Render)

1. Open: **https://render.com/deploy?repo=https://github.com/ax6l4/PadelBooking-System**
2. Sign in with GitHub and approve access.
3. Render reads `render.yaml` and creates **padelbooking-api**.
4. When prompted for environment variables, set:
   - `FRONTEND_URL` = `https://YOUR-SITE.netlify.app` *(update after Step 2)*
5. Click **Apply** and wait for deploy (~5–10 min first time).
6. Copy your API URL: `https://padelbooking-api.onrender.com`
7. Test: open `https://padelbooking-api.onrender.com/api/Court` — should return JSON.

> **Note:** Free tier sleeps after 15 min inactivity. First request may take ~30 seconds (cold start).

---

## Step 2 — Deploy Frontend (Netlify)

1. Open: **https://app.netlify.com/start**
2. Import Git repository: `ax6l4/PadelBooking-System`
3. Configure build settings:

   | Setting | Value |
   |---------|-------|
   | Base directory | `Frontend` |
   | Build command | `npm run build` |
   | Publish directory | `dist` |

4. Add environment variable:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://padelbooking-api.onrender.com/api` |

5. Deploy site and copy your URL, e.g. `https://padel-booking-demo.netlify.app`

---

## Step 3 — Link Frontend + Backend

1. In **Render** dashboard → **padelbooking-api** → **Environment**
2. Set `FRONTEND_URL` = your Netlify URL (e.g. `https://padel-booking-demo.netlify.app`)
3. Save changes (Render will redeploy automatically).

This enables CORS and Thawani mock payment callbacks.

---

## Step 4 — Verify Deployment

Open your Netlify URL and test:

- [ ] Home page loads
- [ ] `/booking` — select date, times appear
- [ ] Create booking with phone number
- [ ] Cash payment confirms
- [ ] Thawani redirects to callback
- [ ] `/admin` — courts, bookings, offers work
- [ ] Login: `admin@padel.com` / `admin123`

---

## Environment Variables Reference

### Backend (Render)

| Variable | Example | Purpose |
|----------|---------|---------|
| `ASPNETCORE_ENVIRONMENT` | `Production` | Set in render.yaml |
| `FRONTEND_URL` | `https://your-site.netlify.app` | CORS + payment callbacks |
| `Thawani__SecretKey` | *(optional)* | Real Thawani sandbox |
| `Thawani__PublishableKey` | *(optional)* | Real Thawani sandbox |

### Frontend (Netlify)

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `https://padelbooking-api.onrender.com/api` | API base URL (build time) |

---

## Alternative: Vercel (Frontend)

1. Import repo at https://vercel.com/new
2. Set root directory to `Frontend`
3. Add `VITE_API_URL` environment variable
4. Deploy

`vercel.json` is included in the Frontend folder.

---

## Customer-Facing URL

After deployment, share your **Netlify (or Vercel) URL** with customers:

```
https://YOUR-SITE.netlify.app/booking
```

---

## Limitations (Free Tier)

- Render API sleeps when idle (cold starts)
- SQLite data may reset on Render redeploy (demo accounts re-seeded automatically)
- Thawani runs in mock mode without API keys
- Admin dashboard is not login-protected

---

*Repository: https://github.com/ax6l4/PadelBooking-System*
