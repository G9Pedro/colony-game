import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import {
  assertValidateSmokeRejectsWithDiagnostic,
} from './helpers/validateReportDiagnosticsSmokeAssertions.js';
import {
  buildMissingArtifactPath,
} from './helpers/reportReadFailureFixtures.js';
import {
  createFailingSummary,
  writeSmokeSummaryArtifact,
} from './helpers/validateReportDiagnosticsSmokeTestUtils.js';

test('assertValidateSmokeRejectsWithDiagnostic validates read-failure diagnostic contracts', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-assertions-'));
  const missingReportPath = buildMissingArtifactPath({
    rootDirectory: tempDirectory,
    relativePath: 'missing-report-diagnostics-smoke.json',
  });
  const runId = 'validate-smoke-assertions-missing-summary-run';

  try {
    await assertValidateSmokeRejectsWithDiagnostic({
      envOverrides: {
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: missingReportPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactMissing,
      expectedRunId: runId,
      expectedLevel: 'error',
      expectedPath: missingReportPath,
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('assertValidateSmokeRejectsWithDiagnostic validates non-read diagnostic level and run id', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-assertions-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const runId = 'validate-smoke-assertions-failed-scenarios-run';

  try {
    await writeSmokeSummaryArtifact({
      rootDirectory: tempDirectory,
      summary: createFailingSummary(),
    });

    await assertValidateSmokeRejectsWithDiagnostic({
      envOverrides: {
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        REPORT_DIAGNOSTICS_SMOKE_VALIDATE_MARKDOWN: '0',
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      diagnosticCode: REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeFailedScenarios,
      expectedRunId: runId,
      expectedLevel: 'error',
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
