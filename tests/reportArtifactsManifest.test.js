import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_KINDS } from '../src/game/reportPayloadMeta.js';
import {
  getReportArtifactRegenerationCommand,
  hasExactReportArtifactTargets,
  isKnownReportArtifactTargetKind,
  isKnownReportArtifactTargetPath,
  isValidReportArtifactTarget,
  REPORT_ARTIFACT_TARGETS,
  REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH,
} from '../src/game/reportArtifactsManifest.js';

test('report artifact manifest exposes expected target rows', () => {
  assert.equal(Array.isArray(REPORT_ARTIFACT_TARGETS), true);
  assert.equal(REPORT_ARTIFACT_TARGETS.length > 0, true);
  assert.equal(
    REPORT_ARTIFACT_TARGETS.some((target) => target.path === 'reports/scenario-tuning-dashboard.json'),
    true,
  );
  assert.equal(
    REPORT_ARTIFACT_TARGETS.some((target) => target.path === 'reports/baseline-suggestions.json'),
    true,
  );
  assert.equal(
    REPORT_ARTIFACT_TARGETS.every((target) => isValidReportArtifactTarget(target.path, target.kind)),
    true,
  );
});

test('isKnownReportArtifactTargetKind allows only target kinds', () => {
  assert.equal(isKnownReportArtifactTargetKind(REPORT_KINDS.scenarioTuningTrend), true);
  assert.equal(isKnownReportArtifactTargetKind(REPORT_KINDS.reportArtifactsValidation), false);
});

test('isKnownReportArtifactTargetPath allows only target paths', () => {
  assert.equal(isKnownReportArtifactTargetPath('reports/scenario-tuning-trend.json'), true);
  assert.equal(isKnownReportArtifactTargetPath('reports/unknown.json'), false);
});

test('isValidReportArtifactTarget validates path-kind pairs', () => {
  assert.equal(
    isValidReportArtifactTarget('reports/scenario-tuning-dashboard.json', REPORT_KINDS.scenarioTuningDashboard),
    true,
  );
  assert.equal(
    isValidReportArtifactTarget('reports/scenario-tuning-dashboard.json', REPORT_KINDS.scenarioTuningTrend),
    false,
  );
  assert.equal(
    isValidReportArtifactTarget('reports/unknown.json', REPORT_KINDS.scenarioTuningDashboard),
    false,
  );
});

test('hasExactReportArtifactTargets requires full canonical target set', () => {
  const completeResults = REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH.map((target) => ({ ...target }));
  assert.equal(hasExactReportArtifactTargets(completeResults), true);

  const missingOne = completeResults.slice(1);
  assert.equal(hasExactReportArtifactTargets(missingOne), false);

  const mismatchedKind = completeResults.map((result) => ({ ...result }));
  mismatchedKind[0].kind = REPORT_KINDS.scenarioTuningTrend;
  assert.equal(hasExactReportArtifactTargets(mismatchedKind), false);

  const unsorted = [...completeResults].reverse();
  assert.equal(hasExactReportArtifactTargets(unsorted), false);
});

test('REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH keeps canonical ascending order', () => {
  const sortedPaths = REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH.map((target) => target.path);
  const expectedPaths = [...REPORT_ARTIFACT_TARGETS.map((target) => target.path)].sort((a, b) =>
    a.localeCompare(b),
  );
  assert.deepEqual(sortedPaths, expectedPaths);
});

test('getReportArtifactRegenerationCommand uses target-specific defaults', () => {
  assert.equal(
    getReportArtifactRegenerationCommand('reports/scenario-tuning-trend.json'),
    'npm run simulate:report:tuning:trend',
  );
  assert.equal(getReportArtifactRegenerationCommand('reports/unknown.json'), 'npm run verify');
});

test('all canonical report artifact targets resolve non-fallback regeneration commands', () => {
  for (const target of REPORT_ARTIFACT_TARGETS) {
    const command = getReportArtifactRegenerationCommand(target.path);
    assert.equal(typeof command, 'string');
    assert.notEqual(command, 'npm run verify');
  }
});
