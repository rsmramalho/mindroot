# MindRoot

Emotional productivity system. Emotion precedes action, reflection closes the loop.

## Version

v1.0.0-alpha.25 — Landing page editorial redesign: hero full viewport, períodos Aurora/Zenite/Crepúsculo, orb animado.

## Stack

React 19 · TypeScript 5.8 · Vite 6 · Tailwind 3.4 · Supabase · TanStack Query 5 · Zustand 5 · Framer Motion · date-fns

## Commands

```bash
npm run dev      # Dev server (port 5173)
npm run build    # tsc -b && vite build
npm test         # vitest (467 tests, 24 suites, all passing)
npx tsc --noEmit # Type check only
npx playwright test # E2E tests (69 tests, 10 specs)
bash scripts/audit.sh  # Full system audit (20 checks)
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
- Style: dark/light theme (toggle in Settings), minimalist, no emoji

## Key Types (src/types/item.ts)

- `AtomItem` — core entity with `id`, `title`, `type`, `module`, `priority`, `tags`, `completed`, `archived`, `parent_id`, `due_date`, `emotion_before`, `emotion_after`
- `ItemType`: task | habit | ritual | chore | project | note | reflection | journal
- `ItemModule`: purpose | work | family | body | mind | soul
- `RitualPeriod`: aurora | zenite | crepusculo
- `Emotion`: calmo | focado | grato | animado | confiante | ansioso | cansado | frustrado | triste | perdido | neutro

## Pages (10)

| Page | File | Description |
|------|------|-------------|
| Landing | pages/Landing.tsx | Public landing page with hero, benefits, CTA (pre-auth) |
| Home | pages/Home.tsx | Dashboard with SoulPulse, AiSuggestions, FocusBlock, today/active sections |
| Inbox | pages/Inbox.tsx | Unclassified items with actions (complete, archive, delete) |
| Projects | pages/Projects.tsx | Project list + ProjectSheet (4 panes: Geral/Tarefas/Notas/Timeline) |
| Calendar | pages/Calendar.tsx | MonthGrid + DayDetail |
| Ritual | pages/Ritual.tsx | Aurora/Zenite/Crepusculo with habits + check-in |
| Journal | pages/Journal.tsx | Date-grouped entries + prompted writing + tag filter |
| Analytics | pages/Analytics.tsx | Heatmap, emotional pulse, module breakdown, streaks, insights, emotion correlation, period chart |
| SharedContent | pages/SharedContent.tsx | Public page for shared reflections & streaks (no auth required) |
| Auth | pages/Auth.tsx | Email/password + Google OAuth |

## Components (51)

- analytics/ (1): AnalyticsView
- calendar/ (3): CalendarView, MonthGrid, DayDetail
- dashboard/ (5): DashboardView, FocusBlock, OverdueAlert, AiSuggestions, ShareStreakCard
- inbox/ (1): InboxActions
- input/ (3): AtomInput, TokenPreview, AiPreview
- journal/ (4): JournalView, JournalEntry, JournalPrompt, ShareReflectionSheet
- onboarding/ (3): OnboardingWizard, WelcomeFlow (legacy), WelcomeStep (legacy)
- projects/ (3): ProjectList, ProjectCard, ProjectSheet
- ritual/ (3): RitualView, RitualHabit, RitualCheckIn
- settings/ (1): SettingsDrawer
- shared/ (17): CommandPalette, ConfirmDialog, EditSheet, EmptyState, EnergyPicker, ErrorBoundary, ItemRow, Logo, ModuleBadge, ModulePicker, NotificationPrompt, PriorityDot, PriorityPicker, RecurrencePicker, Skeleton, TagChip, Toast
- shell/ (3): AppShell, BottomNav, TopBar
- soul/ (4): EmotionPicker, CheckInPrompt, PostCheckIn, SoulPulse

## Hooks (11)

useAnalytics, useAuth, useItemMutations, useItems, useJournal, useNotifications, useOfflineSync, usePWA, useProject, useRitual, useSoul

## Services (7)

supabase, item-service (offline-aware), auth-service, ai-service, notification-service, push-service, share-service

## Engine (10)

parsing (natural input → structured data), soul (check-in triggers, emotion shift), dashboard-filters, recurrence (virtual reset, period detection, streak), offline-queue (IndexedDB queue, compaction, conflict resolution), insights (emotion-productivity correlation, period/weekday patterns, natural language suggestions), search (query parsing with filter prefixes, relevance scoring, full-text search), ai-suggestions (7 pattern detectors: procrastination, emotion timing, overdue cluster, energy overload, positive streak, period emotion risk, module imbalance), export (journal→Markdown, all data→JSON backup, weekly auto-backup scheduling), theme (dark/light colors, CSS variable generation, module color customization, dashboard section ordering)

## Stores (7)

app-store (navigation, filters, soul state, user), ritual-store (period, check-in, reflection), onboarding-store (welcome flow, tooltip flags), toast-store (notification queue, auto-dismiss, undo), notification-store (push prefs, permission state, overdue tracking), offline-store (connectivity, pending count, sync state), theme-store (dark/light mode, custom module colors, dashboard section order, localStorage persistence)

## Edge Function — parse-input

- Deployed: https://avvwjkzkzklloyfugzer.supabase.co/functions/v1/parse-input
- Model: claude-3-haiku-20240307
- Input: natural Portuguese text → JSON (title, type, module, priority, emotion, due_date, etc)
- Integration: ai-service.ts → AiPreview.tsx (debounce 800ms, shows before submit)

## Edge Function — send-push

- Path: supabase/functions/send-push/index.ts
- Sends Web Push notifications to subscribed users
- Types: period-transition, overdue-reminder
- Requires VAPID keys (generate via scripts/generate-vapid-keys.js)
- Can be triggered by pg_cron, external cron, or manual invocation

## Database

- supabase/migrations/001_core_schema.sql — items table + RLS
- supabase/migrations/002_fix_type_constraint.sql — expanded type enum
- supabase/migrations/003_auto_seed_rituals.sql — auto-seed rituals on first login
- supabase/migrations/004_backfill_ritual_recurrence.sql — set recurrence='daily' on existing rituals
- supabase/migrations/005_push_subscriptions.sql — push notification subscription storage
- supabase/migrations/006_public_shares.sql — public sharing (reflections & streaks)

## Tests

- Unit: 467 tests, 24 suites (vitest)
- E2E: 69 tests, 10 specs (playwright)
- Pattern: pure logic extraction, no React providers or Supabase mocks needed
- Src LOC: ~20,902

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
| alpha.8 | 05/03/2026 | Item editing — EditSheet, ModulePicker, PriorityPicker, ConfirmDialog, inline edit, audit script |
| alpha.9 | 05/03/2026 | Recurrence engine, virtual reset, RecurrencePicker, recurrence badges (270 tests) |
| alpha.10 | 05/03/2026 | Feedback visual: toast notifications, error boundaries, loading skeletons (286 tests) |
| alpha.11 | 05/03/2026 | Push notifications: SW push handler, notification-store, push-service, period scheduling, overdue reminders, NotificationPrompt, granular settings (309 tests) |
| alpha.12 | 09/03/2026 | M1 stabilization: AtomInput error recovery, toast parity (uncomplete/update), JournalPrompt stable prompt, BottomNav project-detail highlight, Google OAuth error handling, UI spelling fixes (309 tests) |
| alpha.13 | 09/03/2026 | Offline queue: IndexedDB mutation queue, auto-sync on reconnect, queue compaction, last-write-wins conflict resolution, TopBar offline/pending indicator (324 tests) |
| alpha.14 | 09/03/2026 | Energy cost UI: EnergyPicker (1-5 bar scale), EditSheet integration, ItemRow display, Analytics avgEnergy per module, #energy_N parsing token (329 tests) |
| alpha.15 | 09/03/2026 | Analytics v2: insights engine (emotion-productivity correlation, period productivity, weekday patterns), InsightsPanel, EmotionCorrelation chart, PeriodChart, natural language suggestions in pt-BR (348 tests) |
| alpha.16 | 09/03/2026 | Search + advanced filters: search engine with filter prefixes (mod: emo: per: prio: tipo: tag: data:), full-text search (title+description+tags), relevance scoring, CommandPalette with filter chips, JournalView tag filter bar (392 tests) |
| alpha.17 | 09/03/2026 | M2 QA: accessibility (ARIA roles/labels on all dialogs, nav, buttons, live regions, focus traps), performance (React.memo ItemRow, deterministic skeletons, tooltip cleanup), bug fixes (version display, CheckInPrompt Escape, mobile "..." button), M2 milestone complete (392 tests) |
| alpha.18 | 09/03/2026 | AI contextual suggestions: pure engine with 7 pattern detectors (procrastination, emotion timing, overdue cluster, energy overload, positive streak, period emotion risk, module imbalance), AiSuggestions dashboard panel with dismissable cards, max 3 suggestions sorted by priority (411 tests) |
| alpha.19 | 09/03/2026 | Export & backup: journal→Markdown export, full JSON backup (with meta), weekly auto-backup scheduling (localStorage), export buttons in SettingsDrawer (433 tests) |
| alpha.20 | 09/03/2026 | Themes & personalization: dark/light toggle with CSS variables, custom module colors (12 presets), configurable dashboard section order (move up/down), theme-store with localStorage persistence, Settings UI controls with reset (455 tests) |
| alpha.21 | 10/03/2026 | Sharing: public share links for reflections & streaks, share-service, ShareReflectionSheet, ShareStreakCard, SharedContentPage (/share/:token), 006_public_shares migration (467 tests) |
| v1.0.0 | 10/03/2026 | Release: WCAG AA accessibility (aria-labels on pickers), lazy-loaded pages (code splitting), Landing page, console cleanup, USAGE.md docs, performance optimization (270KB main bundle) |
| alpha.23 | 10/03/2026 | Landing melhorada (subtitulo, app mockup, exemplos concretos nos cards), OnboardingWizard 3 passos (nome + area foco, periodos rituais, primeira entrada) (467 tests) |
| alpha.24 | 11/03/2026 | Bug fixes: Google OAuth PKCE race condition (removed synchronous replaceState, Supabase reads ?code before cleanup), logout→landing via useLayoutEffect, per-user onboarding store (new users on shared devices get wizard) (467 tests) |
| alpha.25 | 11/03/2026 | Landing page editorial redesign — hero full viewport, períodos Aurora/Zenite/Crepúsculo, orb animado (467 tests) |

## Google OAuth Setup (manual)

1. **Google Console**: add `https://mindroot-gilt.vercel.app` to "Authorized JavaScript origins"
2. **Google Console**: add `https://avvwjkzkzklloyfugzer.supabase.co/auth/v1/callback` to "Authorized redirect URIs"
3. **Supabase Dashboard** → Authentication → URL Configuration:
   - Site URL: `https://mindroot-gilt.vercel.app`
   - Redirect URLs: `https://mindroot-gilt.vercel.app/auth/callback`

## Architecture Decisions

- **Hardcoded hex colors**: 37 components use hardcoded hex instead of CSS variables. Documented as tech debt — full migration to CSS vars planned for v1.1.
- **Lazy loading**: 7 authenticated pages are lazy-loaded via React.lazy(). Pre-auth pages (Landing, Auth, SharedContent) remain static for instant load.
- **Named exports + lazy**: Pages use named exports per convention. Lazy imports use `.then(m => ({ default: m.NamedExport }))` pattern.

## Para contribuidores

```bash
git clone <repo-url>
cd mindroot
npm install
# Create .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev       # Dev server on :5173
npm test          # Unit tests
npm run build     # Production build
bash scripts/audit.sh  # Full audit
```
