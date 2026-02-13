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
  assert.equal(kinds.has(REPORT_KINDS.scenarioTuningTrend), true);
  assert.equal(kinds.has(REPORT_KINDS.scenarioTuningBaselineSuggestions), true);
  assert.equal(kinds.has(REPORT_KINDS.baselineSuggestions), true);
});

test('evaluateReportArtifactEntries reports valid and invalid statuses', () => {
  const suggestedAggregateBounds = {
    frontier: {
      alivePopulationMean: { min: 8, max: 8.2 },
    },
  };
  const suggestedSnapshotSignatures = {
    'frontier:standard': 'bbbb2222',
  };
  const validBaselinePayload = withReportMeta(REPORT_KINDS.baselineSuggestions, {
    driftRuns: 8,
    currentAggregateBounds: {
      frontier: {
        alivePopulationMean: { min: 7.9, max: 8.1 },
      },
    },
    suggestedAggregateBounds,
    currentSnapshotSignatures: {
      'frontier:standard': 'aaaa1111',
    },
    suggestedSnapshotSignatures,
    aggregateDelta: {
      frontier: {
        alivePopulationMean: {
          changed: true,
          minDelta: 0.1,
          maxDelta: 0.1,
        },
      },
    },
    snapshotDelta: [
      {
        key: 'frontier:standard',
        changed: true,
        from: 'aaaa1111',
        to: 'bbbb2222',
      },
    ],
    snippets: {
      regressionBaseline: `export const AGGREGATE_BASELINE_BOUNDS = ${JSON.stringify(suggestedAggregateBounds, null, 2)};\n`,
      regressionSnapshots: `export const EXPECTED_SUMMARY_SIGNATURES = ${JSON.stringify(suggestedSnapshotSignatures, null, 2)};\n`,
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
  assert.deepEqual(report.statusCounts, {
    ok: 1,
    error: 1,
    'invalid-json': 1,
  });
  assert.deepEqual(report.recommendedActions, [
    {
      command: 'npm run verify',
      paths: ['reports/broken.json', 'reports/missing.json'],
    },
  ]);
  assert.deepEqual(
    report.results.map((result) => result.path),
    ['reports/baseline-suggestions.json', 'reports/broken.json', 'reports/missing.json'],
  );
  const resultByPath = new Map(report.results.map((result) => [result.path, result]));
  assert.equal(resultByPath.get('reports/baseline-suggestions.json')?.status, 'ok');
  assert.equal(resultByPath.get('reports/baseline-suggestions.json')?.recommendedCommand, null);
  assert.equal(resultByPath.get('reports/missing.json')?.status, 'error');
  assert.equal(resultByPath.get('reports/missing.json')?.recommendedCommand, 'npm run verify');
  assert.equal(resultByPath.get('reports/broken.json')?.status, 'invalid-json');
  assert.equal(resultByPath.get('reports/broken.json')?.recommendedCommand, 'npm run verify');
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

test('evaluateReportArtifactEntries groups recommended actions by command', () => {
  const report = evaluateReportArtifactEntries([
    {
      path: 'reports/scenario-tuning-dashboard.json',
      kind: REPORT_KINDS.scenarioTuningDashboard,
      errorType: 'error',
    },
    {
      path: 'reports/scenario-tuning-validation.json',
      kind: REPORT_KINDS.scenarioTuningValidation,
      errorType: 'error',
    },
  ]);

  assert.deepEqual(report.recommendedActions, [
    {
      command: 'npm run simulate:report:tuning',
      paths: ['reports/scenario-tuning-dashboard.json'],
    },
    {
      command: 'npm run simulate:validate:tuning',
      paths: ['reports/scenario-tuning-validation.json'],
    },
  ]);
});

test('buildReportArtifactsValidationMarkdown renders table rows', () => {
  const markdown = buildReportArtifactsValidationMarkdown({
    overallPassed: false,
    totalChecked: 2,
    failureCount: 1,
    statusCounts: { ok: 1, invalid: 1 },
    results: [
      { path: 'reports/a.json', kind: 'kind-a', status: 'ok', message: null, recommendedCommand: null },
      {
        path: 'reports/b.json',
        kind: 'kind-b',
        status: 'invalid',
        message: 'bad payload',
        recommendedCommand: 'npm run custom:regen',
      },
    ],
  });

  assert.ok(markdown.includes('# Report Artifacts Validation'));
  assert.ok(markdown.includes('Status Counts: ok=1, invalid=1'));
  assert.ok(markdown.includes('| reports/a.json | kind-a | ok |  |'));
  assert.ok(markdown.includes('| reports/b.json | kind-b | invalid | bad payload |'));
  assert.ok(markdown.includes('## Recommended Commands'));
  assert.ok(markdown.includes('`npm run custom:regen` (artifacts: reports/b.json)'));
  assert.ok(markdown.includes('## Remediation Hints'));
  assert.ok(markdown.includes('npm run custom:regen'));
});

test('buildReportArtifactsValidationMarkdown includes no-op remediation on pass', () => {
  const markdown = buildReportArtifactsValidationMarkdown({
    overallPassed: true,
    totalChecked: 1,
    failureCount: 0,
    statusCounts: { ok: 1 },
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
    getReportArtifactRegenerationCommand('reports/scenario-tuning-trend.json'),
    'npm run simulate:report:tuning:trend',
  );
  assert.equal(
    getReportArtifactRegenerationCommand('reports/unknown-report.json'),
    'npm run verify',
  );
});
