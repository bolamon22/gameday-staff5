# Scheduling patterns — learned from real tournaments

This file is the durable memory for the auto-scheduler. As Bo provides real,
manually-scheduled tournaments (CSV exports preferred), record the observed
patterns here AND fold the rules into `src/lib/autoSchedule.ts`. Both live in git,
so they're remembered across sessions and computers.

## How to feed examples
- Best format: a game-by-game CSV with columns like:
  `Game Number, Game Date, Start Time, Division, Pool, Location, Team 1, Team 2, [scores]`.
- Plus, per division: team count, # pools, whether it has a bracket and which format.
- Screenshots are a useful supplement for the visual "feel" but the CSV is what
  lets us measure patterns precisely.

## Analysis method
`Game Date`+`Start Time` → minutes; group by team (per day) for rest gaps; group by
(day,time) for parallelism; per division track fields-per-day for spread; detect bracket
games by placeholder team names (W-/L-/Seed/#). NOTE: club names repeat across divisions,
so identify a team by (division + name), not name alone.

## Findings

### Sunshine State Summer Kick-Off '26 (sample #1)
292 games · 2 days (5/16–5/17) · 17 divisions · 14 fields.
- **Rest gap between a team's consecutive games:** distribution (in slots) ≈ {0:54*, 1:121, 2:191, 3:20, 4:16, 5:1}. Mode = **2 slots ("one on, one off")**. Back-to-back (1) still occurs ~25% when forced. (*0s/some 1s inflated by club-name reuse across divisions.)
- **Games per team per day:** mostly **2–3** (1:30, 2:49, 3:52); higher counts are cross-division name collisions.
- **Spread:** divisions use **4–7 fields per day**; parallelism avg **12.2** games at once (up to 14). → spreading a division across many fields is correct; cramming onto one is not.
- **Slot increment:** **50 min** between games on a field (game length + buffer).
- **Day split:** pool play ran across **BOTH days** (day1 173 pool/8 bracket, day2 107 pool/4 bracket). Only 12 bracket games total; most divisions had no bracket. → "pool→day1, bracket→day2" is NOT universal; it must be a per-tournament CHOICE, not a hard rule.
- **Field designation:** 7v7 divisions play on dedicated "Field 2A (7's)" fields → confirms need for field→division/format restrictions.
- **Staggered hours:** divisions don't all play the same window; older divisions run later (HS B2 to 6pm), younger earlier-ish but not strict. → keep age-time a faint nudge only.

## Open implications for the auto-scheduler (to act on)
1. Make the **day assignment a choice**: "pool day 1 / bracket day 2" OR "spread/round-robin across all days". Don't hard-code.
2. Add a **game-duration / slot-length** notion (so a division's slot = duration + buffer), not just the global increment.
3. **Field designation** (divRestrictions: which divisions/formats a field allows) — surface in settings and honor in auto-fill.
4. Identify teams by **(division + name)** to avoid conflating same-named club teams across divisions.

_Confirmed by sample #1: spread across fields ✓, one-on-one-off rest target ✓, max ~3/day ✓._

### Monster Mash 2025 (sample #2 — via TourneyMachine public link)
Lacrosse · Oct 25–26 · 8 divisions. Source: tourneymachine.com public results (rendered in-browser, parsed per-division Division.aspx pages — confirms public links are analyzable, incl. other sports on the same platform).
- **Day split:** pool day 1 (Sat), bracket day 2 (Sun) — e.g. Boys 12U: P1–P6 Sat, B1–B3 Sun. **Opposite of sample #1**, which pooled both days → confirms day-split must be a per-tournament CHOICE.
- Small divisions (4 teams) = 6 pool games (round-robin, 3 each) on ~2 fields; bracket = 4-team single-elim (2 semis + final) next day.
- Bracket times: semis same slot (1:00), final later (2:40) — feeders before dependents (matches our bracket-order rule).

## Sample queue — links to extract (collected Jun 12 '26)
Two platforms now: TourneyMachine (Tournament.aspx?IDTournament=… , server-rendered Division.aspx
pages carry the game-by-game grid) and AES / advancedeventsystems.com (results.advancedeventsystems.com).
Both render client-side at the top level → pull via Claude-in-Chrome, then fetch the per-division pages.

Identified so far (sport / shape):
- Lacrosse, 2-day weekend grids: Sunshine State Summer Kick-Off '26 (CSV = sample #1), Monster Mash '25
  (= sample #2), Sunshine State Fall Classic '25, + more SSE events.
- Volleyball: 2026 PSA Summer Showdown (Plano TX, grade divisions); + AES volleyball events.
- Baseball: 2026 10U/12U State Invitational (Oviedo — explicit format note: 10UB = 3 pool→winners advance
  to single-elim; 12UB = 2 pool→ALL advance to single-elim); 2026 Cal Ripken & Babe Ruth District 10
  (multi-week district, T-Ball/Coach-Pitch/Machine-Pitch + 9U–16U).
- Basketball: Frenzy Shootout Series Summer Vol 1 (multi-week May–Jun, 11 grade/gender divisions).

Raw links to process (dedup before extracting):
- TM: h20260227182604778764cae57e83545
- TM: h20260317004547922dfab0669825d44
- TM: h2026060114360707546274b7cb7bf40
- TM: h20251016202102526546c5073e05442
- TM: h20251104023459632b2f9ccc0c5294a
- TM division: h20260523122759286daf6ce8191cd4d / IDDivision h202605231230142218ef60b3772e040
- TM (earlier): h20251020192543456f1779970ca9741, h20260506200145805313d64d648c04c,
  h20260318222450961ffbee2c6af8b44, h202604301808395522f070cd2b41b4e, h202605171404168076f65b1ef24c841
- AES event: results.advancedeventsystems.com/event/PTAwMDAwNDU3OTQ90/home
- AES catalog: advancedeventsystems.com/events

### Two shapes to keep separate when analyzing
- **Weekend grids** (lacrosse/volleyball/weekend baseball, 1–3 days): the relevant data for tuning the
  auto-scheduler's field×time packing — slot length, rest spacing, fields-per-division, day-split.
- **Multi-week series/district** (basketball series, Cal Ripken district): a different model (often ~1
  game/team/week). Useful for FORMAT/advance-rule patterns, NOT for grid packing. Don't blend the two.

### Cross-sport format note (confirmed, from the baseball director's own description)
The advance rule is real and varies by division even within one event: "winners advance" (top-N) vs
"all advance" (everyone-in) — exactly the owes≤1 vs owes≥2 logic already in the bracket generator.
- Third platform: summerfaceoff.com/schedule-results — large lacrosse event (Summer Face-Off). Custom
  site (not TM/AES) → inspect its schedule/results page structure separately when extracting.

---
## Batch crunch — Jun 12 '26 (8 events, 4 sports, 3 platforms)
Extracted game-by-game via Claude-in-Chrome (TM Division.aspx pages parse as a 1-row-per-game table:
`game# | day+time | location | team1 | s1 | s2 | team2`). Metrics computed in-browser; raw in /tmp/sched.

### Per-event (new this batch)
| Event | Sport | Shape | Slot (mode) | Games/team/day | Rest mode (slots) | Day split |
|---|---|---|---|---|---|---|
| SSE Fall Classic '25 | Lacrosse | 2-day, 8 div | **50 min** | 2–3 | **2** (2 b2b only) | pool d1 / bracket d2 |
| Summer Faceoff '25 | Lacrosse | 2-day, **20 div, 348 g** | **55 min** | 2–3 | **2** (209) vs b2b 61 | pool d1 + bracket d2 |
| PSA Summer Showdown | Volleyball | 2-day, 4 div | **60 min** | (noisy) | (noisy) | pool d1 / bracket d2 |
| 10U/12U State Inv | Baseball | 4-day, 2 div | **105 min** | **~1** | n/a | pool over d1–3, bracket d3–4 |
| Cal Ripken District 10 | Baseball | multi-wk, 11 div | **120 min** | **1** | n/a | **pure single-elim, no pools** |
| Frenzy Shootout | Basketball | multi-wk series, 11 div | **60 min** | **2** | **b2b NORMAL** (169 vs 145) | series (no day-split) |
| Sky High (AES) | Beach VB | multi-month league, 2 div | weekly | 1–2/Monday | n/a | weekly league, pools of 3 |

### Cross-sport synthesis (the big takeaways)
1. **Slot length is sport-specific**, not global: lacrosse **50–55 min**, volleyball **60**, basketball **60**,
   baseball **105–120**. The auto-fill works in grid-slot *indices*, so this lives in the **grid definition**
   (slot length per tournament/division), not the weights. Lacrosse default ≈ 50 min is correct.
2. **Games/team/day is sport-specific**: lacrosse **2–3**, basketball **2**, baseball **~1**. `maxPerDay=3`
   is right for lacrosse; should be a per-division setting for other sports.
3. **Rest preference is sport-specific**: lacrosse **strongly one-on-one-off** (mode = 2 slots across all 3
   lax events; back-to-back ~20% and clearly dispreferred). Basketball **tolerates back-to-back** (b2b ≥
   one-off). → keep the strong b2b penalty as the LACROSSE default, but it must be relaxable per sport.
4. **Day-split genuinely varies — even within lacrosse**: Summer Kick-Off pooled BOTH days; Fall Classic /
   Monster Mash / Summer Faceoff / PSA = pool d1 / bracket d2; multi-day baseball spreads pool over 2–3 days;
   districts are pure single-elim with NO pools. → day assignment MUST be a director choice, never hard-coded.
   (This is now confirmed across 8 events — it's the #1 structural fix.)
5. **Spread across fields is universal**: small divisions 1–2 fields, big ones up to **10–12** courts/fields
   in parallel. The `W_BAL` spread weight + team-field consistency is the right model.
6. **Field designations are real**: lacrosse "7v7"/"10v10" fields, beach "SO Court" — confirms `divRestrictions`.
7. **Two scheduling worlds**: (a) **weekend grid** (1–3 days, pool→bracket) = what auto-fill targets; (b)
   **league/series & district** (weekly over weeks/months, ~1–2 games/play-date, or single-elim) = a different
   model. Don't tune the grid scheduler on series data.
8. **Advance rule varies by division** (winners-only vs all-in) — confirmed by the baseball director's own note;
   maps to the existing owes≤1 vs owes≥2 bracket logic.

### Verdict on current autoSchedule.ts weights
The lacrosse-tuned defaults are **VALIDATED** by the real data, not contradicted: rest target = 2 slots ✓,
strong back-to-back penalty ✓, spread-across-fields ✓, max 3/day ✓, faint younger-earlier ✓. So the
high-value work is **structural**, not re-weighting:
- **(A) Day-split as a choice** (pool-both-days | pool-d1/bracket-d2 | custom) — top priority, clearly needed.
- **(B) Per-division slot length + maxPerDay** (so baseball=1×/120min, basketball b2b-ok, etc. work too).
- **(C) Field designations** (`divRestrictions`) surfaced in settings + honored (engine already accepts them).
- **(D) Optional per-division "allow back-to-back" / rest-target** so non-lacrosse sports schedule naturally.

### Queued links not separately parsed (redundant with confirmed patterns — revisit only if needed)
TM: h20260227182604778764cae57e83545, h20260317004547922dfab0669825d44, h2026060114360707546274b7cb7bf40,
h20251016202102526546c5073e05442, h20251104023459632b2f9ccc0c5294a, h20260523122759286daf6ce8191cd4d.
(Patterns above already converged across 8 events; parse these later if Bo wants more sport/size coverage.)
