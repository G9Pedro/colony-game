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
- **Scenario presets**: Frontier, Prosperous, and Harsh with distinct start conditions and ongoing production/workforce tuning.
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

## Recent Pipeline Improvements

- Added scenario tuning trend reporting with dual comparison sources:
  - baseline dashboard artifact (when present),
  - committed baseline signatures/intensity maps (fallback).
- Added a baseline capture command for dashboard-to-dashboard trend workflows:
  - `npm run simulate:capture:tuning-dashboard-baseline`
- Expanded scenario tuning baseline suggestions to include:
  - signature drift snippets,
  - total tuning intensity drift snippets.
- Added optional strict intensity enforcement:
  - local: `SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1 npm run simulate:check:tuning-baseline`
  - CI opt-in via repository variable: `SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1`

### Tuning Report Pipeline Flow

```txt
SCENARIO_DEFINITIONS
  ├─> simulate:report:tuning ---------------------> scenario-tuning-dashboard.{json,md}
  ├─> simulate:capture:tuning-dashboard-baseline -> scenario-tuning-dashboard.baseline.json
  ├─> simulate:report:tuning:trend --------------> scenario-tuning-trend.{json,md}
  └─> simulate:suggest:tuning-baseline ----------> scenario-tuning-baseline-suggestions.{json,md}
                                                   └─> simulate:check:tuning-baseline
                                                        (optional strict: SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1)
```

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

Most simulation CLI commands support:

- `SIM_STRATEGY_PROFILE` (defaults to `baseline`)

Run deterministic regression assertions (fails on balance regressions):

```bash
npm run simulate:assert
```

Validate scenario tuning maps for invalid keys or unsafe multipliers:

```bash
npm run simulate:validate:tuning
```

Generate a compact scenario tuning dashboard (JSON + Markdown):

```bash
npm run simulate:report:tuning
```

Capture the current scenario tuning dashboard as a reusable trend baseline artifact:

```bash
npm run simulate:capture:tuning-dashboard-baseline
```

Generate a scenario tuning trend report against baseline signatures (or a baseline dashboard file when available):

```bash
npm run simulate:report:tuning:trend
```

When a baseline dashboard artifact is unavailable, the trend report falls back to committed signature and intensity baselines.

Troubleshooting:
- if you see a message that the baseline dashboard is missing, run:
  - `npm run simulate:capture:tuning-dashboard-baseline`
  - then rerun `npm run simulate:report:tuning:trend` to switch comparison source to dashboard mode.

Trend baseline path can be overridden with:
- `SIM_SCENARIO_TUNING_TREND_BASELINE_PATH` (read path used by trend report)
- `SIM_SCENARIO_TUNING_DASHBOARD_BASELINE_PATH` (write path used by baseline capture)

Enforce scenario tuning signature baseline consistency:

```bash
npm run simulate:check:tuning-baseline
```

Optional strict mode:
- set `SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1` to fail when total tuning intensity baselines drift (not just signature baselines).

Enable strict mode in CI:
1. Open repository **Settings → Secrets and variables → Actions → Variables**.
2. Add variable `SIM_SCENARIO_TUNING_ENFORCE_INTENSITY` with value `1`.
3. Re-run CI to activate the optional strict intensity enforcement step.

Generate scenario tuning baseline suggestions (JSON + Markdown):

```bash
npm run simulate:suggest:tuning-baseline
```

### Tuning Report Command Quick Reference

| Command | Purpose | Primary Outputs |
| --- | --- | --- |
| `npm run simulate:report:tuning` | Build current tuning dashboard snapshot | `reports/scenario-tuning-dashboard.json/.md` |
| `npm run simulate:capture:tuning-dashboard-baseline` | Capture dashboard baseline artifact for trend comparisons | `reports/scenario-tuning-dashboard.baseline.json` |
| `npm run simulate:report:tuning:trend` | Compare current tuning against dashboard/signature+intensity baselines | `reports/scenario-tuning-trend.json/.md` |
| `npm run simulate:suggest:tuning-baseline` | Suggest baseline updates for signatures and total intensity | `reports/scenario-tuning-baseline-suggestions.json/.md` |
| `npm run simulate:check:tuning-baseline` | Enforce tuning baseline drift policy | console output + exit status |
| `npm run simulate:tuning:session` | Run the recommended manual tuning command sequence | all tuning reports + baseline check output |
| `npm run simulate:tuning:session:strict` | Run the same tuning sequence but fail on intensity drift | all tuning reports + strict baseline check output |

### Recommended Manual Tuning Session Order

For local balancing sessions, use this order to get deterministic, review-friendly outputs:

1. Edit scenario tuning multipliers in `src/content/scenarios.js`.
2. Run the full tuning workflow:

   ```bash
   npm run simulate:tuning:session
   ```

3. If you are intentionally redefining dashboard-based trend comparisons, capture a fresh dashboard baseline:

   ```bash
   npm run simulate:capture:tuning-dashboard-baseline
   ```

4. Use strict mode when you want CI-parity gating locally (for example, before opening a balancing PR):

   ```bash
   npm run simulate:tuning:session:strict
   ```

### Tuning PR Checklist (Quick)

Before opening a tuning-focused PR, run:

```bash
npm run simulate:tuning:session:strict
```

Then review these artifacts:
- `reports/scenario-tuning-dashboard.md` for current multiplier deltas/rankings.
- `reports/scenario-tuning-trend.md` to confirm intended scenario changes only.
- `reports/scenario-tuning-baseline-suggestions.md` for copy-ready baseline updates (signature + total intensity).

This suggestion report now includes copy-ready snippets for both:
- `EXPECTED_SCENARIO_TUNING_SIGNATURES`
- `EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA`

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

Validate generated JSON report artifacts against schema-tagged payload contracts:

```bash
npm run reports:validate
```

This writes: `reports/report-artifacts-validation.json`
and `reports/report-artifacts-validation.md`

CI now runs:
- `npm test`
- `npm run simulate:validate:tuning` (uploaded as artifact)
- `npm run simulate:report:tuning` (uploaded as artifact)
- `npm run simulate:report:tuning:trend` (uploaded as artifact)
- `npm run simulate:suggest:tuning-baseline` (uploaded as artifact)
- `npm run simulate:check:tuning-baseline` (enforced)
- optional strict intensity enforcement when repo/org variable `SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1` is set
- `npm run simulate:assert`
- `npm run simulate:report` (uploaded as artifact)
- `npm run simulate:drift` (uploaded as artifact)
- `npm run simulate:snapshot` (uploaded as artifact, enforced)
- `npm run simulate:balance` (uploaded as artifact)
- `npm run simulate:baseline:suggest` (uploaded as artifact)
- `npm run reports:validate`
- `reports/report-artifacts-validation.json/.md` (uploaded as artifact)
- `npm run simulate:baseline:check` (enforced)

One-command local verification:

```bash
npm run verify
```

`verify` now runs:
- `npm test`
- `npm run simulate:validate:tuning`
- `npm run simulate:report:tuning`
- `npm run simulate:report:tuning:trend`
- `npm run simulate:suggest:tuning-baseline`
- `npm run simulate:check:tuning-baseline`
- `npm run simulate:assert`
- `npm run simulate:drift`
- `SIM_SNAPSHOT_ENFORCE=1 npm run simulate:snapshot`
- `npm run simulate:balance`
- `npm run simulate:baseline:suggest`
- `npm run reports:validate`
- `npm run simulate:baseline:check`

### CI/Local Parity Tip

- Use `npm run verify` for full local parity with the default CI gate.
- Use `npm run simulate:tuning:session:strict` when iterating on tuning and you want intensity drift enforcement to match strict CI mode before opening a PR.

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
