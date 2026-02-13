import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import {
  createPassingSummary,
} from './helpers/validateReportDiagnosticsSmokeTestUtils.js';
import {
  assertValidateSmokeRejectsWithDiagnostic,
  runValidateReportDiagnosticsSmoke,
} from './helpers/validateReportDiagnosticsSmokeAssertions.js';

test('validate-report-diagnostics-smoke fails when markdown artifact is missing', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const markdownPath = path.join(tempDirectory, 'missing-report-diagnostics-smoke.md');

  try {
    const summary = createPassingSummary();
    await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');

    await assert.rejects(
      () =>
        runValidateReportDiagnosticsSmoke({
          REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
          REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
        }),
      (error) => error.code === 1 && error.stderr.includes('Missing diagnostics smoke markdown report'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits artifact-missing diagnostic for missing markdown when json diagnostics are enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const markdownPath = path.join(tempDirectory, 'missing-report-diagnostics-smoke.md');
  const runId = 'validate-smoke-json-missing-markdown-run';

  try {
    const summary = createPassingSummary();
    await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');

    await assertValidateSmokeRejectsWithDiagnostic({
      envOverrides: {
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactMissing,
      expectedRunId: runId,
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails when markdown artifact is invalid', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const markdownPath = path.join(tempDirectory, 'report-diagnostics-smoke.md');

  try {
    const summary = createPassingSummary();
    await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');
    await writeFile(markdownPath, '# Broken markdown payload', 'utf-8');

    await assert.rejects(
      () =>
        runValidateReportDiagnosticsSmoke({
          REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
          REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
        }),
      (error) =>
        error.code === 1 && error.stderr.includes('failed validation against summary payload'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits invalid-payload diagnostic for invalid markdown when json diagnostics are enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const markdownPath = path.join(tempDirectory, 'report-diagnostics-smoke.md');
  const runId = 'validate-smoke-json-invalid-markdown-run';

  try {
    const summary = createPassingSummary();
    await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');
    await writeFile(markdownPath, '# Broken markdown payload', 'utf-8');

    await assertValidateSmokeRejectsWithDiagnostic({
      envOverrides: {
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactInvalidPayload,
      expectedRunId: runId,
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
