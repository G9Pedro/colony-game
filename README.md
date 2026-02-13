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
- Objective rewards automatically scale with scenario difficulty.
- **Run analytics**: track peak population, completions, deaths, run outcomes, and balance profile context.
- **Runtime state invariants** to detect and pause on simulation corruption.
- Invariant violations are logged in run stats for debugging and postmortems.
- **Scenario presets**: Frontier, Prosperous, and Harsh start conditions.
- **Balance profiles**: Standard, Forgiving, and Brutal simulation tuning.
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
- `?balance=standard|forgiving|brutal`

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

Generate a machine-readable regression report:

```bash
npm run simulate:report
```

Run multi-seed drift checks against baseline bounds:

```bash
npm run simulate:drift
```

Run deterministic snapshot signature checks:

```bash
npm run simulate:snapshot
```

Run balance profile regression checks:

```bash
npm run simulate:balance
```

Generate suggested baseline updates from current deterministic behavior:

```bash
npm run simulate:baseline:suggest
```

This produces:
- `reports/baseline-suggestions.json` (structured data + deltas + snippets)
- `reports/baseline-suggestions.md` (human-readable summary with copy-ready snippets)

Fail CI/local checks if suggested baselines diverge from committed baselines:

```bash
npm run simulate:baseline:check
```

CI now runs:
- `npm test`
- `npm run simulate:assert`
- `npm run simulate:report` (uploaded as artifact)
- `npm run simulate:drift` (uploaded as artifact)
- `npm run simulate:snapshot` (uploaded as artifact, enforced)
- `npm run simulate:balance` (uploaded as artifact)
- `npm run simulate:baseline:suggest` (uploaded as artifact)
- `npm run simulate:baseline:check` (enforced)

One-command local verification:

```bash
npm run verify
```

`verify` now runs:
- `npm test`
- `npm run simulate:assert`
- `npm run simulate:drift`
- `SIM_SNAPSHOT_ENFORCE=1 npm run simulate:snapshot`
- `npm run simulate:balance`
- `npm run simulate:baseline:suggest`
- `npm run simulate:baseline:check`

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
