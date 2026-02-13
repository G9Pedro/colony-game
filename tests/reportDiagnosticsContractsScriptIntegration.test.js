import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  REPORT_DIAGNOSTIC_CODES,
} from '../scripts/reportDiagnostics.js';
import {
  buildBaselineSuggestionPayload,
  buildScenarioTuningIntensityOnlyDriftPayload,
} from '../scripts/reportDiagnosticsFixtures.js';
import {
  assertOutputHasReadFailureDiagnosticContract,
  assertOutputDiagnosticsContract,
} from './helpers/reportDiagnosticsTestUtils.js';
import {
  assertNodeDiagnosticsScriptRejects,
  runNodeDiagnosticsScript,
} from './helpers/reportDiagnosticsScriptTestUtils.js';
import {
  createInvalidJsonArtifact,
  createUnreadableArtifactPath,
} from './helpers/reportReadFailureFixtures.js';
const RUN_ID = 'diagnostic-contract-fixture-run';

test('trend script diagnostics follow contract fixture', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-trend-'));
  const outputPath = path.join(tempDirectory, 'scenario-tuning-trend.json');
  const markdownPath = path.join(tempDirectory, 'scenario-tuning-trend.md');
  const baselinePath = path.join(tempDirectory, 'missing-baseline.json');
  const scriptPath = path.resolve('scripts/report-scenario-tuning-trend.js');

  try {
    const { stdout, stderr } = await runNodeDiagnosticsScript(scriptPath, {
      env: {
        SIM_SCENARIO_TUNING_TREND_PATH: outputPath,
        SIM_SCENARIO_TUNING_TREND_MD_PATH: markdownPath,
        SIM_SCENARIO_TUNING_TREND_BASELINE_PATH: baselinePath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
      },
    });

    assertOutputDiagnosticsContract({
      stdout,
      stderr,
      expectedScript: 'simulate:report:tuning:trend',
      expectedRunId: RUN_ID,
      expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactMissing],
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('trend script emits invalid-json diagnostic contract for malformed baseline dashboard', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-trend-invalid-json-'));
  const outputPath = path.join(tempDirectory, 'scenario-tuning-trend.json');
  const markdownPath = path.join(tempDirectory, 'scenario-tuning-trend.md');
  const baselinePath = path.join(tempDirectory, 'scenario-tuning-dashboard.baseline.json');
  const scriptPath = path.resolve('scripts/report-scenario-tuning-trend.js');

  try {
    await createInvalidJsonArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'scenario-tuning-dashboard.baseline.json',
    });
    const { stdout, stderr } = await runNodeDiagnosticsScript(scriptPath, {
      env: {
        SIM_SCENARIO_TUNING_TREND_PATH: outputPath,
        SIM_SCENARIO_TUNING_TREND_MD_PATH: markdownPath,
        SIM_SCENARIO_TUNING_TREND_BASELINE_PATH: baselinePath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
      },
    });

    assertOutputHasReadFailureDiagnosticContract({
      stdout,
      stderr,
      expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactInvalidJson],
      diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactInvalidJson,
      expectedScript: 'simulate:report:tuning:trend',
      expectedRunId: RUN_ID,
      expectedPath: baselinePath,
      expectedStatus: 'invalid-json',
      expectedErrorCode: null,
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('trend script emits read-error diagnostic contract for unreadable baseline path', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-trend-read-error-'));
  const outputPath = path.join(tempDirectory, 'scenario-tuning-trend.json');
  const markdownPath = path.join(tempDirectory, 'scenario-tuning-trend.md');
  const unreadableBaselinePath = path.join(tempDirectory, 'scenario-tuning-dashboard.baseline.unreadable.json');
  const scriptPath = path.resolve('scripts/report-scenario-tuning-trend.js');

  try {
    await createUnreadableArtifactPath({
      rootDirectory: tempDirectory,
      relativePath: 'scenario-tuning-dashboard.baseline.unreadable.json',
    });
    const { stdout, stderr } = await runNodeDiagnosticsScript(scriptPath, {
      env: {
        SIM_SCENARIO_TUNING_TREND_PATH: outputPath,
        SIM_SCENARIO_TUNING_TREND_MD_PATH: markdownPath,
        SIM_SCENARIO_TUNING_TREND_BASELINE_PATH: unreadableBaselinePath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
      },
    });

    assertOutputHasReadFailureDiagnosticContract({
      stdout,
      stderr,
      expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactReadError],
      diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactReadError,
      expectedScript: 'simulate:report:tuning:trend',
      expectedRunId: RUN_ID,
      expectedPath: unreadableBaselinePath,
      expectedStatus: 'error',
      expectedErrorCode: 'EISDIR',
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-artifacts diagnostics follow contract fixture', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-artifacts-'));
  const scriptPath = path.resolve('scripts/validate-report-artifacts.js');

  try {
    await createInvalidJsonArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'reports/scenario-tuning-dashboard.json',
    });

    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      cwd: tempDirectory,
      env: {
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
      },
      assertion: (error) => {
        assertOutputDiagnosticsContract({
          stdout: error.stdout,
          stderr: error.stderr,
          expectedScript: 'reports:validate',
          expectedRunId: RUN_ID,
          expectedCodes: [
            REPORT_DIAGNOSTIC_CODES.artifactInvalidJson,
            REPORT_DIAGNOSTIC_CODES.artifactReadError,
          ],
        });
        return true;
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-artifacts emits read-error diagnostics for unreadable report artifact path', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-artifacts-read-error-'));
  const scriptPath = path.resolve('scripts/validate-report-artifacts.js');

  try {
    await createUnreadableArtifactPath({
      rootDirectory: tempDirectory,
      relativePath: 'reports/scenario-tuning-dashboard.json',
    });

    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      cwd: tempDirectory,
      env: {
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
      },
      assertion: (error) => {
        assertOutputHasReadFailureDiagnosticContract({
          stdout: error.stdout,
          stderr: error.stderr,
          expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactReadError],
          diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactReadError,
          expectedScript: 'reports:validate',
          expectedRunId: RUN_ID,
          expectedPath: 'reports/scenario-tuning-dashboard.json',
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

test('scenario tuning baseline check diagnostics follow contract fixture', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-tuning-check-'));
  const payloadPath = path.join(tempDirectory, 'scenario-tuning-baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');

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
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
      },
    });

    assertOutputDiagnosticsContract({
      stdout,
      stderr,
      expectedScript: 'simulate:check:tuning-baseline',
      expectedRunId: RUN_ID,
      expectedCodes: [
        REPORT_DIAGNOSTIC_CODES.scenarioTuningBaselineSummary,
        REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDrift,
        REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityEnforcementTip,
      ],
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('baseline suggestion check diagnostics follow contract fixture', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-baseline-check-'));
  const payloadPath = path.join(tempDirectory, 'baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/suggest-baselines-check.js');

  try {
    await writeFile(
      payloadPath,
      JSON.stringify(buildBaselineSuggestionPayload({ changed: true }), null, 2),
      'utf-8',
    );

    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      env: {
        SIM_BASELINE_SUGGEST_PATH: payloadPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
      },
      assertion: (error) => {
        assertOutputDiagnosticsContract({
          stdout: error.stdout,
          stderr: error.stderr,
          expectedScript: 'simulate:baseline:check',
          expectedRunId: RUN_ID,
          expectedCodes: [
            REPORT_DIAGNOSTIC_CODES.baselineSuggestionSummary,
            REPORT_DIAGNOSTIC_CODES.baselineSignatureDrift,
          ],
        });
        return true;
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('baseline suggestion check emits read-error diagnostics for unreadable cache path', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-baseline-read-error-'));
  const unreadableCachePath = path.join(tempDirectory, 'baseline-suggestions.unreadable.json');
  const scriptPath = path.resolve('scripts/suggest-baselines-check.js');

  try {
    await createUnreadableArtifactPath({
      rootDirectory: tempDirectory,
      relativePath: 'baseline-suggestions.unreadable.json',
    });

    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      env: {
        SIM_BASELINE_SUGGEST_PATH: unreadableCachePath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
      },
      assertion: (error) => {
        assertOutputHasReadFailureDiagnosticContract({
          stdout: error.stdout,
          stderr: error.stderr,
          expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactReadError],
          diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactReadError,
          expectedScript: 'simulate:baseline:check',
          expectedRunId: RUN_ID,
          expectedPath: unreadableCachePath,
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

test('diagnostics smoke script diagnostics follow contract fixture', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-smoke-run-'));
  const outputPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const markdownOutputPath = path.join(tempDirectory, 'report-diagnostics-smoke.md');
  const scriptPath = path.resolve('scripts/report-diagnostics-smoke.js');

  try {
    const { stdout, stderr } = await runNodeDiagnosticsScript(scriptPath, {
      env: {
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: outputPath,
        REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownOutputPath,
      },
    });
    assertOutputDiagnosticsContract({
      stdout,
      stderr,
      expectedScript: 'diagnostics:smoke',
      expectedRunId: RUN_ID,
      expectedCodes: [REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeRunSummary],
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('scenario tuning baseline check emits read-error diagnostics for unreadable cache path', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-tuning-read-error-'));
  const unreadableCachePath = path.join(
    tempDirectory,
    'scenario-tuning-baseline-suggestions.unreadable.json',
  );
  const scriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');

  try {
    await createUnreadableArtifactPath({
      rootDirectory: tempDirectory,
      relativePath: 'scenario-tuning-baseline-suggestions.unreadable.json',
    });

    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      env: {
        SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH: unreadableCachePath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
      },
      assertion: (error) => {
        assertOutputHasReadFailureDiagnosticContract({
          stdout: error.stdout,
          stderr: error.stderr,
          expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactReadError],
          diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactReadError,
          expectedScript: 'simulate:check:tuning-baseline',
          expectedRunId: RUN_ID,
          expectedPath: unreadableCachePath,
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
