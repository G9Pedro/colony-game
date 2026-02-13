import test from 'node:test';
import assert from 'node:assert/strict';
import { withReportMeta, REPORT_KINDS } from '../src/game/reportPayloadMeta.js';
import { isValidReportArtifactsValidationPayload } from '../src/game/reportPayloadValidatorsReportArtifacts.js';
import { REPORT_ARTIFACT_STATUSES } from '../src/game/reportArtifactValidationPayloadHelpers.js';

function buildReportArtifactsPayload() {
  return withReportMeta(REPORT_KINDS.reportArtifactsValidation, {
    overallPassed: false,
    failureCount: 1,
    totalChecked: 2,
    statusCounts: {
      [REPORT_ARTIFACT_STATUSES.ok]: 1,
      [REPORT_ARTIFACT_STATUSES.error]: 0,
      [REPORT_ARTIFACT_STATUSES.invalid]: 1,
      [REPORT_ARTIFACT_STATUSES.invalidJson]: 0,
    },
    results: [
      {
        path: 'reports/scenario-tuning-dashboard.json',
        kind: REPORT_KINDS.scenarioTuningDashboard,
        status: REPORT_ARTIFACT_STATUSES.ok,
        ok: true,
        message: null,
        recommendedCommand: null,
      },
      {
        path: 'reports/scenario-tuning-trend.json',
        kind: REPORT_KINDS.scenarioTuningTrend,
        status: REPORT_ARTIFACT_STATUSES.invalid,
        ok: false,
        message: 'payload schema mismatch',
        recommendedCommand: 'npm run simulate:report:tuning:trend',
      },
    ],
    recommendedActions: [
      {
        command: 'npm run simulate:report:tuning:trend',
        paths: ['reports/scenario-tuning-trend.json'],
      },
    ],
  });
}

test('report artifacts module validator accepts compliant payload', () => {
  assert.equal(isValidReportArtifactsValidationPayload(buildReportArtifactsPayload()), true);
});

test('report artifacts module validator rejects action/result parity mismatch', () => {
  const payload = buildReportArtifactsPayload();
  payload.recommendedActions[0].paths = ['reports/scenario-tuning-dashboard.json'];
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('report artifacts module validator rejects unknown report kind rows', () => {
  const payload = buildReportArtifactsPayload();
  payload.results[1].kind = 'unknown-kind';
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('report artifacts module validator rejects unsorted result rows', () => {
  const payload = buildReportArtifactsPayload();
  payload.results = [...payload.results].reverse();
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});
