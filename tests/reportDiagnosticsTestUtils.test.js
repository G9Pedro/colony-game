import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REPORT_DIAGNOSTIC_CODES,
  buildReportDiagnostic,
} from '../scripts/reportDiagnostics.js';
import {
  assertOutputHasDiagnostic,
  assertOutputHasReadFailureDiagnostic,
} from './helpers/reportDiagnosticsTestUtils.js';

test('assertOutputHasReadFailureDiagnostic prefers matching diagnostic path when code repeats', () => {
  const diagnostics = [
    buildReportDiagnostic({
      level: 'error',
      code: REPORT_DIAGNOSTIC_CODES.artifactReadError,
      message: 'First read failure.',
      script: 'reports:validate',
      context: {
        path: 'reports/baseline-suggestions.json',
        status: 'error',
        reason: 'EISDIR',
        errorCode: 'EISDIR',
      },
    }),
    buildReportDiagnostic({
      level: 'error',
      code: REPORT_DIAGNOSTIC_CODES.artifactReadError,
      message: 'Second read failure.',
      script: 'reports:validate',
      context: {
        path: 'reports/scenario-tuning-dashboard.json',
        status: 'error',
        reason: 'EISDIR',
        errorCode: 'EISDIR',
      },
    }),
  ];
  const stdout = diagnostics.map((entry) => JSON.stringify(entry)).join('\n');

  const diagnostic = assertOutputHasReadFailureDiagnostic({
    stdout,
    diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactReadError,
    expectedScript: 'reports:validate',
    expectedPath: 'reports/scenario-tuning-dashboard.json',
    expectedStatus: 'error',
    expectedErrorCode: 'EISDIR',
  });

  assert.equal(diagnostic.context?.path, 'reports/scenario-tuning-dashboard.json');
  assert.equal(diagnostic.message, 'Second read failure.');
});

test('assertOutputHasDiagnostic asserts script runId and level', () => {
  const stdout = JSON.stringify(
    buildReportDiagnostic({
      level: 'warn',
      code: REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDrift,
      message: 'Intensity drift detected.',
      script: 'simulate:check:tuning-baseline',
      runId: 'run-42',
      context: {
        changedTotalAbsDelta: 1,
        strictIntensity: false,
        source: 'file',
      },
    }),
  );

  const diagnostic = assertOutputHasDiagnostic({
    stdout,
    diagnosticCode: REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDrift,
    expectedScript: 'simulate:check:tuning-baseline',
    expectedRunId: 'run-42',
    expectedLevel: 'warn',
  });

  assert.equal(diagnostic.context?.changedTotalAbsDelta, 1);
  assert.equal(diagnostic.context?.strictIntensity, false);
});
