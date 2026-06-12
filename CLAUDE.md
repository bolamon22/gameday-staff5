# GameDay Staff — project guide & working philosophy

This file is read automatically at the start of any Claude / Cowork session that has
this repo connected. It is the project's memory: what the app is, how we work, and the
standards to follow. Keep it updated as things evolve — editing this file is how you
"teach" future sessions, on any computer.

## The app
GameDay Staff — tournament management for Sunshine Events Group (lacrosse and other
sports): tournaments, divisions, pools, brackets, team & player registration, staff
assignment, payroll, and financials.

- Stack: Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS ·
  Prisma + Turso (libSQL) · NextAuth · Stripe · hosted on Vercel.
- Repo: github.com/bolamon22/gameday-staff5 (public). Live: gameday-staff5.vercel.app.

## How we ship (workflow)
- Local working copy lives at `C:\Users\lacro\Downloads\gameday-staff5` — connect this
  folder in Cowork to work on it.
- Verify before shipping: type-check (`tsc --noEmit`) and/or an esbuild parse; preview
  UI changes before deploying.
- Deploy: commit -> push to `master` in GitHub Desktop -> Vercel auto-builds and redeploys.
- Make small, reviewable changes. Fix root causes, not symptoms.
- Secrets live in `.env` (gitignored) and Vercel env vars — never in the repo or in chat.

## Design standard (UI consistency)
- Icons: lucide-react only — never emoji.
- Palette: neutral slate base + teal as the single accent; semantic green / red / amber
  only for meaning (money, status).
- Cards: one style — `bg-white border border-slate-200 rounded-xl`.
- Use the shared primitives in `src/components/ui` (Card, SectionHeader, StatCard,
  ActionButton) instead of ad-hoc markup. See `src/components/ui/README.md`.
- Sentence case; avoid heavy bold.

## Consistency pass — progress
Rolling the design standard across every page (replace emoji with lucide icons, unify
palette and cards), in this order:
1. Core workspace — Assigner, Scheduler, Divisions, Registrations, Financials, Settings,
   Scores, Roster, Assignments, Results, Pay summary, Staff view, Availability,
   Returning teams, Time entries.
2. Public / registration — Public, Register, Individual register, Join, Invite.
3. Role dashboards — club-director, parent, coach, ref, scorekeeper, director, viewer.
4. Admin / system pages.

Done: shared UI components, Dashboard redesign, TournamentNav header, UTF-8 encoding
fixes, builder year-regex fix, the full Staff hub — Financials, Roster, Availability,
Time Entries, Pay Summary — Registrations (lucide icons, slate/teal palette,
sentence case; team + individual tabs, import panel, pricing/payment modals), and
Settings (lucide SectionCard icons, slate/teal palette, sentence case; venues/fields,
fees, divisions, pay rates, ref rules, registration types, copy-tournament modal), and
Scheduler (lucide icons for toolbar + status badges, blue→teal accent, sentence case;
drag-drop grid, parking lot, swap mode, publish/diff, conflict/back-to-back/bracket badges),
and Assigner (drag staff onto game role-slots via shared GameGrid mirroring the Scheduler;
staff tray sorted + color-coded by type with key; per-game ref-count -/+ and tournament
default; lock-editing toggle persisted per-tournament; staffing-requirements panel —
min officials vs current roster, scorekeepers = one per field). Shared component:
src/components/GameGrid.tsx — and Divisions (sky→teal accent, lucide icons, sentence case;
divisions list, teams/pools/pool-games/bracket tabs, swap mode, generate flows; editable
Smart Defaults plan per team count — games/team, pools, bracket format, saved per tournament,
applied on generate). Also
flipped the GLOBAL accent in globals.css from sky to teal (btn-primary, .input/.select
focus, .card-hover) so primary buttons + inputs are teal app-wide.
Next up: Scores, Assignments, Results, Staff view, Returning teams.
Tracking: Roadmap #57 (consistency pass) and #58 (page consolidation review).

## Session handoff (Jun 11, 2026)
What shipped to live this session (all deployed):
- Restyled to the design standard: Registrations, Settings, Scheduler, Divisions. Flipped the
  GLOBAL accent in globals.css from sky to teal (btn-primary, .input/.select focus, .card-hover)
  so primary buttons + inputs are teal app-wide.
- Assigner: full redesign — drag staff onto game role-slots, staff tray sorted/color-coded by
  type with a key, per-game ref-count -/+ and a tournament "Refs per game" default, a
  Lock-editing toggle (persists per tournament, disables drag/assign/ref/score edits), and a
  staffing-requirements panel (min officials vs roster; scorekeepers = one per field).
- Retired the old ref machinery: removed Settings "Ref Count Rules" and the Staff Roster
  "Game Target" column. Ref counts now live per-game on the Assigner; pool-game generation
  defaults to 2 refs; Assigner grid + List/Division read each game's own refCount.
- Divisions Smart Defaults: editable per-tournament plan (team count -> games/team, pools,
  bracket format), saved in the browser. Generate-all creates the planned # of pools and splits
  teams; the chosen bracket format pre-selects on each division's Bracket tab.

Open / next:
- Consistency pass remaining: Scores, Assignments, Results, Staff view, Returning teams.
- BRACKETS (next project, not built): templates in src/lib/bracketTemplates.ts only cover 4/8/16
  for single / single+3rd / double / 2-game-guarantee. Odd/in-between counts (5,6,7,9...) fall
  back to single-elim and do NOT honor the labeled guarantee (a 7-team "2GG" gives first-round
  losers only one game). In lacrosse the guarantee normally comes from POOL PLAY (2-3 pool games)
  with single-elim on top. Need: proper byes for odd counts + real consolation/playback
  structures. Bo is filling in a per-division planning sheet (team count -> pool play?/#pools,
  advance count, bracket format, placement/guarantee); build templates from that. A one-page
  "Tournament Bracket Formats - Reference & Planning" .docx was generated to capture this.

Working notes: writes to this folder via the editor tool can truncate (write via shell instead);
the sandbox can't push to GitHub (push via GitHub Desktop on master). Some per-user settings
(Assigner lock, games-per-ref, Divisions smart-defaults plan) persist in localStorage per
tournament, not the DB.

## Session handoff (Jun 11, 2026 - afternoon)
Shipped (deployed to master):
- BRACKETS Stage 1 complete: generator handles odd/in-between team counts with byes + real
  consolation/playback; owes rule (guarantee - pool games): owes<=1 -> top-N advance + seed-paired
  consolation (7v8, 9v10); owes>=2 -> everyone in bracket + loser-fed consolation + "if needed"
  games. Smart Defaults recommends advance/consolation per team count. One-click "generate all
  divisions" (pools + pool games + brackets) with an "Include brackets" toggle. Bracket Preview
  supports inline rename/add/remove and a pool-standings table on the Seeds tab.
- Consolidations: (1) Bracket builder slimmed to TWO tabs - Seeds + Preview; the old Games tab is
  gone, its add/remove panel now toggles from the Preview's "+ Add game". (2) Divisions page merged
  Pools INTO the Teams tab - now "Teams & Pools": an inline pools bar (chips w/ live counts, add,
  delete x, unassigned badge, Auto-assign) + a "Group by pool" toggle on the table. Tabs are now
  Teams & Pools / Pool Games / Bracket.

Open / next:
- Stage 2 flighting (2 champions in one division): needs a data-model change - currently ONE bracket
  per tournamentId+division (bracket route + DB assume this). To support Flight B/B2: store multiple
  brackets per division + UI to define flights + run the generator per seed-slice.
- Bracket games schedule on the Preview: bracket games ARE already created as schedulable Game rows
  (gameNumber B1, B2...) and the Scheduler surfaces them (type 'bracket', parking lot, drag to
  field/time, out-of-order check). But the Bracket Preview only reads the bracket STRUCTURE
  (BracketGame), so it shows no times/fields. Plan: fetch the division's B-games and show each game's
  date/time/field on its preview card (read-only; "Not scheduled" when blank). May need a tiny
  endpoint to expose B-game times to the builder.
- Consistency pass remaining pages: Scores, Assignments, Results, Staff view, Returning teams.

## Build philosophy
- Diagnose before changing; verify after.
- Preview visual changes before deploying — keep Bo in the loop with a preview.
- Prefer shared components and conventions so the codebase stays consistent over time.
- Be careful with secrets and with irreversible actions (deletes, pushes, payments).

<!-- redeploy nudge: 2026-06-11T21:51Z -->

## Session handoff (Jun 11, 2026 - evening)
Shipped to live (master):
- STAGE 2 FLIGHTING: a division can split into Flight A/B brackets, each with its own champion.
  Bracket gains flight + numberOffset columns (every existing bracket = Flight A, offset 0; fully
  backward compatible). Idempotent admin migration ("Migrate: Flights" button on /admin) - already
  run on the shared Turso DB. Bracket API GET now returns ALL flights (array); POST supports a
  split action (cutoff on the seed list -> Flight A seeds 1..N + Flight B rest, continuous B-game
  numbering via numberOffset); PATCH/DELETE scoped per flight (?flight=A|B). BracketBuilder gained
  a "Split into flights" panel (cutoff + per-flight format) + a Flight A/B switcher; the scoring
  page (/bracket) and the Divisions generate-check were updated for the array response.
- BRACKET REDESIGN (College Football Playoff "rail" style) on BOTH the builder preview and the
  scoring page: each team on its own bar with a teal seed chip, the team logo (RegisteredTeam.logoUrl,
  matched by team name; /teams now returns logoUrl), and the name; amber for byes/champion; straight
  right-angle connectors driven by a feeder-graph layout (games are positioned from what feeds them,
  so the round-1 winner lines up with the game it advances to). BYE games are offset so the
  winner-feeder bar pairs with the bye team (mirrored across the bracket centerline) instead of
  straddling the feeder line; row spacing widened (BracketPreview ROW=120, BracketSection UNIT=140)
  to prevent column collisions.

Notes: bracket GET is now an array of flights - the only consumers are BracketBuilder + the scoring
page, both updated. The old gameTop() in BracketBuilder is now dead code (feeder-graph replaced it).
seed-flag-football.js got committed during the branch work (harmless local seed script).
Open/next: consistency-pass remaining pages (Scores, Assignments, Results, Staff view, Returning
teams); double-elim / 3rd-flight (B2) flighting (data model already supports >2 via the flight column);
show bracket game times/fields on the preview cards.


## Session handoff (Jun 12, 2026)

### Shipped to live (all deployed to master):

**Post Scores page** (`/tournaments/[id]/scores`): added page header with "Tournament Director & Schedule Manager" role badge and live scored/total count. Fixed sort-by-date tiebreaker (was returning 1 for equal values, causing unstable sort; now returns 0).

**TournamentNav**: added Scores tab pointing to `/scores`.

**Role permissions** (`src/lib/role-permissions.json`): wired two new features — `tournament_scores` (routes `/tournaments/*/scores`; enabled for director + assigner) and `game_scorekeeper` (routes `/tournaments/*/games/*/scorekeeper`; enabled for scorekeeper + director + assigner). Fixed critical bug: the `scorekeeper` role had ALL permissions set to false — now has `game_scorekeeper: true`.

**Scorekeeper page** (`/tournaments/[id]/games/[gameId]/scorekeeper`): added "Scorekeeper View" green badge to the top bar; reorganized header to show division, game #, and location more clearly.

**Public tournament page — visual bracket tab** (`/tournaments/[id]/public`): replaced the old flat championship list with a full SVG bracket tree. Light/clean style: white game cards, blue winner highlight (bg-blue-50), gray loser (bg-gray-50), amber border for championship games, light gray connector lines. Layout math matches BracketBuilder (bkTop/bkLeft). Resolves team names from seeds and team1Source/team2Source (handles seed:N, winner:N, loser:N). Shows a progress bar (rounds complete), collapsible consolation section, and supports multi-flight brackets via numberOffset.

### Open / next:

- Consistency pass remaining pages: Assignments, Results, Staff view, Returning teams.
- Bracket game times/fields on the public bracket cards (fetch B-game schedule; show date/time/field on each card).
- Double-elim / 3rd-flight (B2) support (data model already supports it via the flight column).

### Working notes (this session):

- Sandbox cannot push to GitHub (proxy blocks it). Deployed via push_bracket.bat in the Github Build workspace folder (clones to temp, copies file, commits, pushes via Git Credential Manager browser auth). Token in that bat file may expire — if 401, generate a new Classic PAT with repo scope at github.com/settings/tokens.
- Office computer working copy path unknown — update "How we ship" when confirmed.
