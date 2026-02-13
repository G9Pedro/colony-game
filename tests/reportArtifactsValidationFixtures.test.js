import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_ARTIFACT_STATUSES } from '../src/game/reportArtifactValidationPayloadHelpers.js';
import {
  getReportArtifactRegenerationCommand,
  REPORT_ARTIFACT_TARGETS,
  REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH,
} from '../src/game/reportArtifactsManifest.js';
import {
  buildReportArtifactValidationResults,
  buildReportArtifactsValidationPayloadFixture,
  buildValidReportArtifactsValidationPayload,
} from './helpers/reportArtifactsValidationFixtures.js';

test('buildReportArtifactValidationResults returns sorted canonical rows', () => {
  const results = buildReportArtifactValidationResults();
  assert.equal(results.length, REPORT_ARTIFACT_TARGETS.length);
  assert.equal(
    results.every(
      (result) =>
        result.status === REPORT_ARTIFACT_STATUSES.ok &&
        result.ok === true &&
        result.message === null &&
        result.recommendedCommand === null,
    ),
    true,
  );

  const expectedPaths = REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH.map((target) => target.path);
  assert.deepEqual(
    results.map((result) => result.path),
    expectedPaths,
  );
});

test('buildReportArtifactValidationResults applies path-based overrides', () => {
  const failurePath = 'reports/scenario-tuning-trend.json';
  const results = buildReportArtifactValidationResults({
    [failurePath]: {
      status: REPORT_ARTIFACT_STATUSES.error,
      ok: false,
      message: 'failed to read',
      recommendedCommand: getReportArtifactRegenerationCommand(failurePath),
    },
  });
  const failure = results.find((result) => result.path === failurePath);
  assert.equal(failure.status, REPORT_ARTIFACT_STATUSES.error);
  assert.equal(failure.ok, false);
  assert.equal(failure.message, 'failed to read');
  assert.equal(failure.recommendedCommand, getReportArtifactRegenerationCommand(failurePath));
});

test('buildReportArtifactValidationResults rejects unknown override paths', () => {
  assert.throws(
    () =>
      buildReportArtifactValidationResults({
        'reports/not-a-target.json': { status: REPORT_ARTIFACT_STATUSES.error },
      }),
    /Unknown report artifact override path/i,
  );
});

test('buildValidReportArtifactsValidationPayload computes summary and recommended actions', () => {
  const failurePath = 'reports/scenario-tuning-trend.json';
  const payload = buildValidReportArtifactsValidationPayload({
    results: buildReportArtifactValidationResults({
      [failurePath]: {
        status: REPORT_ARTIFACT_STATUSES.invalid,
        ok: false,
        message: 'payload schema mismatch',
        recommendedCommand: getReportArtifactRegenerationCommand(failurePath),
      },
    }),
  });
  assert.equal(payload.failureCount, 1);
  assert.equal(payload.overallPassed, false);
  assert.equal(payload.totalChecked, REPORT_ARTIFACT_TARGETS.length);
  assert.equal(payload.statusCounts[REPORT_ARTIFACT_STATUSES.invalid], 1);
  assert.deepEqual(payload.recommendedActions, [
    {
      command: getReportArtifactRegenerationCommand(failurePath),
      paths: [failurePath],
    },
  ]);
});

test('buildReportArtifactsValidationPayloadFixture composes result and payload overrides', () => {
  const payload = buildReportArtifactsValidationPayloadFixture({
    resultOverridesByPath: {
      'reports/baseline-suggestions.json': {
        status: REPORT_ARTIFACT_STATUSES.error,
        ok: false,
        message: 'broken',
        recommendedCommand: 'npm run simulate:baseline:suggest',
      },
    },
    payloadOverrides: {
      recommendedActions: [],
    },
  });

  assert.equal(payload.failureCount, 1);
  assert.equal(payload.recommendedActions.length, 0);
  const baselineRow = payload.results.find((result) => result.path === 'reports/baseline-suggestions.json');
  assert.equal(baselineRow.status, REPORT_ARTIFACT_STATUSES.error);
  assert.equal(baselineRow.ok, false);
});
