import test from 'node:test';
import assert from 'node:assert/strict';
import { withReportMeta, REPORT_KINDS } from '../src/game/reportPayloadMeta.js';
import { isValidReportArtifactsValidationPayload } from '../src/game/reportPayloadValidatorsReportArtifacts.js';
import { REPORT_ARTIFACT_STATUSES } from '../src/game/reportArtifactValidationPayloadHelpers.js';
import {
  getReportArtifactRegenerationCommand,
  REPORT_ARTIFACT_TARGETS,
} from '../src/game/reportArtifactsManifest.js';

function buildReportArtifactsPayload() {
  const invalidTargetPath = 'reports/scenario-tuning-trend.json';
  const results = REPORT_ARTIFACT_TARGETS.map((target) => {
    if (target.path === invalidTargetPath) {
      return {
        path: target.path,
        kind: target.kind,
        status: REPORT_ARTIFACT_STATUSES.invalid,
        ok: false,
        message: 'payload schema mismatch',
        recommendedCommand: getReportArtifactRegenerationCommand(target.path),
      };
    }
    return {
      path: target.path,
      kind: target.kind,
      status: REPORT_ARTIFACT_STATUSES.ok,
      ok: true,
      message: null,
      recommendedCommand: null,
    };
  }).sort((left, right) => left.path.localeCompare(right.path));

  return withReportMeta(REPORT_KINDS.reportArtifactsValidation, {
    overallPassed: false,
    failureCount: 1,
    totalChecked: REPORT_ARTIFACT_TARGETS.length,
    statusCounts: {
      [REPORT_ARTIFACT_STATUSES.ok]: REPORT_ARTIFACT_TARGETS.length - 1,
      [REPORT_ARTIFACT_STATUSES.error]: 0,
      [REPORT_ARTIFACT_STATUSES.invalid]: 1,
      [REPORT_ARTIFACT_STATUSES.invalidJson]: 0,
    },
    results,
    recommendedActions: [
      {
        command: getReportArtifactRegenerationCommand(invalidTargetPath),
        paths: [invalidTargetPath],
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

test('report artifacts module validator rejects known non-target report kind rows', () => {
  const payload = buildReportArtifactsPayload();
  payload.results[1].kind = REPORT_KINDS.reportArtifactsValidation;
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('report artifacts module validator rejects known path with mismatched known kind', () => {
  const payload = buildReportArtifactsPayload();
  const target = payload.results.find((result) => result.path === 'reports/scenario-tuning-trend.json');
  target.kind = REPORT_KINDS.scenarioTuningDashboard;
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('report artifacts module validator rejects unknown path with known target kind', () => {
  const payload = buildReportArtifactsPayload();
  payload.results[1].path = 'reports/non-target.json';
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('report artifacts module validator rejects payload missing canonical targets', () => {
  const payload = buildReportArtifactsPayload();
  payload.results = payload.results.slice(1);
  payload.totalChecked = payload.results.length;
  payload.statusCounts[REPORT_ARTIFACT_STATUSES.ok] -= 1;
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('report artifacts module validator rejects unsorted result rows', () => {
  const payload = buildReportArtifactsPayload();
  payload.results = [...payload.results].reverse();
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});
