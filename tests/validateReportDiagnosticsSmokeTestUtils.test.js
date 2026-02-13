import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  REPORT_DIAGNOSTICS_SMOKE_SUMMARY_TYPE,
} from '../scripts/reportDiagnosticsSmokeSummary.js';
import {
  buildSmokeArtifactPath,
  createFailingSummary,
  createPassingSummary,
  writeSmokeSummaryArtifact,
  writeSmokeSummaryTextArtifact,
  writeValidSmokeArtifacts,
} from './helpers/validateReportDiagnosticsSmokeTestUtils.js';

test('createPassingSummary accepts run id overrides', () => {
  const summary = createPassingSummary({ runId: 'custom-smoke-run' });
  assert.equal(summary.type, REPORT_DIAGNOSTICS_SMOKE_SUMMARY_TYPE);
  assert.equal(summary.runId, 'custom-smoke-run');
  assert.equal(summary.failedScenarioCount, 0);
  assert.equal(summary.passedScenarioCount, summary.scenarioCount);
});

test('createFailingSummary includes failed scenario and diagnostics', () => {
  const summary = createFailingSummary();
  assert.equal(summary.type, REPORT_DIAGNOSTICS_SMOKE_SUMMARY_TYPE);
  assert.equal(summary.failedScenarioCount, 1);
  assert.equal(summary.scenarios.length, 1);
  assert.equal(summary.scenarios[0].ok, false);
  assert.ok(Array.isArray(summary.scenarios[0].observedCodes));
  assert.ok(summary.scenarios[0].observedCodes.length > 0);
  assert.equal(summary.scenarios[0].diagnosticsCount, 1);
});

test('buildSmokeArtifactPath composes smoke artifact paths', () => {
  const artifactPath = buildSmokeArtifactPath({
    rootDirectory: '/tmp/smoke-test-root',
    filename: 'report-diagnostics-smoke.json',
  });
  assert.equal(artifactPath, '/tmp/smoke-test-root/report-diagnostics-smoke.json');
});

test('writeSmokeSummaryArtifact writes provided summary payload', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-utils-summary-'));
  const summary = createPassingSummary({ runId: 'write-summary-artifact-run' });

  try {
    const reportPath = await writeSmokeSummaryArtifact({
      rootDirectory: tempDirectory,
      summary,
      reportFilename: 'summary.custom.json',
    });
    assert.equal(path.basename(reportPath), 'summary.custom.json');
    const reportPayload = JSON.parse(await readFile(reportPath, 'utf-8'));
    assert.equal(reportPayload.runId, summary.runId);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('writeSmokeSummaryTextArtifact writes raw text payload', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-utils-summary-text-'));

  try {
    const reportPath = await writeSmokeSummaryTextArtifact({
      rootDirectory: tempDirectory,
      reportFilename: 'summary.custom.json',
      contents: '{"broken": ',
    });
    assert.equal(path.basename(reportPath), 'summary.custom.json');
    const contents = await readFile(reportPath, 'utf-8');
    assert.equal(contents, '{"broken": ');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('writeValidSmokeArtifacts writes summary and markdown using custom filenames', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-utils-'));
  const summary = createPassingSummary({ runId: 'write-valid-smoke-artifacts-run' });

  try {
    const {
      summary: returnedSummary,
      reportPath,
      markdownPath,
    } = await writeValidSmokeArtifacts({
      rootDirectory: tempDirectory,
      summary,
      reportFilename: 'smoke-summary.custom.json',
      markdownFilename: 'smoke-summary.custom.md',
    });
    assert.equal(returnedSummary.runId, summary.runId);
    assert.equal(path.basename(reportPath), 'smoke-summary.custom.json');
    assert.equal(path.basename(markdownPath), 'smoke-summary.custom.md');

    const reportPayload = JSON.parse(await readFile(reportPath, 'utf-8'));
    assert.equal(reportPayload.runId, summary.runId);

    const markdown = await readFile(markdownPath, 'utf-8');
    assert.match(markdown, /^# Report Diagnostics Smoke Summary/m);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
