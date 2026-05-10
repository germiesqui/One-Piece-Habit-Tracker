# Grand Line Chronicles — Game Design Document
### Version 1.1 | Collaborative One Piece Habit Tracker
### Last updated: May 2026

---

## 1. Vision & Premise

**Grand Line Chronicles** is a collaborative, gamified habit tracker set in the One Piece universe. A party of players (2–6) embarks on the Straw Hat crew's canonical journey from Romance Dawn to the Final Island. Every real-world habit completed advances the ship, powers up crew members, and drives a shared narrative forward.

The journey is **finite and epic** — designed to last approximately one year of consistent effort — with clear weekly progress visible at all times. The app is built mobile-first, fully responsive for tablet and desktop, and installable as a PWA on Android and iOS 16.4+.

---

## 2. Core Design Pillars

1. **Collaborative over competitive** — party progress is the main metric. Individual stats exist for personal pride, not ranking.
2. **Consistency over intensity** — the XP system rewards showing up daily, not grinding.
3. **Narrative momentum** — every milestone has a story beat. Players feel like they're living the manga.
4. **Versatile by design** — task types work for language learning, fitness, creative projects, or any skill-building goal.
5. **Fair by default** — XP caps and catch-up mechanics ensure no one person can dominate or be left behind permanently.

---

## 3. Player & Crew System

### 3.1 Player–Character Relationship

- Each player **claims a Straw Hat crew member** as their character. This is their identity on the ship.
- Characters **not claimed by any player** are NPC crew members — they receive averaged XP automatically so the crew always feels complete.
- **New crew members join as the story progresses**. When a new character unlocks, any player can switch to them from the next arc onward.
- Switching characters is allowed **once per arc** (tracked via `character_claimed_arc` column). Stats are tied to the player account, not the character. The switch button is locked during the arc the character was claimed on and unlocks when the next arc begins.

### 3.2 Character Classes & Stat Bonuses

Each crew member has a passive bonus that amplifies personal stat gain (does not affect party XP):

| Character | Unlocks | Class Bonus |
|-----------|---------|-------------|
| Luffy | Arc 1 | +15% Power from Training tasks |
| Zoro | Arc 1 | +20% Power from Study tasks |
| Nami | Arc 1 | +15% Bounty from Review tasks |
| Usopp | Arc 3 | +15% Bounty from Creation tasks |
| Sanji | Arc 4 | +20% Bounty from Immersion tasks |
| Chopper | Arc 7 | +10% to all stats |
| Robin | Arc 8 | +15% Power from Study tasks |
| Franky | Arc 10 | +20% Power from Creation tasks |
| Brook | Arc 11 | +20% Bounty from Immersion tasks |
| Jinbe | Arc 17 | +10% to all stats |

---

## 4. Task System

### 4.1 Task Types

Five task types map to two core stats. Tasks are **personal** — each player creates their own.

| Type | Icon | Primary Stat | Language Example | General Example |
|------|------|-------------|-----------------|-----------------|
| Training | 🗡️ | Power | Anki / grammar drills | Flashcards, coding katas |
| Study | 📖 | Power | Textbook / reading | Reading, research |
| Immersion | 🌊 | Bounty | Watching / listening | Podcasts, documentaries |
| Creation | ✍️ | Bounty | Writing / speaking | Making, producing |
| Review | 🔁 | Power + Bounty (50/50) | Reviewing old material | Revision, reflection |

**Power** advances crew strength (required to unlock boss fights).
**Bounty** advances crew notoriety (required to proceed to the next island).
**Ship Progress** = Power + Bounty combined, averaged across the whole party.

### 4.2 Difficulty Tiers

| Tier | Name | Time | Base XP |
|------|------|------|---------|
| 1 | Den Den | ~5 min | 10 XP |
| 2 | Rookie | ~15 min | 25 XP |
| 3 | Pirate | ~30 min | 50 XP |
| 4 | Supernova | ~1 hour | 90 XP |
| 5 | Yonko | ~2h+ | 150 XP |

Stat split (Power vs Bounty) is determined by task type, not difficulty. Difficulty determines total XP and stat points.

### 4.3 Task Repeat Types

- **None** — one-off, completes once and never nags again
- **Daily** — resets every midnight; shown as pending each new day
- **Weekly** — resets every Monday; marked complete for the full week once done on any day
- **Custom** — specific days of the week; resets weekly on Monday

### 4.4 Task Rules

- Tasks can be edited or deleted at any time, **unless completed today**
- Completions can be **undone** (today only) via the undo button on the task card
- Undo is blocked if the arc has already advanced since the completion (arc status = `completed`)
- Completed instances are logged permanently in the `completions` table

---

## 5. XP & Progression System

### 5.1 Weekly XP Budget (Fairness Cap)

Each player has a **weekly XP budget** normalised by party size:

```
Weekly Budget = 300 XP (1–2 players)
             = 250 XP per player (3–4 players)
             = 220 XP per player (5–6 players)
```

- XP **within budget** contributes to personal stats AND party progress.
- XP **above budget** goes to a personal reserve — boosts individual Power/Bounty only, not shared ship progress.
- Overachievers are still rewarded; they just can't carry the party alone.

### 5.2 Daily Soft Cap (Consistency Enforcement)

| Task # | XP multiplier |
|--------|---------------|
| 1–3 | 100% |
| 4–5 | 50% |
| 6+ | 25% |

Maximum single-day contribution is ~40% of weekly budget. Optimal cadence: 2–3 tasks/day, 5–6 days/week.

### 5.3 Party Progress

Party ship progress = **average of all players' in-budget XP**. A player earning 0 XP drags the average down, but one player cannot carry the ship alone.

---

## 6. Island Progression & Arc System

### 6.1 Full Arc Map (Manga Order)

| # | Arc(s) | Weeks | Boss | Power req | Bounty req |
|---|--------|-------|------|-----------|------------|
| 1 | Romance Dawn + Shells Town | 2 | Captain Morgan | 50 | 30 |
| 2 | Orange Town | 2 | Buggy | 80 | 60 |
| 3 | Syrup Village | 2 | Captain Kuro | 110 | 90 |
| 4 | Baratie | 2 | Don Krieg | 150 | 120 |
| 5 | Arlong Park | 3 | Arlong | 200 | 180 |
| 6 | Loguetown + Reverse Mountain | 2 | — (transition) | 230 | 210 |
| 7 | Drum Island | 3 | Wapol | 280 | 260 |
| 8 | Alabasta | 4 | Crocodile | 370 | 350 |
| 9 | Skypiea | 4 | Enel | 460 | 460 |
| 10 | Water 7 + Enies Lobby | 5 | Rob Lucci | 600 | 580 |
| 11 | Thriller Bark | 3 | Gecko Moria | 680 | 650 |
| 12 | Sabaody + Impel Down | 3 | — (transition) | 740 | 710 |
| 13 | Marineford | 3 | Admiral Akainu | 820 | 790 |
| 14 | Fish-Man Island | 2 | Hody Jones | 870 | 850 |
| 15 | Punk Hazard + Dressrosa | 5 | Donquixote Doflamingo | 1050 | 1020 |
| 16 | Whole Cake Island | 4 | Big Mom | 1200 | 1180 |
| 17 | Wano Country | 5 | Kaido | 1400 | 1380 |
| 18 | ??? — The Final Island | 3 | — (finale) | 1500 | 1500 |

> **[ADMIN NOTE — SPOILER HIDDEN]** Arc 18 is intentionally unnamed in all UI-facing text and flagged `hidden: true` in the database. It reveals only when Wano is cleared. To reveal early: set `hidden = false` on arc 18 via the Supabase Table Editor.

### 6.2 Arc Progression Flow

```
active → (xp full + stats met) → boss_active → (hp = 0) → completed → next arc active
                                                                 ↑
                              (no boss arc) ────────────────────┘
```

- Arc bar fills with party XP contributions
- When full, Power and Bounty thresholds are checked against party averages
- If stats not met: bar stays full, warning shown — keep earning stats
- If stats met and no boss: arc skips straight to next (transition arcs)
- If stats met and boss exists: boss fight begins immediately

### 6.3 Arc Requirements Gate

To unlock a boss fight the party must meet **both**:
1. Arc progress bar at 100%
2. Party average Power ≥ arc `power_required`
3. Party average Bounty ≥ arc `bounty_required`

---

## 7. Boss Fight System

### 7.1 Boss HP

```
Boss HP = boss_hp_base × number of players
```

Boss HP base varies by arc (300 for early arcs, up to 900 for Wano).

### 7.2 Damage

- Each task completion during a boss fight deals damage equal to the task's raw XP value
- The weekly soft cap is not lifted during boss fights — normal daily limits apply
- Damage is applied immediately on task completion

### 7.3 Implemented Mechanics

- Boss HP drains as tasks are completed ✅
- Arc reverts to `active` if a completion is undone and XP drops below threshold ✅
- Boss HP is restored if a completion is undone during a fight ✅

### 7.4 Planned but not yet implemented

- **Counterattack** — boss recovering HP if a player completes 0 tasks in a day (designed, not built)
- **14-day reset** — boss fight resetting if not cleared in time (designed, not built)
- **NPC substitute** — absent player replaced by NPC at 50% damage (designed, not built)
- **Victory bonus** — +50 XP personal reward on boss defeat (designed, not built)

These mechanics are documented in the DB schema but the frontend enforcement logic is pending.

---

## 8. Catch-Up & Return Mechanics

### 8.1 Second Wind System

Tracked via `consecutive_missed_days` on the profile, updated on every login and on tab refocus via `visibilitychange`.

| Days missed | Party XP bonus | Personal multiplier | Message |
|-------------|---------------|---------------------|---------|
| 0–2 | 0 | 1× | — |
| 3–4 | +30 XP | 1.5× first 3 tasks | "The crew spotted you on the horizon!" |
| 5–7 | +60 XP | 1.5× first 3 tasks | "A returning nakama brings fresh resolve!" |
| 8–13 | +100 XP | 1.5× first 3 tasks | "Like Luffy after two years of training!" |
| 14+ | +150 XP | 1.5× first 3 tasks | "The crew is whole again — nothing can stop them!" |

Party XP bonus is added to arc progress XP on the returning player's first task. Personal multiplier applies only to the first 3 tasks on the return day.

### 8.2 Streak Mechanics

- Streak increments when completing a task on a day after consecutive active days
- Completing on the same day multiple times does not increment the streak
- Missing a day resets streak to 0 (calculated on login / tab focus, not at midnight)
- `last_active_date` tracks the last day with at least one completion

### 8.3 Catch-Up Stat Bonus

If a player is >20% below party average on Power or Bounty, they silently receive +20% stat gain on all tasks until they're within range. No UI indicator — just faster growth.

---

## 9. Individual Statistics

Shown on the Profile / Log tab:

- Total XP earned (all time)
- Current Power level
- Current Bounty
- Task breakdown by type (bar chart)
- Longest streak
- Current streak
- Favourite task type (most completed)
- Total completions
- Arcs completed
- Journey progress (% of 17 visible arcs)

---

## 10. Party Statistics (Dashboard)

- Ship progress bar (current arc %)
- Current arc name and location
- Weekly XP contribution per member (progress bar, budget-normalised)
- Boss HP bar when fight is active
- Party invite code
- Crew roster with character names and stats

---

## 11. Dashboard — Voyage Header

The main visual centrepiece of the dashboard is the **VoyageHeader** component:

### Sailing Mode
- Background: sea texture image (`public/images/sea_texture.jpg`) using `auto 100%` sizing (full height, crop sides)
- Ship PNG (Going Merry arcs 1–10, Thousand Sunny arc 11+) bobbing and sailing left→right
- Ship position reflects arc progress % (0% = far left, 100% = near island)
- Island destination card on the right: a fixed-width rectangle showing the island image (tries `.jpg` → `.webp` → `.png`, falls back to colour placeholder)
- Arc name and location text overlaid top-left with strong drop shadow
- Animated wave lines in the background

### Boss Fight Mode
- Triggered when arc status = `boss_active`
- Island card hidden; full-width boss image displayed
- Boss name, HP counter, and HP bar overlaid at bottom
- Boss images located at `public/bosses/{slug}.png` or `.webp`

### Ship transition
- Going Merry: arcs 1–10
- Thousand Sunny: arc 11+
- Ships provided as PNG files in `public/ships/`

### Island images
Named by arc slug (arc name lowercased, spaces → underscores):
`romance_dawn`, `orange_town`, `syrup_village`, `baratie`, `arlong_park`, `loguetown`, `drum_island`, `alabasta`, `skypiea`, `enies_lobby`, `thriller_bark`, `sabaody_archipelago`, `marineford`, `fish_man_island`, `dressrosa`, `whole_cake_island`, `wano_country`

---

## 12. Push Notifications

### Architecture
- Browser subscribes via Web Push API (requires HTTPS + PWA install)
- Subscription saved to `push_subscriptions` table in Supabase
- Supabase Edge Function (`send-notifications`) runs on a pg_cron schedule
- Service worker (`public/sw-push.js`) receives push and shows notification

### Schedule
- `0 8 * * *` UTC — 10am CEST (summer, UTC+2)
- `0 9 * * *` UTC — 10am CET (winter, UTC+1)

### Notification logic
- **Daily tasks**: notified if not completed today
- **Weekly tasks**: notified on Saturday only, if not completed this week
- **Custom tasks**: notified on configured days if not completed this week
- **One-off tasks**: never notified
- No notification sent if all relevant tasks are already completed

### Platform support
- Android Chrome: full support when installed as PWA
- iOS Safari: supported on iOS 16.4+ when installed as PWA (Add to Home Screen)
- Desktop Chrome/Firefox: supported

---

## 13. Technical Architecture

### Frontend
- React 19 + Vite + TypeScript
- Tailwind CSS (parchment/nautical theme)
- Framer Motion (animations)
- Zustand (state management)
- vite-plugin-pwa + Workbox (PWA + service worker)

### Backend — Supabase
- PostgreSQL database
- Email/password authentication
- Realtime subscriptions (completions, arc_progress, profiles)
- Row Level Security on all tables
- Edge Functions (push notifications)

### Database tables
```
profiles         — user stats, character, party, streak
parties          — name, invite_code, current_arc_id
characters       — name, role, bonus_type, bonus_pct, unlock_arc
arcs             — arc_number, xp_required, power/bounty thresholds, boss, hidden
tasks            — user_id, type, difficulty, repeat_type, repeat_days
completions      — task_id, user_id, party_id, xp/power/bounty earned
arc_progress     — party_id, arc_id, status, progress_xp, boss_current_hp
weekly_xp        — user_id, party_id, week_start, xp_used, xp_personal
push_subscriptions — user_id, party_id, subscription (jsonb)
```

### Deployment
- Frontend: Vercel (free tier, auto-deploy from GitHub)
- Backend: Supabase (free tier, sufficient for ~20 users)

---

## 14. Year-Long Pacing Model

For a 2-player party at consistent effort:

```
Weekly budget per player:  300 XP
Total weekly party input:  600 XP
Journey length:            ~52 weeks
Total XP to Final Island:  ~28,000 XP
```

| Act | Arcs | Weeks |
|-----|------|-------|
| East Blue | 1–5 | ~10 |
| Grand Line Part 1 | 6–11 | ~20 |
| New World | 12–17 | ~19 |
| The Final Stretch | 18 | ~3 (hidden) |

Each arc lasts 2–5 weeks — players see the progress bar move every week. Boss fights create urgency at the end of each arc.

---

## 15. Undo Completion

### What it reverses (today only)
1. Deletes the completion record
2. Subtracts XP / Power / Bounty from profile
3. Restores weekly XP budget
4. Subtracts from arc progress bar
5. Reverts boss fight to `active` if XP drops below arc threshold
6. Restores boss HP if fight is active and damage is reversed
7. Decrements streak if no other completions remain today

### What it cannot reverse
- Arc advancement (status = `completed`) — arc has moved forward, cannot go back
- Second Wind party bonus — bonus XP stays in arc bar
- Yesterday or older completions — only today's completions can be undone

---

## 16. Build Status

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Auth, party system, task CRUD | ✅ Complete |
| 2 | XP system, arc progression, boss fights, realtime, character switching | ✅ Complete |
| 3 | Voyage header (ship + island visual) | ✅ Complete |
| 4 | Missed-day tracking, PWA manifest, arc header indicator, loading skeletons, XP pop animation, boss images | ✅ Complete |
| — | Push notifications (full system) | ✅ Complete |
| — | Undo completion | ✅ Complete |
| — | Weekly task reset on Monday | ✅ Complete |
| — | Leave crew | ✅ Complete |
| — | Test suite (129 tests) | ✅ Complete |
| Pending | Boss counterattack mechanic | ⬜ Planned |
| Pending | 14-day boss reset | ⬜ Planned |
| Pending | Victory bonus XP | ⬜ Planned |
| Pending | Arc history page | ⬜ Planned |
| Pending | Admin tools (manual arc advance) | ⬜ Planned |

---

## 17. Spoiler Policy

Arc 18 (the final arc) is stored in the database with `hidden: true`. It does not appear in any UI-facing text, map, or arc list until Wano (arc 17) is completed. The arc name, boss, and flavor text are masked as `???` and `The Final Island`.

To reveal arc 18 manually (admin only):
```sql
update public.arcs set hidden = false where arc_number = 18;
```

---

## 18. Sustainability

This is a private app for a small crew. No monetisation planned. All infrastructure runs on free tiers:
- Supabase free tier: sufficient for parties up to ~20 people
- Vercel free tier: sufficient for any party size
- Web Push: no third-party service, direct browser-to-device via VAPID

---

*"The will of D. shall be inherited."*