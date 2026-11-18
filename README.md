# 수수 부부 캘린더♥️

## Setup

1. Create a Supabase project. In SQL Editor, run `supabase/schema.sql` (safe to re-run after updates).
2. `cp .env.example .env.local` and fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FAMILY_PASSCODE, SESSION_SECRET.
3. `npm install && npm run dev` → http://localhost:3000

## Put it online (free)

1. Push this folder to a private GitHub repo.
2. On vercel.com (Hobby plan), import the repo. Under Environment Variables, add every name from `.env.example`.
3. Deploy. Open the `.vercel.app` address on every device and enter the family passcode.

## Install as an app (PWA)

Works only on the deployed https address, not by opening files directly.

- iPhone / iPad: Safari → Share → Add to Home Screen (or tap 앱으로 설치 at the bottom for the steps).
- Android: tap 앱으로 설치 at the bottom (or Chrome menu → Install app).
- Laptop: Chrome/Edge → tap 앱으로 설치, or the install icon in the address bar. Safari on Mac: File → Add to Dock.
  Offline, the app shows a simple "no connection" page; data always needs internet.

## Wall display

Open the app, tap 전체 화면 (fullscreen) and 화면 켜두기 (keep screen on) at the bottom. Screens sync every 15 seconds,
and sign-in is renewed automatically, so the wall display stays logged in.

Security notes: use a passcode of 8+ characters. Failed tries are limited (8 misses = 15 minute lock). Use 로그아웃 (bottom) on shared devices; to sign out every device at once, change SESSION_SECRET in Vercel and redeploy. Never share or commit SUPABASE_SERVICE_ROLE_KEY.

Weeks run Sunday to Saturday; weekly totals include days from neighboring months.
