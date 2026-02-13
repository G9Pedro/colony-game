import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  REPORT_DIAGNOSTIC_CODES,
} from '../scripts/reportDiagnostics.js';
import {
  assertOutputHasReadFailureScenarioContract,
  assertReadFailureDiagnosticMatchesScenario,
  assertNodeDiagnosticsScriptOutputsReadFailureScenario,
  assertNodeDiagnosticsScriptReadFailureScenario,
  getReportReadFailureScenarioFromDiagnosticCode,
  getReportReadFailureScenarioContract,
} from './helpers/reportReadFailureMatrixTestUtils.js';
import { runNodeDiagnosticsScript } from './helpers/reportDiagnosticsScriptTestUtils.js';
import { buildMissingArtifactPath } from './helpers/reportReadFailureFixtures.js';

test('getReportReadFailureScenarioContract returns stable contracts per scenario', () => {
  assert.deepEqual(getReportReadFailureScenarioContract('missing'), {
    diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactMissing,
    status: 'missing',
    errorCode: 'ENOENT',
  });
  assert.deepEqual(getReportReadFailureScenarioContract('invalidJson'), {
    diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactInvalidJson,
    status: 'invalid-json',
    errorCode: null,
  });
  assert.deepEqual(getReportReadFailureScenarioContract('invalidPayload'), {
    diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactInvalidPayload,
    status: 'invalid',
    errorCode: null,
  });
  assert.deepEqual(getReportReadFailureScenarioContract('unreadable'), {
    diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactReadError,
    status: 'error',
    errorCode: 'EISDIR',
  });
});

test('getReportReadFailureScenarioContract throws for unknown scenarios', () => {
  assert.throws(
    () => getReportReadFailureScenarioContract('other'),
    /Unknown read-failure scenario "other"/,
  );
});

test('getReportReadFailureScenarioFromDiagnosticCode resolves scenario identifiers', () => {
  assert.equal(
    getReportReadFailureScenarioFromDiagnosticCode(REPORT_DIAGNOSTIC_CODES.artifactMissing),
    'missing',
  );
  assert.equal(
    getReportReadFailureScenarioFromDiagnosticCode(REPORT_DIAGNOSTIC_CODES.artifactInvalidJson),
    'invalidJson',
  );
  assert.equal(
    getReportReadFailureScenarioFromDiagnosticCode(REPORT_DIAGNOSTIC_CODES.artifactInvalidPayload),
    'invalidPayload',
  );
  assert.equal(
    getReportReadFailureScenarioFromDiagnosticCode(REPORT_DIAGNOSTIC_CODES.artifactReadError),
    'unreadable',
  );
});

test('getReportReadFailureScenarioFromDiagnosticCode throws for unknown codes', () => {
  assert.throws(
    () => getReportReadFailureScenarioFromDiagnosticCode('other-code'),
    /Unknown read-failure diagnostic code "other-code"/,
  );
});

test('assertNodeDiagnosticsScriptReadFailureScenario asserts missing artifact contracts', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'read-failure-matrix-'));
  const runId = 'read-failure-matrix-missing-run';
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');
  const missingOutputPath = buildMissingArtifactPath({
    rootDirectory: tempDirectory,
    relativePath: 'missing-report-diagnostics-smoke.json',
  });
  let observedContract = null;

  try {
    await assertNodeDiagnosticsScriptReadFailureScenario({
      scriptPath,
      scenario: 'missing',
      env: {
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: missingOutputPath,
      },
      expectedScript: 'diagnostics:smoke:validate',
      expectedRunId: runId,
      expectedPath: missingOutputPath,
      assertDiagnostic: ({ scenarioContract }) => {
        observedContract = scenarioContract;
      },
    });

    assert.deepEqual(observedContract, {
      diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactMissing,
      status: 'missing',
      errorCode: 'ENOENT',
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('assertOutputHasReadFailureScenarioContract validates read-failure output by scenario', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'read-failure-matrix-output-'));
  const runId = 'read-failure-matrix-output-run';
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');
  const missingOutputPath = buildMissingArtifactPath({
    rootDirectory: tempDirectory,
    relativePath: 'missing-report-diagnostics-smoke.json',
  });

  try {
    await assert.rejects(
      () =>
        runNodeDiagnosticsScript(scriptPath, {
          env: {
            REPORT_DIAGNOSTICS_JSON: '1',
            REPORT_DIAGNOSTICS_RUN_ID: runId,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: missingOutputPath,
          },
        }),
      (error) => {
        const diagnostic = assertOutputHasReadFailureScenarioContract({
          stdout: error.stdout,
          stderr: error.stderr,
          scenario: 'missing',
          expectedScript: 'diagnostics:smoke:validate',
          expectedRunId: runId,
          expectedPath: missingOutputPath,
        });
        assert.equal(diagnostic.code, REPORT_DIAGNOSTIC_CODES.artifactMissing);
        return true;
      },
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('assertNodeDiagnosticsScriptOutputsReadFailureScenario validates non-rejecting script diagnostics', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'read-failure-matrix-output-script-'));
  const runId = 'read-failure-matrix-output-script-run';
  const scriptPath = path.resolve('scripts/report-scenario-tuning-trend.js');
  const outputPath = path.join(tempDirectory, 'scenario-tuning-trend.json');
  const markdownPath = path.join(tempDirectory, 'scenario-tuning-trend.md');
  const missingBaselinePath = buildMissingArtifactPath({
    rootDirectory: tempDirectory,
    relativePath: 'missing-baseline-dashboard.json',
  });

  try {
    const { diagnostic } = await assertNodeDiagnosticsScriptOutputsReadFailureScenario({
      scriptPath,
      env: {
        SIM_SCENARIO_TUNING_TREND_PATH: outputPath,
        SIM_SCENARIO_TUNING_TREND_MD_PATH: markdownPath,
        SIM_SCENARIO_TUNING_TREND_BASELINE_PATH: missingBaselinePath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      scenario: 'missing',
      expectedScript: 'simulate:report:tuning:trend',
      expectedRunId: runId,
      expectedLevel: 'info',
      expectedPath: missingBaselinePath,
    });

    assert.equal(diagnostic.code, REPORT_DIAGNOSTIC_CODES.artifactMissing);
    assert.equal(diagnostic.context?.baselinePath, missingBaselinePath);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('assertReadFailureDiagnosticMatchesScenario validates direct diagnostic payloads', () => {
  const diagnostic = {
    code: REPORT_DIAGNOSTIC_CODES.artifactInvalidPayload,
    level: 'error',
    context: {
      path: 'reports/example.json',
      status: 'invalid',
      reason: 'failed validation',
      errorCode: null,
    },
  };

  const observed = assertReadFailureDiagnosticMatchesScenario({
    diagnostic,
    scenario: 'invalidPayload',
    expectedLevel: 'error',
    expectedPath: 'reports/example.json',
  });

  assert.equal(observed, diagnostic);
});
