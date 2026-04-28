# Grand Line Chronicles 🏴‍☠️

A collaborative, gamified habit tracker set in the One Piece universe.
Built with React 19 + Vite + Tailwind CSS + Supabase.

---

## Prerequisites

- Node.js 20+
- pnpm (recommended) / npm / yarn
- A free [Supabase](https://supabase.com) account

---

## 1. Supabase Setup

### 1.1 Create a project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Choose a name (e.g. `grand-line-chronicles`), set a strong database password, pick a region close to you
4. Wait ~2 minutes for the project to provision

### 1.2 Run the database schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the contents of `supabase/migrations/001_schema.sql` and paste it in
4. Click **Run** — you should see "Success"
5. Repeat with `supabase/migrations/002_seed.sql` for initial arc/character data

### 1.3 Enable Row Level Security policies
1. Still in SQL Editor, run `supabase/policies/rls.sql`

### 1.4 Enable Email Auth
1. Go to **Authentication → Providers**
2. Ensure **Email** is enabled
3. For development, disable "Confirm email" under **Authentication → Settings** so you can sign up instantly

### 1.5 Get your API keys
1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **Publishable (public) key** — previously called "anon key"

---

## 2. Frontend Setup

```bash
cd frontend
pnpm install       # or npm install
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

```bash
pnpm dev           # starts on http://localhost:5173
```

---

## 3. First Run

1. Open the app and **Register** with your email
2. **Create a party** — you'll get a 6-character invite code
3. Share the invite code with your crew
4. Each member registers, clicks **Join Party**, enters the code
5. Each member picks their **crew member** character
6. Start completing tasks — the journey begins!

---

## 4. Deployment

### Frontend (Vercel)
```bash
cd frontend
pnpm build
# Push to GitHub, connect repo to Vercel, set env vars in Vercel dashboard
```

### Backend
Supabase is already hosted — nothing to deploy.

---

## 5. Project Structure

```
grand-line-chronicles/
│
├── README.md                          ← Full setup guide (start here)
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql             ← Run first: all tables + triggers
│   │   └── 002_seed.sql               ← Run second: characters + all 18 arcs
│   └── policies/
│       └── rls.sql                    ← Run third: Row Level Security
│
└── frontend/
    ├── .env.example                   ← Copy to .env, fill in Supabase keys
    ├── index.html                     ← Entry HTML + Google Fonts
    ├── package.json                   ← Dependencies
    ├── vite.config.ts                 ← Vite + path aliases
    ├── tailwind.config.ts             ← Full parchment theme + custom fonts
    ├── tsconfig.json                  ← TypeScript config (baseUrl removed ✓)
    ├── tsconfig.node.json             ← Vite-specific TS config
    ├── postcss.config.js              ← PostCSS for Tailwind
    └── src/
        ├── main.tsx                   ← React entry point
        ├── App.tsx                    ← Router + auth guard
        ├── index.css                  ← Global styles + parchment texture
        │
        ├── types/index.ts             ← All TypeScript types + constants
        │
        ├── lib/
        │   ├── supabase.ts            ← Supabase client (publishable key ✓)
        │   └── xp.ts                  ← XP math, caps, Second Wind, streaks
        │
        ├── store/
        │   ├── authStore.ts           ← Session, profile, auth state
        │   ├── partyStore.ts          ← Party, members, arc progress
        │   └── tasksStore.ts          ← Tasks CRUD + complete logic
        │
        ├── components/
        │   ├── ui/index.tsx           ← Button, Card, Input, ProgressBar, etc.
        │   ├── layout/AppShell.tsx    ← App wrapper + bottom nav
        │   └── tasks/
        │       ├── TaskCard.tsx       ← Individual task with complete/edit/delete
        │       └── TaskForm.tsx       ← Create/edit form with type + difficulty slider
        │
        └── pages/
            ├── AuthPages.tsx          ← Login + Register (in one file)
            ├── OnboardingPage.tsx     ← Create/join party + pick character
            ├── DashboardPage.tsx      ← Arc progress + party weekly overview
            ├── TasksPage.tsx          ← Mission log with filter + modal
            ├── PartyPage.tsx          ← Full crew roster + stats
            └── ProfilePage.tsx        ← Individual stats + sign out
```