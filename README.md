# Grand Line Chronicles 🏴‍☠️

> *"I'm going to be King of the Pirates."*

A collaborative, gamified habit tracker set in the One Piece universe. Build real-world habits while sailing the Grand Line with your crew — completing tasks advances your ship, powers up your characters, and drives you toward an epic year-long journey.

---

## What is it?

Grand Line Chronicles turns habit-building into a shared One Piece adventure. A party of up to 6 people joins together, picks their Straw Hat crew members, and embarks on the canonical story from Romance Dawn all the way to the Final Island.

Every real-world habit you complete — studying, exercising, creating, reviewing — earns XP that moves the ship forward. The journey is designed to last roughly one year of consistent effort, with clear weekly progress visible at all times.

### Core features

- **Collaborative by design** — party progress is the main metric, not individual rankings
- **One Piece narrative** — 17+ story arcs, each with a boss fight to defeat before moving on
- **Habit-first mechanics** — daily soft caps and weekly budgets reward consistency over grinding
- **5 task types** — Training, Study, Immersion, Creation, Review — each growing different character stats
- **Boss fights** — each arc ends with a boss that requires sustained daily effort from the whole crew to defeat
- **Catch-up system** — returning after absence gives the party a Second Wind XP bonus
- **Fairness caps** — weekly XP budgets normalise by party size so one person can't carry the crew
- **Push notifications** — daily 10am reminders if you have pending missions (PWA, Android + iOS 16.4+)
- **Installable PWA** — works as a mobile app on Android and iOS

---

## The journey

The story follows the manga arc order, from East Blue to the New World:

| Act | Arcs | Duration |
|-----|------|----------|
| East Blue | Romance Dawn → Loguetown | ~10 weeks |
| Grand Line Part 1 | Drum Island → Sabaody | ~20 weeks |
| New World | Marineford → Wano | ~22 weeks |
| The Final Island | ??? | hidden until Wano is cleared |

Each arc has its own progress bar. When the bar fills and your crew meets the Power and Bounty stat thresholds, the boss fight unlocks. Defeat the boss as a team to sail to the next island.

---

## Task system

Tasks have five types that grow two core stats:

| Type | Stat | Example |
|------|------|---------|
| 🗡️ Training | Power | Flashcards, drills |
| 📖 Study | Power | Textbooks, reading |
| 🌊 Immersion | Bounty | Watching, listening |
| ✍️ Creation | Bounty | Writing, speaking |
| 🔁 Review | Power + Bounty | Revision, reflection |

Difficulty tiers (Den Den → Rookie → Pirate → Supernova → Yonko) determine XP and stat rewards. Tasks can repeat daily, weekly, or on custom days.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Animations | Framer Motion |
| State | Zustand |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) |
| Hosting | Vercel (frontend) + Supabase (backend) |
| Push notifications | Web Push API + VAPID + Supabase Edge Functions |
| PWA | vite-plugin-pwa + Workbox |
| Testing | Vitest |

### External services

- **[Supabase](https://supabase.com)** — database, authentication, realtime subscriptions, edge functions. Free tier is sufficient for parties up to ~20 people.
- **[Vercel](https://vercel.com)** — frontend hosting with automatic deploys from GitHub. Free tier.
- **Web Push / VAPID** — push notifications via the browser's native Push API. No third-party service required — notifications are sent directly from the Supabase Edge Function to the device.

---

## Setup

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- A free [Supabase](https://supabase.com) account

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run these files in order:
   - `supabase/migrations/001_schema.sql` — database schema
   - `supabase/migrations/002_seed.sql` — arc and character data
   - `supabase/migrations/003_character_claimed_arc.sql`
   - `supabase/migrations/004_enable_realtime.sql`
   - `supabase/migrations/005_push_subscriptions.sql`
   - `supabase/policies/rls.sql` — row-level security
3. Go to **Authentication → URL Configuration** and add your deployed URL to **Redirect URLs**
4. Go to **Project Settings → API** and copy your **Project URL** and **Publishable key**

### 2. VAPID keys (for push notifications)

```bash
npx web-push generate-vapid-keys
```

Add the output to **Supabase → Settings → Edge Functions → Secrets**:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_MAILTO=mailto:your@email.com
```

### 3. Frontend

```bash
cd frontend
pnpm install
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

```bash
pnpm dev        # development server at http://localhost:5173
pnpm build      # production build
pnpm test       # run test suite (129 tests)
```

### 4. Push notification cron (optional)

In **Supabase SQL Editor**, set up the daily 10am reminder (Europe/Madrid):

```sql
-- Enable pg_cron
create extension if not exists pg_cron;

-- 10am CEST (summer, UTC+2)
select cron.schedule('notify-summer', '0 8 * * *', $$
  select net.http_post(
    url := 'https://YOUR-PROJECT.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer YOUR-ANON-KEY'),
    body := '{}'::jsonb
  );
$$);

-- 10am CET (winter, UTC+1)
select cron.schedule('notify-winter', '0 9 * * *', $$
  select net.http_post(
    url := 'https://YOUR-PROJECT.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer YOUR-ANON-KEY'),
    body := '{}'::jsonb
  );
$$);
```

Deploy the edge function via the Supabase dashboard → **Edge Functions → New Function → send-notifications** → paste `supabase/functions/send-notifications/index.ts`.

### 5. Deploy to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add the three environment variables from your `.env`
5. Deploy

---

## Project structure

```
grand-line-chronicles/
├── supabase/
│   ├── migrations/          # Database schema and seed data
│   ├── policies/            # Row Level Security
│   └── functions/
│       └── send-notifications/  # Push notification cron
└── frontend/
    ├── public/
    │   ├── icons/           # PWA icons (generate with pnpm generate-icons)
    │   ├── bosses/          # Boss images (morgan.webp, buggy.png, etc.)
    │   ├── ships/           # going_merry.png, sunny.png
    │   ├── islands/         # Island destination images (romance_dawn.jpg, etc.)
    │   ├── images/          # sea_texture.jpg
    │   └── sw-push.js       # Service worker push handlers
    └── src/
        ├── __tests__/       # Vitest test suite (129 tests)
        ├── components/
        │   ├── ui/          # Base components (Button, Card, Skeleton, etc.)
        │   ├── layout/      # AppShell, bottom navigation
        │   ├── tasks/       # TaskCard, TaskForm
        │   ├── map/         # VoyageHeader (dashboard header)
        │   └── dashboard/   # NotificationBanner, NotificationSettings
        ├── lib/
        │   ├── supabase.ts  # Supabase client
        │   ├── xp.ts        # XP calculations, caps, streaks
        │   └── push.ts      # Push notification utilities
        ├── pages/           # Route-level components
        ├── store/           # Zustand stores (auth, party, tasks)
        └── types/           # TypeScript types and constants
```

---

## Assets

| Path | Description |
|------|-------------|
| `public/images/sea_texture.jpg` | Background texture for the voyage header |
| `public/ships/going_merry.png` | Going Merry ship (arcs 1–10) |
| `public/ships/sunny.png` | Thousand Sunny ship (arc 11+) |
| `public/bosses/{name}.png/webp` | Boss images (morgan, buggy, kuro, etc.) |
| `public/islands/{slug}.jpg/png/webp` | Island destination images |
| `public/icons/icon-192.png` | PWA icon (generate with `pnpm generate-icons`) |
| `public/icons/icon-512.png` | PWA icon large (generate with `pnpm generate-icons`) |
| `public/icons/badge-96.png` | Android notification badge (monochrome white) |

Island image slugs follow the arc name lowercased with spaces replaced by underscores: `romance_dawn`, `orange_town`, `drum_island`, `alabasta`, `skypiea`, `enies_lobby`, `thriller_bark`, `marineford`, `fish_man_island`, `dressrosa`, `whole_cake_island`, `wano_country`.

---

## Game design

Full game design decisions, XP formulas, arc pacing, and system design are documented in `GrandLineChronicles_GDD.md`.

---

## Disclaimer

Grand Line Chronicles is a fan-made project. One Piece and all related characters and story elements are the property of Eiichiro Oda and Toei Animation. This project is not affiliated with or endorsed by the rights holders.