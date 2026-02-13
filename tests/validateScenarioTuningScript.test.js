import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import { isValidScenarioTuningValidationPayload } from '../src/game/reportPayloadValidatorsScenarioTuning.js';
import { runNodeDiagnosticsScript } from './helpers/reportDiagnosticsScriptTestUtils.js';

test('validate scenario tuning script writes schema-valid sorted validation payload', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'scenario-tuning-validate-script-'));
  const outputPath = path.join(tempDirectory, 'scenario-tuning-validation.json');
  const scriptPath = path.resolve('scripts/validate-scenario-tuning.js');

  try {
    const { stdout } = await runNodeDiagnosticsScript(scriptPath, {
      env: {
        SIM_SCENARIO_TUNING_REPORT_PATH: outputPath,
      },
    });

    const payload = JSON.parse(await readFile(outputPath, 'utf-8'));
    assert.equal(payload.meta.kind, REPORT_KINDS.scenarioTuningValidation);
    assert.equal(isValidScenarioTuningValidationPayload(payload), true);
    assert.deepEqual(
      payload.errors.map((issue) => issue.scenarioId),
      [...payload.errors.map((issue) => issue.scenarioId)].sort((a, b) => a.localeCompare(b)),
    );
    assert.match(stdout, /Scenario tuning validation: scenarios=\d+, errors=\d+, warnings=\d+/);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
