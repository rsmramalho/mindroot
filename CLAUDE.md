# MindRoot

Emotional productivity system. Emotion precedes action, reflection closes the loop.

## Version

v1.0.0-alpha.7 — All 5 phases complete + onboarding + production config + E2E tests.

## Stack

React 19 · TypeScript 5.8 · Vite 6 · Tailwind 3.4 · Supabase · TanStack Query 5 · Zustand 5 · Framer Motion · date-fns

## Commands

```bash
npm run dev      # Dev server (port 5173)
npm run build    # tsc -b && vite build
npm test         # vitest (222 tests, 13 suites)
npx tsc --noEmit # Type check only
npx playwright test # E2E tests (69 tests, 10 specs)
```

## Architecture

```
src/
  pages/         # Route pages (named exports: export function HomePage)
  components/    # UI components (default exports OK)
  hooks/         # React hooks — never call Supabase directly
  service/       # Data layer — all Supabase access goes here
  engine/        # Pure logic (parsing, soul engine, dashboard filters)
  store/         # Zustand stores (app-store, ritual-store, onboarding-store)
  types/         # Pure types, zero imports (item.ts, ui.ts, engine.ts)
e2e/             # Playwright E2E tests
supabase/        # Migrations, edge functions, seeds
```

## Critical Rules

1. **Named exports on pages**: `export function HomePage()` — App.tsx imports `{ HomePage }` etc.
2. **Path alias**: `@/` = `src/`. Always use `@/` imports.
3. **AtomItem booleans**: `item.completed` (boolean), `item.archived` (boolean). NEVER use `item.completed_at` as boolean check. NEVER use `item.status`.
4. **Service layer**: hooks → service → Supabase. Hooks never import from `service/supabase.ts` directly.
5. **No emoji in UI**: use word-based labels, font-mono icons.
6. **Language**: code/comments in English, UI strings in Brazilian Portuguese.
7. **Before delivering**: always run `npx tsc --noEmit && npm run build`. Zero errors.

## Design System

- Fonts: Cormorant Garamond (serif), Inter (sans), JetBrains Mono (mono)
- Background: `bg` #111318, `surface` #1a1d24, `border` #2a2d34
- Text: `light` #e8e0d4, `mind` #c4a882, `muted` #a89478
- Accent colors: `heart` #d4856a, `soul` #8a9e7a
- Ritual periods: `aurora` #f0c674, `zenite` #e8e0d4, `crepusculo` #8a6e5a
- Module colors: purpose, work, family, body, mind, soul (see tailwind.config.ts)
- Style: dark theme, minimalist, no emoji

## Key Types (src/types/item.ts)

- `AtomItem` — core entity with `id`, `title`, `type`, `module`, `priority`, `tags`, `completed`, `archived`, `parent_id`, `due_date`, `emotion_before`, `emotion_after`
- `ItemType`: task | habit | ritual | chore | project | note | reflection | journal
- `ItemModule`: purpose | work | family | body | mind | soul
- `RitualPeriod`: aurora | zenite | crepusculo
- `Emotion`: calmo | focado | grato | animado | confiante | ansioso | cansado | frustrado | triste | perdido | neutro

## Pages (8)

| Page | File | Description |
|------|------|-------------|
| Home | pages/Home.tsx | Dashboard with SoulPulse, FocusBlock, today/active sections |
| Inbox | pages/Inbox.tsx | Unclassified items with actions (complete, archive, delete) |
| Projects | pages/Projects.tsx | Project list + ProjectSheet (4 panes: Geral/Tarefas/Notas/Timeline) |
| Calendar | pages/Calendar.tsx | MonthGrid + DayDetail |
| Ritual | pages/Ritual.tsx | Aurora/Zenite/Crepusculo with habits + check-in |
| Journal | pages/Journal.tsx | Date-grouped entries + prompted writing |
| Analytics | pages/Analytics.tsx | Heatmap, emotional pulse, module breakdown, streaks |
| Auth | pages/Auth.tsx | Email/password + Google OAuth |

## Components (39)

- analytics/ (1): AnalyticsView
- calendar/ (3): CalendarView, MonthGrid, DayDetail
- dashboard/ (3): DashboardView, FocusBlock, OverdueAlert
- inbox/ (1): InboxActions
- input/ (3): AtomInput, TokenPreview, AiPreview
- journal/ (3): JournalView, JournalEntry, JournalPrompt
- onboarding/ (2): WelcomeFlow, WelcomeStep
- projects/ (3): ProjectList, ProjectCard, ProjectSheet
- ritual/ (3): RitualView, RitualHabit, RitualCheckIn
- settings/ (1): SettingsDrawer
- shared/ (7): CommandPalette, EmptyState, ItemRow, Logo, ModuleBadge, PriorityDot, TagChip
- shell/ (3): AppShell, BottomNav, TopBar
- soul/ (4): EmotionPicker, CheckInPrompt, PostCheckIn, SoulPulse

## Hooks (10)

useAnalytics, useAuth, useItemMutations, useItems, useJournal, useNotifications, usePWA, useProject, useRitual, useSoul

## Services (5)

supabase, item-service, auth-service, ai-service, notification-service

## Engine (3)

parsing (natural input → structured data), soul (check-in triggers, emotion shift), dashboard-filters

## Stores (3)

app-store (navigation, filters, soul state, user), ritual-store (period, check-in, reflection), onboarding-store (welcome flow, tooltip flags)

## Edge Function — parse-input

- Deployed: https://avvwjkzkzklloyfugzer.supabase.co/functions/v1/parse-input
- Model: claude-3-haiku-20240307
- Input: natural Portuguese text → JSON (title, type, module, priority, emotion, due_date, etc)
- Integration: ai-service.ts → AiPreview.tsx (debounce 800ms, shows before submit)

## Database

- supabase/migrations/001_core_schema.sql — items table + RLS
- supabase/migrations/002_fix_type_constraint.sql — expanded type enum
- supabase/migrations/003_auto_seed_rituals.sql — auto-seed rituals on first login

## Tests

- Unit: 222 tests, 13 suites (vitest)
- E2E: 69 tests, 10 specs (playwright)
- Pattern: pure logic extraction, no React providers or Supabase mocks needed

## Production

- Hosting: Vercel (vercel.json configured)
- PWA: manifest.json + sw.js (cache-first shell, stale-while-revalidate)
- Brand: Logo tree mark + wordmark, favicon.svg, og-image.png

## Environment Variables

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Version History

| Version | Date | What changed |
|---------|------|-------------|
| alpha.1 | 02/03/2026 | Fase 0 — Scaffold (types, engine, service, store, hooks) |
| alpha.2 | 02/03/2026 | Fase 1+2 — Core Loop + Soul Layer (dashboard, inbox, emotions, check-in) |
| alpha.3 | 02/03/2026 | Fase 3 — Ritual + Journal + 104 tests |
| alpha.4 | 03/03/2026 | Fase 4 — Projects, Calendar, CommandPalette + QA fixes |
| alpha.5 | 03/03/2026 | Fase 5 — PWA, Google Auth, Analytics, Notifications, AI parsing, brand, animations, audit (222 tests) |
| alpha.6 | 03/03/2026 | Production config (vercel.json, auto-seed trigger, setup guide) + Playwright E2E (69 tests) |
| alpha.7 | 04/03/2026 | Onboarding welcome flow + actionable empty states + input tooltip |
