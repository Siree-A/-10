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
- `assets/quest-data.js`: 24 original practice questions, explanations and level thresholds.
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

Arrow keys/WASD move; E interacts. Tap the floor to walk, tap a station or use the HTML
station list to enter a mission. The complete quiz flow is keyboard accessible without
the canvas. Mobile uses tap controls. Dialogs support Escape and focus return.
Reduced-motion preferences remove ambient bobbing and walking bounce. Hidden/offscreen
canvases stop their animation loop; leaving the tab pauses play. Pixel ratio is capped,
geometry is lightweight and shared materials are cached. WebGL/module failures preserve
the HTML mission flow. No time pressure and no health-related treatment advice.

## Verification and release

Serve the directory with `python -m http.server 4173 --bind 127.0.0.1`.
Run `node scripts/verify-quest.cjs`, with `PLAYWRIGHT_MODULE` or `NODE_PATH` set if needed.
The script covers rendered WebGL, actual keyboard pickup, answers/combos/round rewards,
reload, separate profiles, name escaping, export, corruption, blocked storage, responsive
navigation and module-failure fallback. It uses synthetic students and ignored screenshots.
Run the existing `node scripts/verify.cjs` for navigation/Portfolio regressions.
Before publishing, run `python scripts/version-assets.py`.

There is no build command or backend migration. Deployment is the existing GitHub Pages
workflow on push to main. Local implementation does not publish the live website.

Three.js integration reference: https://threejs.org/manual/pages/installation.html
