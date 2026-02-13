import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_KINDS } from '../src/game/reportPayloadMeta.js';
import {
  getReportArtifactRegenerationCommand,
  isKnownReportArtifactTargetKind,
  isValidReportArtifactTarget,
  REPORT_ARTIFACT_TARGETS,
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
});

test('isKnownReportArtifactTargetKind allows only target kinds', () => {
  assert.equal(isKnownReportArtifactTargetKind(REPORT_KINDS.scenarioTuningTrend), true);
  assert.equal(isKnownReportArtifactTargetKind(REPORT_KINDS.reportArtifactsValidation), false);
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

test('getReportArtifactRegenerationCommand uses target-specific defaults', () => {
  assert.equal(
    getReportArtifactRegenerationCommand('reports/scenario-tuning-trend.json'),
    'npm run simulate:report:tuning:trend',
  );
  assert.equal(getReportArtifactRegenerationCommand('reports/unknown.json'), 'npm run verify');
});
