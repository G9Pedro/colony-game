import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  REPORT_DIAGNOSTIC_CODES,
} from '../scripts/reportDiagnostics.js';
import {
  assertNodeDiagnosticsScriptReadFailureScenario,
  getReportReadFailureScenarioContract,
} from './helpers/reportReadFailureMatrixTestUtils.js';
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
