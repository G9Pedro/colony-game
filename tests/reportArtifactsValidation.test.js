import test from 'node:test';
import assert from 'node:assert/strict';
import { withReportMeta, REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import {
  buildReportArtifactsValidationMarkdown,
  evaluateReportArtifactEntries,
  getReportArtifactRegenerationCommand,
  REPORT_ARTIFACT_TARGETS,
} from '../src/game/reportArtifactsValidation.js';

test('REPORT_ARTIFACT_TARGETS includes expected report kinds', () => {
  const kinds = new Set(REPORT_ARTIFACT_TARGETS.map((target) => target.kind));
  assert.equal(kinds.has(REPORT_KINDS.scenarioTuningValidation), true);
  assert.equal(kinds.has(REPORT_KINDS.scenarioTuningDashboard), true);
  assert.equal(kinds.has(REPORT_KINDS.scenarioTuningBaselineSuggestions), true);
  assert.equal(kinds.has(REPORT_KINDS.baselineSuggestions), true);
});

test('evaluateReportArtifactEntries reports valid and invalid statuses', () => {
  const validBaselinePayload = withReportMeta(REPORT_KINDS.baselineSuggestions, {
    aggregateDelta: {},
    snapshotDelta: [],
    snippets: {
      regressionBaseline: 'export const AGGREGATE_BASELINE_BOUNDS = {};',
      regressionSnapshots: 'export const EXPECTED_SUMMARY_SIGNATURES = {};',
    },
  });

  const report = evaluateReportArtifactEntries([
    {
      path: 'reports/baseline-suggestions.json',
      kind: REPORT_KINDS.baselineSuggestions,
      payload: validBaselinePayload,
    },
    {
      path: 'reports/missing.json',
      kind: REPORT_KINDS.scenarioTuningDashboard,
      errorType: 'error',
      message: 'ENOENT: missing file',
    },
    {
      path: 'reports/broken.json',
      kind: REPORT_KINDS.scenarioTuningDashboard,
      errorType: 'invalid-json',
      message: 'Unexpected token',
    },
  ]);

  assert.equal(report.totalChecked, 3);
  assert.equal(report.failureCount, 2);
  assert.equal(report.overallPassed, false);
  assert.equal(report.results[0].status, 'ok');
  assert.equal(report.results[1].status, 'error');
  assert.equal(report.results[2].status, 'invalid-json');
});

test('evaluateReportArtifactEntries flags schema-invalid payloads', () => {
  const report = evaluateReportArtifactEntries([
    {
      path: 'reports/scenario-tuning-dashboard.json',
      kind: REPORT_KINDS.scenarioTuningDashboard,
      payload: { meta: { kind: REPORT_KINDS.scenarioTuningDashboard } },
    },
  ]);

  assert.equal(report.overallPassed, false);
  assert.equal(report.failureCount, 1);
  assert.equal(report.results[0].status, 'invalid');
  assert.ok(report.results[0].message?.includes('failed validation'));
});

test('buildReportArtifactsValidationMarkdown renders table rows', () => {
  const markdown = buildReportArtifactsValidationMarkdown({
    overallPassed: false,
    totalChecked: 2,
    failureCount: 1,
    results: [
      { path: 'reports/a.json', kind: 'kind-a', status: 'ok', message: null },
      { path: 'reports/b.json', kind: 'kind-b', status: 'invalid', message: 'bad payload' },
    ],
  });

  assert.ok(markdown.includes('# Report Artifacts Validation'));
  assert.ok(markdown.includes('| reports/a.json | kind-a | ok |  |'));
  assert.ok(markdown.includes('| reports/b.json | kind-b | invalid | bad payload |'));
  assert.ok(markdown.includes('## Remediation Hints'));
  assert.ok(markdown.includes('npm run verify'));
});

test('buildReportArtifactsValidationMarkdown includes no-op remediation on pass', () => {
  const markdown = buildReportArtifactsValidationMarkdown({
    overallPassed: true,
    totalChecked: 1,
    failureCount: 0,
    results: [{ path: 'reports/a.json', kind: 'kind-a', status: 'ok', message: null, ok: true }],
  });
  assert.ok(markdown.includes('No remediation needed. All artifacts are valid.'));
});

test('getReportArtifactRegenerationCommand returns specific command when available', () => {
  assert.equal(
    getReportArtifactRegenerationCommand('reports/baseline-suggestions.json'),
    'npm run simulate:baseline:suggest',
  );
  assert.equal(
    getReportArtifactRegenerationCommand('reports/unknown-report.json'),
    'npm run verify',
  );
});
