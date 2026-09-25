# Research Quest

An original Thai research learning game for the existing static Research 10 website.
Entry: `game.html`, linked after Portfolio in all three existing pages and mobile menus.

## Product contract

Students enter a member/student number and display name, explore a 3D floating lab,
collect knowledge crystals, and answer research practice questions at four stations.
The loop has no timer or XP penalty. Completing four stations unlocks another round
with a different question from the preceding round at each station.

- `game.html` / `assets/quest.css`: accessible forms, HUD, modal feedback, responsive layout.
- `assets/quest.js`: profiles, scoring, progress, export, round and modal state.
- `assets/quest-data.js`: 64 practice questions (24 original + 40 lecture adaptations), stable IDs and level thresholds.
- `assets/quest-lecture.js`: adapted scenarios with PDF title/page provenance; 16 questions per topic in the combined bank.
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

There is no server, authentication or centralized leaderboard. Student number + normalized
name key a localStorage profile. This is self-reported practice progress, not verified
attendance or an assessment record. Only enter a display name needed for practice.
Never use these records as an access-control decision or certified academic score.

Profiles contain XP, totals, per-skill correct counts, combo, current round/question IDs,
claimed crystals/stations and at most 200 recent event records. Names render as text.
Reload requires entering the same identifier and name. Different names produce separate
profiles. Another tab changing the current record signs the stale tab out to avoid
silently overwriting progress. This is not a transactional multi-device system.

Blocked or full storage shows an explicit warning and preserves in-memory play and JSON
export. Corrupt records are not overwritten. Clearing browser storage loses progress.
Export downloads a readable JSON history; importing and cross-device sync are not implemented.

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

Both supplied Google Forms currently redirect to closedform, and Drive retrieval returned
403. Their question content has NOT been incorporated or claimed as a source. A readable
export of the original pre-tests is still needed to fulfill that part of the request.
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
reload, separate profiles, name escaping, export, corruption, blocked storage, responsive
navigation and module-failure fallback. It uses synthetic students and ignored screenshots.
Run the existing `node scripts/verify.cjs` for navigation/Portfolio regressions.
Run `node scripts/verify-neon.cjs` for the 64-question source contract, real station
pathfinding, audio context suspension, graphics selection and mobile movement release.
Before publishing, run `python scripts/version-assets.py`.

There is no build command or backend migration. Deployment is the existing GitHub Pages
workflow on push to main. Local implementation does not publish the live website.

Three.js integration reference: https://threejs.org/manual/pages/installation.html
