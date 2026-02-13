# Colony Frontier

Colony Frontier is a complete, browser-playable colony management game built with modular ES modules.  
You build structures, manage colonists and resources, research technologies, and push your settlement to victory.

## Features

- **Complete colony loop**: build → produce → research → expand → win/lose.
- **12+ building types** across housing, production, infrastructure, culture, and defense.
- **Colonist simulation** with jobs, movement, skills, and needs (hunger, rest, health, morale).
- **Construction queue** with builder-driven progress.
- **Research tree** with prerequisites and unlocks.
- **Objective tracker** with milestone rewards and progression guidance.
- Objective cards show explicit reward details before completion.
- **Run analytics**: track peak population, completions, deaths, and run outcomes.
- **Runtime state invariants** to detect and pause on simulation corruption.
- **Scenario presets**: Frontier, Prosperous, and Harsh start conditions.
- **Deterministic seeded simulation** support for reproducible runs.
- **Save/Load/Reset** controls backed by `localStorage`.
- **Save Export/Import** for portable JSON save files.
- **Versioned save schema** with migration support for legacy save payloads.
- **Strict save validation** for imports with actionable error feedback.
- **Import safety limits** to reject unexpectedly large save files.
- **Invariant-checked save loading** to reject structurally unsafe game states.
- **3D rendering with Three.js**, plus an automatic 2D fallback when WebGL is unavailable.
- **Responsive UI** that supports both desktop and touch interactions.

## Tech Stack

- Vanilla HTML/CSS/JavaScript (ES modules)
- Three.js (installed via npm, served from `node_modules`)
- Node built-in test runner for unit tests

## Project Structure

```txt
index.html
styles.css
src/
  content/        # data definitions (resources, buildings, research)
  game/           # game engine, state, selectors, event bus
  systems/        # simulation systems (colonists, economy, construction, research, outcomes)
  render/         # Three.js renderer + fallback renderer
  ui/             # UI controller and interactions
  persistence/    # save/load helpers
tests/            # unit tests for pure logic modules
```

## Run Locally

```bash
npm install
npm start
```

Then open: `http://localhost:8000`

Optional URL parameters:

- `?scenario=frontier|prosperous|harsh`
- `?seed=any-string-you-like`

## Test

```bash
npm test
```

Unit tests cover:
- economy system
- construction system
- research system
- colonist simulation behavior
- scenario setup behavior
- deterministic simulation behavior
- state serialization validity
- scripted integration progression milestones
- objective progression behavior

Run a deterministic scenario simulation matrix from CLI:

```bash
npm run simulate
```

Run deterministic regression assertions (fails on balance regressions):

```bash
npm run simulate:assert
```

CI now runs:
- `npm test`
- `npm run simulate:assert`

One-command local verification:

```bash
npm run verify
```

## Gameplay Notes

### Controls

- **Build**: choose category + building in right panel, then click/tap terrain.
- **Hire Colonist**: left panel button (costs food).
- **Research**: start technologies from the research panel when enough knowledge is available.
- **Speed/Pause**: top controls (1x/2x/4x).
- **Save/Load/Reset**: top controls.
- **Export/Import**: export current game to JSON or import a previous exported save.

### Progression

- Build food + material production first.
- Expand housing capacity to grow population.
- Produce knowledge via schools/libraries to unlock higher-tier tech.
- Reach the late-game charter condition to win.

### Loss Conditions

- Colony can collapse from starvation/despair pressure.
- If all colonists die, the game ends immediately.

## Code Quality and Maintainability

The codebase is intentionally split by domain boundaries:

- **data (content)** vs **simulation (systems)** vs **presentation (render/ui)**
- deterministic update loop in `GameEngine`
- pure, testable logic modules for critical systems

This structure keeps game mechanics scalable and makes iterative balancing safer than monolithic scripts.
