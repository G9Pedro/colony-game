import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import { collectReportDiagnostics } from './helpers/reportDiagnosticsTestUtils.js';
import {
  VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH,
  writeValidSmokeArtifacts,
} from './helpers/validateReportDiagnosticsSmokeTestUtils.js';

const execFileAsync = promisify(execFile);

test('validate-report-diagnostics-smoke passes for valid and passing summary', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const markdownPath = path.join(tempDirectory, 'report-diagnostics-smoke.md');

  try {
    await writeValidSmokeArtifacts({ reportPath, markdownPath });

    const { stdout, stderr } = await execFileAsync(process.execPath, [VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH], {
      env: {
        ...process.env,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
      },
    });

    assert.match(stdout, /Diagnostics smoke report is valid and passing/);
    assert.equal(stderr.trim(), '');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits summary diagnostic when json diagnostics are enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const markdownPath = path.join(tempDirectory, 'report-diagnostics-smoke.md');
  const runId = 'validate-smoke-json-success-run';

  try {
    await writeValidSmokeArtifacts({ reportPath, markdownPath });

    const { stdout, stderr } = await execFileAsync(process.execPath, [VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH], {
      env: {
        ...process.env,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
    });

    const diagnostics = collectReportDiagnostics(stdout, stderr);
    const summaryDiagnostic = diagnostics.find(
      (diagnostic) => diagnostic.code === REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeValidationSummary,
    );
    assert.ok(summaryDiagnostic);
    assert.equal(summaryDiagnostic.script, 'diagnostics:smoke:validate');
    assert.equal(summaryDiagnostic.runId, runId);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke can skip markdown validation when disabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const markdownPath = path.join(tempDirectory, 'missing-report-diagnostics-smoke.md');

  try {
    const summary = await writeValidSmokeArtifacts({
      reportPath,
      markdownPath: path.join(tempDirectory, 'unused-report-diagnostics-smoke.md'),
    });
    await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');

    const { stdout, stderr } = await execFileAsync(process.execPath, [VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH], {
      env: {
        ...process.env,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
        REPORT_DIAGNOSTICS_SMOKE_VALIDATE_MARKDOWN: '0',
      },
    });

    assert.match(stdout, /Diagnostics smoke report is valid and passing/);
    assert.equal(stderr.trim(), '');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits summary diagnostic context for markdown-disabled mode', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const markdownPath = path.join(tempDirectory, 'missing-report-diagnostics-smoke.md');
  const runId = 'validate-smoke-json-markdown-disabled-run';

  try {
    const summary = await writeValidSmokeArtifacts({
      reportPath,
      markdownPath: path.join(tempDirectory, 'unused-report-diagnostics-smoke.md'),
    });
    await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');

    const { stdout, stderr } = await execFileAsync(process.execPath, [VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH], {
      env: {
        ...process.env,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
        REPORT_DIAGNOSTICS_SMOKE_VALIDATE_MARKDOWN: '0',
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
    });

    const diagnostics = collectReportDiagnostics(stdout, stderr);
    const summaryDiagnostic = diagnostics.find(
      (diagnostic) => diagnostic.code === REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeValidationSummary,
    );
    assert.ok(summaryDiagnostic);
    assert.equal(summaryDiagnostic.context.markdownValidationEnabled, false);
    assert.equal(summaryDiagnostic.context.markdownPath, null);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
