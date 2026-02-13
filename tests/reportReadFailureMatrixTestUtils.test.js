import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { READ_ARTIFACT_DIAGNOSTIC_CODES } from '../scripts/reportPayloadInput.js';
import {
  REPORT_READ_FAILURE_SCENARIOS,
  assertOutputHasReadFailureScenarioContract,
  assertReadFailureDiagnosticMatchesScenario,
  assertNodeDiagnosticsScriptOutputsReadFailureScenario,
  assertNodeDiagnosticsScriptReadFailureScenario,
  getReportReadFailureScenarioFromDiagnosticCode,
  getReportReadFailureScenarioContract,
} from './helpers/reportReadFailureMatrixTestUtils.js';
import { runNodeDiagnosticsScript } from './helpers/reportDiagnosticsScriptTestUtils.js';
import { buildMissingArtifactPath } from './helpers/reportReadFailureFixtures.js';

test('REPORT_READ_FAILURE_SCENARIOS exposes stable scenario keys', () => {
  assert.deepEqual(REPORT_READ_FAILURE_SCENARIOS, {
    missing: 'missing',
    invalidJson: 'invalidJson',
    invalidPayload: 'invalidPayload',
    unreadable: 'unreadable',
  });
});

test('getReportReadFailureScenarioContract returns stable contracts per scenario', () => {
  assert.deepEqual(getReportReadFailureScenarioContract(REPORT_READ_FAILURE_SCENARIOS.missing), {
    diagnosticCode: READ_ARTIFACT_DIAGNOSTIC_CODES.missing,
    status: 'missing',
    errorCode: 'ENOENT',
  });
  assert.deepEqual(getReportReadFailureScenarioContract(REPORT_READ_FAILURE_SCENARIOS.invalidJson), {
    diagnosticCode: READ_ARTIFACT_DIAGNOSTIC_CODES.invalidJson,
    status: 'invalid-json',
    errorCode: null,
  });
  assert.deepEqual(
    getReportReadFailureScenarioContract(REPORT_READ_FAILURE_SCENARIOS.invalidPayload),
    {
      diagnosticCode: READ_ARTIFACT_DIAGNOSTIC_CODES.invalidPayload,
      status: 'invalid',
      errorCode: null,
    },
  );
  assert.deepEqual(
    getReportReadFailureScenarioContract(REPORT_READ_FAILURE_SCENARIOS.unreadable),
    {
      diagnosticCode: READ_ARTIFACT_DIAGNOSTIC_CODES.readError,
      status: 'error',
      errorCode: 'EISDIR',
    },
  );
});

test('getReportReadFailureScenarioContract throws for unknown scenarios', () => {
  assert.throws(
    () => getReportReadFailureScenarioContract('other'),
    /Unknown read-failure scenario "other"/,
  );
});

test('getReportReadFailureScenarioFromDiagnosticCode resolves scenario identifiers', () => {
  assert.equal(
    getReportReadFailureScenarioFromDiagnosticCode(READ_ARTIFACT_DIAGNOSTIC_CODES.missing),
    REPORT_READ_FAILURE_SCENARIOS.missing,
  );
  assert.equal(
    getReportReadFailureScenarioFromDiagnosticCode(READ_ARTIFACT_DIAGNOSTIC_CODES.invalidJson),
    REPORT_READ_FAILURE_SCENARIOS.invalidJson,
  );
  assert.equal(
    getReportReadFailureScenarioFromDiagnosticCode(READ_ARTIFACT_DIAGNOSTIC_CODES.invalidPayload),
    REPORT_READ_FAILURE_SCENARIOS.invalidPayload,
  );
  assert.equal(
    getReportReadFailureScenarioFromDiagnosticCode(READ_ARTIFACT_DIAGNOSTIC_CODES.readError),
    REPORT_READ_FAILURE_SCENARIOS.unreadable,
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
      scenario: REPORT_READ_FAILURE_SCENARIOS.missing,
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
      diagnosticCode: READ_ARTIFACT_DIAGNOSTIC_CODES.missing,
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
          scenario: REPORT_READ_FAILURE_SCENARIOS.missing,
          expectedScript: 'diagnostics:smoke:validate',
          expectedRunId: runId,
          expectedPath: missingOutputPath,
        });
        assert.equal(diagnostic.code, READ_ARTIFACT_DIAGNOSTIC_CODES.missing);
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
      scenario: REPORT_READ_FAILURE_SCENARIOS.missing,
      expectedScript: 'simulate:report:tuning:trend',
      expectedRunId: runId,
      expectedLevel: 'info',
      expectedPath: missingBaselinePath,
    });

    assert.equal(diagnostic.code, READ_ARTIFACT_DIAGNOSTIC_CODES.missing);
    assert.equal(diagnostic.context?.baselinePath, missingBaselinePath);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('assertReadFailureDiagnosticMatchesScenario validates direct diagnostic payloads', () => {
  const diagnostic = {
    code: READ_ARTIFACT_DIAGNOSTIC_CODES.invalidPayload,
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
    scenario: REPORT_READ_FAILURE_SCENARIOS.invalidPayload,
    expectedLevel: 'error',
    expectedPath: 'reports/example.json',
  });

  assert.equal(observed, diagnostic);
});
