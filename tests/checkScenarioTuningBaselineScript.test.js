import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import { buildScenarioTuningIntensityOnlyDriftPayload } from '../scripts/reportDiagnosticsFixtures.js';
import {
  assertOutputDiagnosticsContract,
  assertOutputHasDiagnostic,
} from './helpers/reportDiagnosticsTestUtils.js';
import {
  assertNodeDiagnosticsScriptRejects,
  runNodeDiagnosticsScript,
} from './helpers/reportDiagnosticsScriptTestUtils.js';
import { assertNodeDiagnosticsScriptReadFailureScenario } from './helpers/reportReadFailureMatrixTestUtils.js';
import {
  createJsonArtifact,
  createUnreadableArtifactPath,
} from './helpers/reportReadFailureFixtures.js';

test('check-scenario-tuning-baseline allows intensity drift when strict mode is off', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'check-tuning-baseline-'));
  const payloadPath = path.join(tempDirectory, 'scenario-tuning-baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');
  const runId = 'tuning-baseline-check-intensity-warn-run';

  try {
    await createJsonArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'scenario-tuning-baseline-suggestions.json',
      payload: buildScenarioTuningIntensityOnlyDriftPayload(),
    });
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
    await createJsonArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'scenario-tuning-baseline-suggestions.json',
      payload: buildScenarioTuningIntensityOnlyDriftPayload(),
    });

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
  const unreadableCachePath = path.join(tempDirectory, 'scenario-tuning-baseline.unreadable.json');
  const scriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');
  const runId = 'tuning-baseline-check-read-error-run';

  try {
    await createUnreadableArtifactPath({
      rootDirectory: tempDirectory,
      relativePath: 'scenario-tuning-baseline.unreadable.json',
    });

    await assertNodeDiagnosticsScriptReadFailureScenario({
      scriptPath,
      scenario: 'unreadable',
      env: {
        SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH: unreadableCachePath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      expectedScript: 'simulate:check:tuning-baseline',
      expectedRunId: runId,
      expectedPath: unreadableCachePath,
      assertDiagnostic: ({ error }) => {
        assert.equal(error.code, 1);
        assert.ok(error.stderr.includes('Unable to read scenario tuning baseline cache payload'));
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
