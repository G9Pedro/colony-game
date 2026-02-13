import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import { buildScenarioTuningIntensityOnlyDriftPayload } from '../scripts/reportDiagnosticsFixtures.js';
import {
  assertOutputDiagnosticsContract,
  assertOutputHasDiagnostic,
  assertOutputHasReadFailureDiagnosticContract,
} from './helpers/reportDiagnosticsTestUtils.js';
import {
  assertNodeDiagnosticsScriptRejects,
  runNodeDiagnosticsScript,
} from './helpers/reportDiagnosticsScriptTestUtils.js';

test('check-scenario-tuning-baseline allows intensity drift when strict mode is off', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'check-tuning-baseline-'));
  const payloadPath = path.join(tempDirectory, 'scenario-tuning-baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');
  const runId = 'tuning-baseline-check-intensity-warn-run';

  try {
    await writeFile(
      payloadPath,
      JSON.stringify(buildScenarioTuningIntensityOnlyDriftPayload(), null, 2),
      'utf-8',
    );
    const { stdout, stderr } = await runNodeDiagnosticsScript(scriptPath, {
      env: {
        SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH: payloadPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
    });
    assertOutputDiagnosticsContract({
      stdout,
      stderr,
      expectedScript: 'simulate:check:tuning-baseline',
      expectedRunId: runId,
      expectedCodes: [
        REPORT_DIAGNOSTIC_CODES.scenarioTuningBaselineSummary,
        REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDrift,
        REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityEnforcementTip,
      ],
    });
    const intensityDiagnostic = assertOutputHasDiagnostic({
      stdout,
      stderr,
      diagnosticCode: REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDrift,
      expectedScript: 'simulate:check:tuning-baseline',
      expectedRunId: runId,
      expectedLevel: 'warn',
    });
    assert.equal(intensityDiagnostic.context?.strictIntensity, false);
    assert.equal(intensityDiagnostic.context?.changedTotalAbsDelta, 1);
    const tipDiagnostic = assertOutputHasDiagnostic({
      stdout,
      stderr,
      diagnosticCode: REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityEnforcementTip,
      expectedScript: 'simulate:check:tuning-baseline',
      expectedRunId: runId,
      expectedLevel: 'warn',
    });
    assert.equal(typeof tipDiagnostic.context?.command, 'string');
    assert.match(tipDiagnostic.context.command, /SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1/);
    assert.ok(stderr.includes('SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1'));
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('check-scenario-tuning-baseline fails on intensity drift when strict mode is on', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'check-tuning-baseline-'));
  const payloadPath = path.join(tempDirectory, 'scenario-tuning-baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');
  const runId = 'tuning-baseline-check-intensity-strict-run';

  try {
    await writeFile(
      payloadPath,
      JSON.stringify(buildScenarioTuningIntensityOnlyDriftPayload(), null, 2),
      'utf-8',
    );

    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      env: {
        SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH: payloadPath,
        SIM_SCENARIO_TUNING_ENFORCE_INTENSITY: '1',
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      assertion: (error) => {
        assert.equal(error.code, 1);
        assert.ok(error.stderr.includes('strict enforcement enabled'));
        assertOutputDiagnosticsContract({
          stdout: error.stdout,
          stderr: error.stderr,
          expectedScript: 'simulate:check:tuning-baseline',
          expectedRunId: runId,
          expectedCodes: [
            REPORT_DIAGNOSTIC_CODES.scenarioTuningBaselineSummary,
            REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDrift,
            REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDriftStrict,
          ],
        });
        const strictDiagnostic = assertOutputHasDiagnostic({
          stdout: error.stdout,
          stderr: error.stderr,
          diagnosticCode: REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDriftStrict,
          expectedScript: 'simulate:check:tuning-baseline',
          expectedRunId: runId,
          expectedLevel: 'error',
        });
        assert.equal(strictDiagnostic.context?.changedTotalAbsDelta, 1);
        return true;
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('check-scenario-tuning-baseline emits read-error diagnostic for unreadable cache path', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'check-tuning-baseline-'));
  const scriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');
  const runId = 'tuning-baseline-check-read-error-run';

  try {
    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      env: {
        SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH: tempDirectory,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      assertion: (error) => {
        assert.equal(error.code, 1);
        assert.ok(error.stderr.includes('Unable to read scenario tuning baseline cache payload'));
        assertOutputHasReadFailureDiagnosticContract({
          stdout: error.stdout,
          stderr: error.stderr,
          expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactReadError],
          diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactReadError,
          expectedScript: 'simulate:check:tuning-baseline',
          expectedRunId: runId,
          expectedPath: tempDirectory,
          expectedStatus: 'error',
          expectedErrorCode: 'EISDIR',
        });
        return true;
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
