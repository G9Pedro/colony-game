import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import { isValidScenarioTuningDashboardPayload } from '../src/game/reportPayloadValidatorsScenarioTuning.js';

const execFileAsync = promisify(execFile);

test('report scenario tuning script writes schema-valid sorted dashboard payload', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'scenario-tuning-dashboard-script-'));
  const outputPath = path.join(tempDirectory, 'scenario-tuning-dashboard.json');
  const markdownPath = path.join(tempDirectory, 'scenario-tuning-dashboard.md');
  const scriptPath = path.resolve('scripts/report-scenario-tuning.js');

  try {
    const { stdout } = await execFileAsync(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        SIM_SCENARIO_TUNING_DASHBOARD_PATH: outputPath,
        SIM_SCENARIO_TUNING_DASHBOARD_MD_PATH: markdownPath,
      },
    });

    const payload = JSON.parse(await readFile(outputPath, 'utf-8'));
    assert.equal(payload.meta.kind, REPORT_KINDS.scenarioTuningDashboard);
    assert.equal(isValidScenarioTuningDashboardPayload(payload), true);
    assert.deepEqual(
      payload.scenarios.map((scenario) => scenario.id),
      [...payload.scenarios.map((scenario) => scenario.id)].sort((a, b) => a.localeCompare(b)),
    );
    assert.match(stdout, /Scenario tuning dashboard generated: scenarios=\d+, active=\d+/);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
