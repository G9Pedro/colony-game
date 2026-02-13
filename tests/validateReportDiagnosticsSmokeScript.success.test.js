import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import {
  writeValidSmokeArtifacts,
} from './helpers/validateReportDiagnosticsSmokeTestUtils.js';
import {
  runValidateReportDiagnosticsSmoke,
} from './helpers/validateReportDiagnosticsSmokeAssertions.js';
import { assertOutputHasDiagnostic } from './helpers/reportDiagnosticsTestUtils.js';

test('validate-report-diagnostics-smoke passes for valid and passing summary', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));

  try {
    const { reportPath, markdownPath } = await writeValidSmokeArtifacts({
      rootDirectory: tempDirectory,
    });

    const { stdout, stderr } = await runValidateReportDiagnosticsSmoke({
      REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
      REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
    });

    assert.match(stdout, /Diagnostics smoke report is valid and passing/);
    assert.equal(stderr.trim(), '');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits summary diagnostic when json diagnostics are enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const runId = 'validate-smoke-json-success-run';

  try {
    const { reportPath, markdownPath } = await writeValidSmokeArtifacts({
      rootDirectory: tempDirectory,
    });

    const { stdout, stderr } = await runValidateReportDiagnosticsSmoke({
      REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
      REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
      REPORT_DIAGNOSTICS_JSON: '1',
      REPORT_DIAGNOSTICS_RUN_ID: runId,
    });

    assertOutputHasDiagnostic({
      stdout,
      stderr,
      diagnosticCode: REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeValidationSummary,
      expectedScript: 'diagnostics:smoke:validate',
      expectedRunId: runId,
      expectedLevel: 'info',
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke can skip markdown validation when disabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const markdownPath = path.join(tempDirectory, 'missing-report-diagnostics-smoke.md');

  try {
    const { reportPath } = await writeValidSmokeArtifacts({
      rootDirectory: tempDirectory,
      markdownFilename: 'unused-report-diagnostics-smoke.md',
    });

    const { stdout, stderr } = await runValidateReportDiagnosticsSmoke({
      REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
      REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
      REPORT_DIAGNOSTICS_SMOKE_VALIDATE_MARKDOWN: '0',
    });

    assert.match(stdout, /Diagnostics smoke report is valid and passing/);
    assert.equal(stderr.trim(), '');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits summary diagnostic context for markdown-disabled mode', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const markdownPath = path.join(tempDirectory, 'missing-report-diagnostics-smoke.md');
  const runId = 'validate-smoke-json-markdown-disabled-run';

  try {
    const { reportPath } = await writeValidSmokeArtifacts({
      rootDirectory: tempDirectory,
      markdownFilename: 'unused-report-diagnostics-smoke.md',
    });

    const { stdout, stderr } = await runValidateReportDiagnosticsSmoke({
      REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
      REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
      REPORT_DIAGNOSTICS_SMOKE_VALIDATE_MARKDOWN: '0',
      REPORT_DIAGNOSTICS_JSON: '1',
      REPORT_DIAGNOSTICS_RUN_ID: runId,
    });

    const summaryDiagnostic = assertOutputHasDiagnostic({
      stdout,
      stderr,
      diagnosticCode: REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeValidationSummary,
      expectedScript: 'diagnostics:smoke:validate',
      expectedRunId: runId,
      expectedLevel: 'info',
    });
    assert.equal(summaryDiagnostic.context.markdownValidationEnabled, false);
    assert.equal(summaryDiagnostic.context.markdownPath, null);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
