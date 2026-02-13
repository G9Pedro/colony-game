import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import { buildScenarioTuningIntensityOnlyDriftPayload } from '../scripts/reportDiagnosticsFixtures.js';
import {
  assertOutputHasReadFailureDiagnostic,
} from './helpers/reportDiagnosticsTestUtils.js';

const execFileAsync = promisify(execFile);

test('check-scenario-tuning-baseline allows intensity drift when strict mode is off', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'check-tuning-baseline-'));
  const payloadPath = path.join(tempDirectory, 'scenario-tuning-baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');

  try {
    await writeFile(
      payloadPath,
      JSON.stringify(buildScenarioTuningIntensityOnlyDriftPayload(), null, 2),
      'utf-8',
    );
    const { stderr } = await execFileAsync(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH: payloadPath,
        REPORT_DIAGNOSTICS_JSON: '1',
      },
    });
    assert.ok(stderr.includes('SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1'));
    assert.ok(stderr.includes('"code":"scenario-tuning-intensity-drift"'));
    assert.ok(stderr.includes('"code":"scenario-tuning-intensity-enforcement-tip"'));
    assert.ok(stderr.includes('"script":"simulate:check:tuning-baseline"'));
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('check-scenario-tuning-baseline fails on intensity drift when strict mode is on', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'check-tuning-baseline-'));
  const payloadPath = path.join(tempDirectory, 'scenario-tuning-baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');

  try {
    await writeFile(
      payloadPath,
      JSON.stringify(buildScenarioTuningIntensityOnlyDriftPayload(), null, 2),
      'utf-8',
    );

    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [scriptPath], {
          env: {
            ...process.env,
            SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH: payloadPath,
            SIM_SCENARIO_TUNING_ENFORCE_INTENSITY: '1',
            REPORT_DIAGNOSTICS_JSON: '1',
          },
        }),
      (error) =>
        error.code === 1 &&
        error.stderr.includes('strict enforcement enabled') &&
        error.stderr.includes('"code":"scenario-tuning-intensity-drift-strict"') &&
        error.stderr.includes('"script":"simulate:check:tuning-baseline"'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('check-scenario-tuning-baseline emits read-error diagnostic for unreadable cache path', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'check-tuning-baseline-'));
  const scriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');

  try {
    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [scriptPath], {
          env: {
            ...process.env,
            SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH: tempDirectory,
            REPORT_DIAGNOSTICS_JSON: '1',
          },
        }),
      (error) => {
        assert.equal(error.code, 1);
        assert.ok(error.stderr.includes('Unable to read scenario tuning baseline cache payload'));
        assertOutputHasReadFailureDiagnostic({
          stdout: error.stdout,
          stderr: error.stderr,
          diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactReadError,
          expectedScript: 'simulate:check:tuning-baseline',
          expectedPath: tempDirectory,
          expectedStatus: 'error',
          expectedErrorCode: 'EISDIR',
        });
        return true;
      },
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
