import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { REPORT_KINDS, withReportMeta } from '../src/game/reportPayloadValidators.js';

const execFileAsync = promisify(execFile);

function buildIntensityOnlyDriftPayload() {
  return withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
    overallPassed: false,
    changedCount: 0,
    intensityChangedCount: 1,
    strictIntensityRecommended: true,
    strictIntensityCommand:
      'SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1 npm run simulate:check:tuning-baseline',
    currentSignatures: { frontier: 'aaaa1111' },
    expectedSignatures: { frontier: 'aaaa1111' },
    currentTotalAbsDelta: { frontier: 12 },
    expectedTotalAbsDelta: { frontier: 0 },
    results: [
      {
        scenarioId: 'frontier',
        currentSignature: 'aaaa1111',
        expectedSignature: 'aaaa1111',
        changed: false,
        message: null,
      },
    ],
    intensityResults: [
      {
        scenarioId: 'frontier',
        currentTotalAbsDeltaPercent: 12,
        expectedTotalAbsDeltaPercent: 0,
        changed: true,
        message: 'expected 0 but got 12',
      },
    ],
    snippets: {
      scenarioTuningBaseline:
        'export const EXPECTED_SCENARIO_TUNING_SIGNATURES = {"frontier":"aaaa1111"};\n',
      scenarioTuningTotalAbsDeltaBaseline:
        'export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = {"frontier":12};\n',
    },
  });
}

test('check-scenario-tuning-baseline allows intensity drift when strict mode is off', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'check-tuning-baseline-'));
  const payloadPath = path.join(tempDirectory, 'scenario-tuning-baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');

  try {
    await writeFile(payloadPath, JSON.stringify(buildIntensityOnlyDriftPayload(), null, 2), 'utf-8');
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
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('check-scenario-tuning-baseline fails on intensity drift when strict mode is on', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'check-tuning-baseline-'));
  const payloadPath = path.join(tempDirectory, 'scenario-tuning-baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');

  try {
    await writeFile(payloadPath, JSON.stringify(buildIntensityOnlyDriftPayload(), null, 2), 'utf-8');

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
        error.stderr.includes('"code":"scenario-tuning-intensity-drift-strict"'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
