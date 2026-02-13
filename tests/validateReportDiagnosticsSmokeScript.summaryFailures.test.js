import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import {
  buildSmokeArtifactPath,
  createFailingSummary,
  writeSmokeSummaryArtifact,
  writeSmokeSummaryTextArtifact,
} from './helpers/validateReportDiagnosticsSmokeTestUtils.js';
import {
  assertValidateSmokeRejectsWithDiagnostic,
  assertValidateSmokeRejectsWithReadFailureScenario,
  runValidateReportDiagnosticsSmoke,
} from './helpers/validateReportDiagnosticsSmokeAssertions.js';
import {
  buildMissingArtifactPath,
  createUnreadableArtifactPath,
} from './helpers/reportReadFailureFixtures.js';

test('validate-report-diagnostics-smoke fails when report payload is invalid', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = buildSmokeArtifactPath({
    rootDirectory: tempDirectory,
    filename: 'report-diagnostics-smoke.json',
  });

  try {
    await writeSmokeSummaryArtifact({
      rootDirectory: tempDirectory,
      summary: { type: 'bad-payload' },
    });

    await assert.rejects(
      () =>
        runValidateReportDiagnosticsSmoke({
          REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        }),
      (error) => error.code === 1 && error.stderr.includes('failed contract validation'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails when report indicates failed scenarios', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = buildSmokeArtifactPath({
    rootDirectory: tempDirectory,
    filename: 'report-diagnostics-smoke.json',
  });

  try {
    await writeSmokeSummaryArtifact({
      rootDirectory: tempDirectory,
      summary: createFailingSummary(),
    });

    await assert.rejects(
      () =>
        runValidateReportDiagnosticsSmoke({
          REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        }),
      (error) => error.code === 1 && error.stderr.includes('failed scenario'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits failed-scenarios diagnostic when json diagnostics are enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = buildSmokeArtifactPath({
    rootDirectory: tempDirectory,
    filename: 'report-diagnostics-smoke.json',
  });
  const runId = 'validate-smoke-json-failure-run';

  try {
    await writeSmokeSummaryArtifact({
      rootDirectory: tempDirectory,
      summary: createFailingSummary(),
    });

    await assertValidateSmokeRejectsWithDiagnostic({
      envOverrides: {
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      diagnosticCode: REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeFailedScenarios,
      expectedRunId: runId,
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails when report file is missing', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = buildMissingArtifactPath({
    rootDirectory: tempDirectory,
    relativePath: 'missing-report-diagnostics-smoke.json',
  });

  try {
    await assert.rejects(
      () =>
        runValidateReportDiagnosticsSmoke({
          REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        }),
      (error) => error.code === 1 && error.stderr.includes('Missing diagnostics smoke report'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits artifact-missing diagnostic for missing summary when diagnostics are enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = buildMissingArtifactPath({
    rootDirectory: tempDirectory,
    relativePath: 'missing-report-diagnostics-smoke.json',
  });
  const runId = 'validate-smoke-json-missing-summary-run';

  try {
    await assertValidateSmokeRejectsWithReadFailureScenario({
      envOverrides: {
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      scenario: 'missing',
      expectedRunId: runId,
      expectedPath: reportPath,
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails on invalid json report payload', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = buildSmokeArtifactPath({
    rootDirectory: tempDirectory,
    filename: 'report-diagnostics-smoke.json',
  });

  try {
    await writeSmokeSummaryTextArtifact({
      rootDirectory: tempDirectory,
      contents: '{"broken": ',
    });
    await assert.rejects(
      () =>
        runValidateReportDiagnosticsSmoke({
          REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        }),
      (error) => error.code === 1 && error.stderr.includes('is not valid JSON'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits invalid-json diagnostic for invalid summary json when diagnostics are enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = buildSmokeArtifactPath({
    rootDirectory: tempDirectory,
    filename: 'report-diagnostics-smoke.json',
  });
  const runId = 'validate-smoke-json-invalid-summary-run';

  try {
    await writeSmokeSummaryTextArtifact({
      rootDirectory: tempDirectory,
      contents: '{"broken": ',
    });

    await assertValidateSmokeRejectsWithReadFailureScenario({
      envOverrides: {
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      scenario: 'invalidJson',
      expectedRunId: runId,
      expectedPath: reportPath,
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails on unreadable path errors', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportDirectoryPath = path.join(tempDirectory, 'report-diagnostics-smoke-as-directory');

  try {
    await createUnreadableArtifactPath({
      rootDirectory: tempDirectory,
      relativePath: 'report-diagnostics-smoke-as-directory',
    });
    await assert.rejects(
      () =>
        runValidateReportDiagnosticsSmoke({
          REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportDirectoryPath,
        }),
      (error) =>
        error.code === 1 && error.stderr.includes('Unable to read diagnostics smoke report'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits read-error diagnostic for unreadable summary path when diagnostics are enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportDirectoryPath = path.join(tempDirectory, 'report-diagnostics-smoke-as-directory');
  const runId = 'validate-smoke-json-unreadable-summary-run';

  try {
    await createUnreadableArtifactPath({
      rootDirectory: tempDirectory,
      relativePath: 'report-diagnostics-smoke-as-directory',
    });
    await assertValidateSmokeRejectsWithReadFailureScenario({
      envOverrides: {
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportDirectoryPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      scenario: 'unreadable',
      expectedRunId: runId,
      expectedPath: reportDirectoryPath,
      expectedStatus: 'error',
      expectedErrorCode: 'EISDIR',
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
