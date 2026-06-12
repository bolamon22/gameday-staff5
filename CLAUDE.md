# GameDay Staff — project guide & working philosophy

This file is read automatically at the start of any Claude / Cowork session that has
this repo connected. It is the project's memory: what the app is, how we work, and the
standards to follow. Keep it updated as things evolve — editing this file is how you
"teach" future sessions, on any computer. Keep it lean: fold old session notes into
"Current state" rather than stacking dated handoffs forever.

## The app
GameDay Staff — tournament management for Sunshine Events Group (lacrosse and other
sports): tournaments, divisions, pools, brackets, team & player registration, staff
assignment, payroll, financials, public schedule/standings, and live scorekeeping.

- Stack: Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS ·
  Prisma + Turso (libSQL) · NextAuth · Stripe · hosted on Vercel.
- Repo: github.com/bolamon22/gameday-staff5 (public). Live: gameday-staff5.vercel.app.

## How we ship (workflow)
- Local working copy: `C:\Users\lacro\Downloads\gameday-staff5` — connect this folder in Cowork.
- Edit/verify in a sandbox copy, then copy changed files into the Downloads working copy.
- Verify before shipping: `npx tsc --noEmit` (grep the files you touched) and/or an
  esbuild parse; preview UI changes before deploying.
- Deploy: commit → **push to `master` via GitHub Desktop** → Vercel auto-builds and redeploys.
  After pushing, confirm with `git fetch origin` + `git rev-list --left-right --count master...origin/master`.
- Make small, single-file commits where possible. Fix root causes, not symptoms.
- Secrets live in `.env` (gitignored) and Vercel env vars — never in the repo or in chat.
- **DB migrations run in-app**, not via prisma migrate: hit an admin migrate route (e.g. the
  `/admin` page "Migrate: Flights" button → `api/admin/migrate-flights`; the main
  `api/admin/migrate` route creates core tables). Some API routes also self-heal with a
  guarded `ALTER TABLE ... ADD COLUMN` in a try/catch. Migrations use the app's own Turso
  connection — no secrets needed by the agent.

### Tooling gotcha — git index corruption
The Windows-mounted `Downloads/.git` index can corrupt when CLI git and GitHub Desktop write
`.git/index` at the same time (symptom: "bad signature"/"index file corrupt", or a commit that
phantom-deletes hundreds of files). Mitigations: prefer single-file commits; if it corrupts,
`rm .git/index` then `git reset --mixed origin/master` (or `--hard` if the tree is clean) to
rebuild, and commit through GitHub Desktop itself for multi-file/dir changes. A broken
`ORIG_HEAD` ref blocks `merge --ff-only`; `rm .git/ORIG_HEAD` then `git reset --hard origin/master`.

## Design standard (UI consistency)
- Icons: lucide-react only — never emoji.
- Palette: neutral slate base + teal as the single accent; semantic green / red / amber
  only for meaning (money, status). (globals.css global accent is teal app-wide.)
- Cards: one style — `bg-white border border-slate-200 rounded-xl`.
- Use the shared primitives in `src/components/ui` (Card, SectionHeader, StatCard,
  ActionButton); see `src/components/ui/README.md`. Shared game grid: `src/components/GameGrid.tsx`.
- Sentence case; avoid heavy bold.
- Note: the BracketBuilder/scoring bracket views are intentionally their own visual style
  (CFP "rail" layout); the rest of the app follows the light slate/teal standard.

## Current state (as of Jun 12, 2026)
Core flow: tournaments → divisions → pools → pool games → brackets → scheduler → assigner →
scores → public. Highlights shipped to live:

- **Divisions page** — tabs are **Teams & Pools / Games / Bracket**. Pools are merged into the
  Teams tab (inline pools bar: chips w/ live counts, add, delete, unassigned badge). A **List
  view / Assign Pools** toggle: "Assign Pools" opens a clean side-by-side **pool-column** view
  with drag-to-reassign + an **Auto-assign teams** button (the standalone assign-pools page was
  retired). The **Games** tab lists pool games (P#) AND bracket games (B#) with date/time/field
  (`pool-games?scope=bracket`). Team rows show team logo/initial badge.
- **Smart Defaults** (per tournament, localStorage): per team-count plan — games/team, pools,
  bracket format, advance, consolation. One-click **generate-all** (pools + pool games + brackets,
  with an "Include brackets" toggle).
- **Brackets — Stage 1 generator**: handles odd/in-between counts with byes + real consolation.
  Owes rule (guarantee − pool games): owes≤1 → top-N advance + seed-paired consolation (7v8, 9v10);
  owes≥2 → everyone-in + loser-fed consolation + "if needed". Full spec in `BRACKETS.md`.
- **Brackets — Stage 2 flighting**: a division can split into **Flight A / B** brackets, each with
  its own champion. `Bracket` has `flight` (default "A") + `numberOffset` (default 0) — every
  existing bracket = Flight A / offset 0, fully backward compatible. Bracket API **GET returns an
  array of flights**; POST has a **split** action (cutoff on the seed list → Flight A seeds 1..N +
  Flight B rest, continuous B# numbering via numberOffset); PATCH/DELETE scoped per flight
  (`?flight=A|B`). BracketBuilder has a "Split into flights" panel + a Flight A/B switcher. Migration
  = `/admin` "Migrate: Flights" (already run on Turso). Data model supports >2 flights (B2) already.
- **Bracket redesign (CFP "rail" style)** on the builder preview and the scoring `/bracket` page:
  each team on its own bar with a teal seed chip, team logo, and name; amber for byes/champion;
  feeder-graph layout drives straight right-angle connectors (byes offset to pair with their feeder).
- **Logos/crests**: `RegisteredTeam.logoUrl` (uploaded + client-compressed ≤512px on the Divisions
  Edit-Team and Registrations forms); `/teams` returns logoUrl; `team-logos` endpoint feeds crests
  on brackets and public pages.
- **Public page** (`/public`): division tiles, **standings** (W/L/GA/GF/GD/Last-3, division dropdown,
  advances-to-bracket cutoff, tiebreaker-aware sort), redesigned **schedule** (grouped-by-date cards,
  filters, by-time/by-field, up-next + .ics), and a full **SVG bracket tree** (multi-flight aware via
  numberOffset). The old `/results` page was deleted and consolidated into `/public`.
- **Configurable tiebreakers**: schema + `tiebreaker-default` endpoint (AppSetting `defaultTiebreakers`)
  + two-section Settings editor with save-as-default; `/public` standings read tournament tiebreakers.
  Spec in `TIEBREAKERS.md`.
- **Scores / scorekeeping**: `/scores` page (director/assigner) with role badge + scored/total;
  `/games/[gameId]/scorekeeper` view; `role-permissions.json` wired `tournament_scores` +
  `game_scorekeeper` (fixed scorekeeper role that had all perms false).
- **Staff hub + core workspace** already on the design standard: Financials, Roster, Availability,
  Time Entries, Pay Summary, Registrations, Settings, Scheduler, Assigner (drag staff to role-slots,
  per-game ref counts, lock-editing toggle, staffing-requirements panel), Scores, Assignments, Results.

## Open / next
- **Consistency pass — remaining pages**: Staff view, Returning teams. (Done: the full Staff hub,
  Registrations, Settings, Scheduler, Assigner, Divisions, Scores, Assignments, Results, Public.)
- **Bracket game times/fields on the cards**: B-games already carry schedule once placed on the
  Scheduler; show date/time/field on each bracket-preview and public-bracket card (read-only).
- **Double-elim / 3rd flight (B2)**: data model already supports >2 flights via the `flight` column.

## Known cruft / cleanup
- Dead `gameTop()` in BracketBuilder (feeder-graph layout replaced it).
- Stray `seed-flag-football.js` at repo root (harmless local seed script) — can be removed.
- `next.config.js` sets `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds`; ~40 pre-existing
  TS errors exist (e.g. Prisma model types not in schema) and are non-blocking.
- Some per-user settings (Assigner lock, games-per-ref, Divisions Smart-Defaults plan) persist in
  localStorage per tournament, not the DB.

## Build philosophy
- Diagnose before changing; verify after.
- Preview visual changes before deploying — keep Bo in the loop with a preview.
- Prefer shared components and conventions so the codebase stays consistent over time.
- Be careful with secrets and with irreversible actions (deletes, pushes, payments).
