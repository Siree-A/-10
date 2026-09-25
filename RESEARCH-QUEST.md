# Research Quest

An original Thai research learning game for the existing static Research 10 website.
Entry: `game.html`, linked after Portfolio in all three existing pages and mobile menus.

## Discovery and onboarding update

The four world stations are topic categories. `quest-library.js` adds a numbered atlas of
all 124 questions, topic/new/completed filters, distinct-question progress, and a next-new
question action in the answer dialog. Atlas answers use the same grading/reward path but
never claim a world station or award its four-station bonus. World rounds prefer lifetime
evidence as well as recent history so new questions remain discoverable.

The login form visibly offers automatic online scoring, initially checked for a new code;
existing explicit opt-outs are preserved. The checkbox in the ranking panel remains editable.
Ranking refreshes every 30 seconds while visible and retries pending events on reconnect.
Survey sharing is an editable remembered preference; only a deliberate form submission
creates a pending reflection. Retries expire at the Bangkok date boundary rather than
misdating yesterday's response. Existing Supabase RPCs and server grading are unchanged.

`site-tour.js` and `site-tour.css` cover all four pages with a six-step first-use dialog,
clearly labeled example click sequences, links to actual pages, session-only skip,
persistent never-show/finished state, Escape dismissal and an always-available replay button.
No file is uploaded by the tutorial. Portfolio searches and folder links are grounded in
`portfolio.js`; PDF/video links are grounded in `documents.html`. Drive upload instructions
follow https://support.google.com/drive/answer/2424368 and explain edit permissions.

Acceptance: every question is reachable through next-new, atlas play preserves the world
round, false sharing preferences survive login/reload, retries need no refresh click,
and help can be skipped, suppressed or reopened on mobile and all four routes.
`scripts/verify-journey.cjs` exercises these boundaries using a mocked provider, never
production score writes. Existing game regression tests also stub cloud configuration.

## Product contract

Students enter a roster member code; the website fills the canonical name automatically. They explore a 3D floating lab,
collect knowledge crystals, and answer research practice questions at four stations.
The loop has no timer or XP penalty. Completing four stations unlocks another round
with a different question from the preceding round at each station.

- `game.html` / `assets/quest.css`: accessible forms, HUD, modal feedback, responsive layout.
- `assets/quest.js`: profiles, scoring, progress, export, round and modal state.
- `assets/quest-data.js`: 124 practice questions (24 original + 40 lecture adaptations + 60 supplied draft pretest questions), stable IDs and level thresholds.
- `assets/quest-lecture.js`: adapted scenarios with PDF title/page provenance.
- `assets/quest-pretest.js`: 30 Basic and 30 Advanced four-option questions from the organizer's pasted draft, IDs 64–123. Imported by `scripts/import-quest-pretest.cjs`; document instructions are not game instructions.
- `assets/quest-community.js` / `quest-club-ui.js`: daily journals, rankings, optional reflection, break timer and avatar style selection.
- `assets/quest-insights.js`: deterministic SWOT and a lightweight extruded SVG radar with adjustable perspective; no additional WebGL context.
- `assets/quest-cloud.js` / `quest-cloud-config.js`: optional Supabase RPC integration. Empty configuration keeps the game local and explicitly labels local rankings.
- `supabase/quest-setup.sql`: installable private tables, validated RPCs and generated code/question seeds; see `SUPABASE-SETUP.md`.
- `assets/quest-audio.js`: original synthesized ambient music and effects; opt-in, volume controlled, suspended when paused/hidden/signed out.
- `assets/quest-neon.css`: responsive game HUD, touch movement, minimap, settings and neon presentation.
- `assets/quest-world.js`: real WebGL 3D geometry, character movement, click navigation,
  collisions, pickups and station interactions.
- `assets/quest-avatar.js`: shared rounded researcher model for the world and the profile
  portrait, with blinking, idle sway, walking and tap-to-wave greeting. The portrait
  appears after registration, respects pause/reduced motion and stops drawing offscreen.
- `assets/feature-badge.css`: red New Feature notification on the game navigation link
  across all pages, with an inline placement in mobile menus.
- `assets/vendor/three.module.min.js`: pinned Three.js 0.170.0, with upstream MIT license.
  Vendored so the 3D engine requires no external CDN at runtime. Google Fonts are optional.

## Scoring

Correct answer: 40 XP plus 5 XP per prior consecutive correct answer, capped at 20 bonus XP.
Incorrect answer: 10 XP with explanation. A station can only award once per round.
Crystal: 5 XP, once per crystal per round. Four stations: 60 XP once per round.
Level: `floor(sqrt(xp / 100)) + 1`. Badges reward a first mission, a correct answer
in each skill, a three-answer combo, and level five.

## Persistence and boundaries

The shipped configuration connects to Supabase project lvbmzcfxseoxufemdcpi (2026-09-25).
Roster code keys a localStorage profile and names come from `researchers.json`.
This is self-reported practice progress, not verified attendance or an assessment record.
Never use these records as an access-control decision or certified academic score.

Profiles contain XP, totals, per-skill correct counts, combo, current round/question IDs,
claimed crystals/stations and at most 200 recent event records. Names render as text.
Reload requires entering the same identifier. Legacy profiles keyed by code and name migrate
using the valid profile with greatest XP; old keys remain untouched. No totals are merged.
Another tab changing the current record signs the stale tab out to avoid
silently overwriting progress. This is not a transactional multi-device system.

Blocked or full storage shows an explicit warning and preserves in-memory play and JSON
export. Corrupt records are not overwritten. Clearing browser storage loses progress.
Export downloads a readable JSON history; importing and cross-device XP/SWOT sync are not implemented.

Rank points are separate from XP. Only the first answer per code/question/Bangkok day earns
40 correct or 10 incorrect points, plus 5 per unique crystal/day. No round/combo bonuses.
Ties share rank; daily/total views support A/B filtering. Old XP is not uploaded.
Central ranking writes require opt-in and an anonymous auth session. Codes remain self-reported,
not verified identities. Server grading, unique constraints and event UUIDs prevent duplicate
credits but cannot prove physical gameplay or prevent someone choosing another person's code.

SWOT uses the first-ever answer per distinct question. At least three per topic are needed
for a tentative S/W classification; >=70% is a game heuristic, not a validated ability cutoff.
Unknown axes do not become zero. O/T explain learning options and interpretation risks;
strategies are deterministic suggestions. This is a first-exposure practice snapshot, not a
validated pre/post measure of learning gains. All axes expose exact counts alongside rates.

Optional three-item 1–5 reflection covers perceived relaxation, understanding and satisfaction,
plus a preferred next topic. Local latest responses stay separate by member code. Online
responses omit names/codes, but carry the technical auth UID: administrators can correlate it.
Public RPC only releases a fixed 30-day aggregate after at least five anonymous accounts,
which are not necessarily five unique people. No medical or causal efficacy claims.

## Accessibility and performance

Arrow keys/WASD move; Shift runs, Space jumps and E interacts. Tap the floor to walk.
Stations route the player around the reactor/desks using a half-unit grid path, then
open the mission on arrival. The HTML station list also routes the player; an explicit
quick-review checkbox opens questions immediately, as does the WebGL fallback.
Touch/keyboard-accessible directional buttons release movement on pointer cancel and blur.
Follow and overview cameras, minimap, fullscreen and graphics settings are available.
Decorations respond with a pulse/particles or contextual message. Dialogs support Escape and focus return.
Reduced-motion preferences remove ambient bobbing and walking bounce. Hidden/offscreen
canvases stop their animation loop; leaving the tab pauses play. World pixel ratio is capped at 1.4,
geometry is lightweight and shared materials are cached. WebGL/module failures preserve
the HTML mission flow. No time pressure and no health-related treatment advice.
The skyline/windows use instancing, particles reuse a 48-point buffer, and glow uses a
single procedural sprite texture rather than bloom/reflection passes. Auto quality switches
to a DPR-1, no-shadow, 30-FPS target after sustained slow frames; it does not promise a
particular frame rate on every device. Balanced caps drawing near 60 FPS; inactive scenes
use a 30-FPS ceiling. Reduced motion removes ambient bobbing, particles and object pulses.

## Teaching sources and limits (25 September 2026)

Lecture scenarios were adapted from the eight PDFs supplied by the user: Validity and
Reliability of Instrument Pharmacists; Research for gradudate level 2569 Vers 2 New;
Statistics for Grad Students; Research Evaluation; the ethics-submission handout; the
risk-assessment example; the disease-sequence proposal; and the Thai athletes instrument
development article. Each adapted question records a PDF page number, shown after answering.
Original IDs 0–23 remain original practice questions and are labeled accordingly, not
misrepresented as lecturer-authored questions. IDs 24–63 are new adaptations.

Both supplied Google Forms redirected to closedform, and Drive retrieval returned 403.
The later organizer-supplied pasted draft provides the 60 new questions. They are labeled
as that draft, not represented as a verified export of the original closed forms.
The YouTube reference was inspected around 9:57 and 10:22: neon city, immersive camera and
atmospheric lighting inspired the lab district; its assets/code/audio were not copied.

No original PDFs, respondent data or student records are uploaded as part of the game.
New rounds prefer questions absent from the last 200 history events, then avoid the immediately
preceding round when that pool is exhausted. The existing localStorage v1 schema and IDs
are preserved. XP remains optional recreational practice, not an academic grade.

## Verification and release

Serve the directory with `python -m http.server 4173 --bind 127.0.0.1`.
Run `node scripts/verify-quest.cjs`, with `PLAYWRIGHT_MODULE` or `NODE_PATH` set if needed.
The script covers rendered WebGL, actual keyboard pickup, answers/combos/round rewards,
reload, separate profiles, safe name rendering, export, corruption, blocked storage, responsive
navigation and module-failure fallback. Tests use isolated browser storage and no production writes.
Run the existing `node scripts/verify.cjs` for navigation/Portfolio regressions.
Run `node scripts/verify-neon.cjs` for the 124-question source contract, real station
pathfinding, audio context suspension, graphics selection and mobile movement release.
Before publishing, run `python scripts/version-assets.py`.

Run `node scripts/verify-community.cjs` for first-attempt evidence, timezone boundaries, ties,
canonical roster, migration, four choices, survey isolation, responsive radar and mocked
cloud retry/idempotency. Run `node scripts/verify-quest-db.cjs` with PGlite for actual SQL
permissions, server grading, duplicates, date validation and aggregate privacy gating.
These checks passed locally on 2026-09-25. The connected provider was also checked for
public board/aggregate reads, anonymous sign-in, authenticated invalid-code rejection,
and denial of unauthenticated score writes. No fabricated player scores were submitted.

There is no frontend build step. Deployment uses the existing GitHub Pages workflow on push
to main. Supabase setup is a separate manual step documented in `SUPABASE-SETUP.md`.

Three.js integration reference: https://threejs.org/manual/pages/installation.html
