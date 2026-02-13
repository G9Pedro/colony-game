import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_KINDS } from '../src/game/reportPayloadMeta.js';
import { isValidReportArtifactsValidationPayload } from '../src/game/reportPayloadValidatorsReportArtifacts.js';
import { REPORT_ARTIFACT_STATUSES } from '../src/game/reportArtifactValidationPayloadHelpers.js';
import { getReportArtifactTargetPath } from '../src/game/reportArtifactsManifest.js';
import {
  buildFailingReportArtifactResultOverride,
  buildReportArtifactsValidationPayloadFixture,
} from './helpers/reportArtifactsValidationFixtures.js';

function requireReportArtifactPath(kind) {
  const path = getReportArtifactTargetPath(kind);
  assert.notEqual(path, null);
  return path;
}

const TREND_ARTIFACT_PATH = requireReportArtifactPath(REPORT_KINDS.scenarioTuningTrend);
const DASHBOARD_ARTIFACT_PATH = requireReportArtifactPath(REPORT_KINDS.scenarioTuningDashboard);
const BASELINE_SUGGESTIONS_ARTIFACT_PATH = requireReportArtifactPath(REPORT_KINDS.baselineSuggestions);

function buildReportArtifactsPayload() {
  return buildReportArtifactsValidationPayloadFixture({
    resultOverridesByPath: {
      [TREND_ARTIFACT_PATH]: buildFailingReportArtifactResultOverride(TREND_ARTIFACT_PATH, {
        status: REPORT_ARTIFACT_STATUSES.invalid,
        message: 'payload schema mismatch',
      }),
    },
  });
}

test('report artifacts module validator accepts compliant payload', () => {
  assert.equal(isValidReportArtifactsValidationPayload(buildReportArtifactsPayload()), true);
});

test('report artifacts module validator rejects action/result parity mismatch', () => {
  const payload = buildReportArtifactsPayload();
  payload.recommendedActions[0].paths = [DASHBOARD_ARTIFACT_PATH];
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('report artifacts module validator rejects unknown report kind rows', () => {
  const payload = buildReportArtifactsValidationPayloadFixture({
    resultOverridesByPath: {
      [TREND_ARTIFACT_PATH]: { kind: 'unknown-kind' },
    },
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('report artifacts module validator rejects known non-target report kind rows', () => {
  const payload = buildReportArtifactsValidationPayloadFixture({
    resultOverridesByPath: {
      [TREND_ARTIFACT_PATH]: {
        kind: REPORT_KINDS.reportArtifactsValidation,
      },
    },
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('report artifacts module validator rejects known path with mismatched known kind', () => {
  const payload = buildReportArtifactsValidationPayloadFixture({
    resultOverridesByPath: {
      [TREND_ARTIFACT_PATH]: {
        kind: REPORT_KINDS.scenarioTuningDashboard,
      },
    },
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('report artifacts module validator rejects unknown path with known target kind', () => {
  const payload = buildReportArtifactsValidationPayloadFixture({
    resultOverridesByPath: {
      [TREND_ARTIFACT_PATH]: { path: 'reports/non-target.json' },
    },
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('report artifacts module validator rejects payload missing canonical targets', () => {
  const payload = buildReportArtifactsValidationPayloadFixture({
    omittedPaths: [BASELINE_SUGGESTIONS_ARTIFACT_PATH],
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});

test('report artifacts module validator rejects unsorted result rows', () => {
  const payload = buildReportArtifactsValidationPayloadFixture({
    transformResults: (results) => [...results].reverse(),
  });
  assert.equal(isValidReportArtifactsValidationPayload(payload), false);
});
