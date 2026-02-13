import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import { isValidScenarioTuningDashboardPayload } from '../src/game/reportPayloadValidatorsScenarioTuning.js';
import { runNodeDiagnosticsScript } from './helpers/reportDiagnosticsScriptTestUtils.js';

test('capture scenario tuning dashboard baseline script writes valid payload', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'scenario-tuning-baseline-'));
  const outputPath = path.join(tempDirectory, 'scenario-tuning-dashboard.baseline.json');
  const scriptPath = path.resolve('scripts/capture-scenario-tuning-dashboard-baseline.js');

  try {
    await runNodeDiagnosticsScript(scriptPath, {
      env: {
        SIM_SCENARIO_TUNING_DASHBOARD_BASELINE_PATH: outputPath,
      },
    });

    const payload = JSON.parse(await readFile(outputPath, 'utf-8'));
    assert.equal(payload.meta.kind, REPORT_KINDS.scenarioTuningDashboard);
    assert.equal(typeof payload.scenarioCount, 'number');
    assert.equal(typeof payload.activeScenarioCount, 'number');
    assert.ok(Array.isArray(payload.scenarios));
    assert.equal(isValidScenarioTuningDashboardPayload(payload), true);
    assert.deepEqual(
      payload.scenarios.map((scenario) => scenario.id),
      [...payload.scenarios.map((scenario) => scenario.id)].sort((a, b) => a.localeCompare(b)),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
