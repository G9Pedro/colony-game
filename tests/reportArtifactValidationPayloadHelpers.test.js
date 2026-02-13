import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areRecommendedActionsEqual,
  buildReportArtifactStatusCounts,
  buildRecommendedActionsFromResults,
  computeReportArtifactStatusCounts,
  doReportArtifactStatusCountsMatch,
  formatReportArtifactStatusCounts,
  hasExpectedReportArtifactStatusKeys,
  isValidRecommendedActions,
  isValidReportArtifactResultEntry,
  KNOWN_REPORT_ARTIFACT_STATUSES,
  REPORT_ARTIFACT_ENTRY_ERROR_TYPES,
  REPORT_ARTIFACT_STATUSES,
  normalizeRecommendedActions,
} from '../src/game/reportArtifactValidationPayloadHelpers.js';

test('KNOWN_REPORT_ARTIFACT_STATUSES contains expected statuses', () => {
  assert.deepEqual(
    Array.from(KNOWN_REPORT_ARTIFACT_STATUSES).sort((a, b) => a.localeCompare(b)),
    Object.values(REPORT_ARTIFACT_STATUSES).sort((a, b) => a.localeCompare(b)),
  );
});

test('REPORT_ARTIFACT_ENTRY_ERROR_TYPES exposes stable values', () => {
  assert.deepEqual(REPORT_ARTIFACT_ENTRY_ERROR_TYPES, {
    invalidJson: 'invalid-json',
    readError: 'error',
  });
});

test('buildReportArtifactStatusCounts creates fresh zeroed status maps', () => {
  const first = buildReportArtifactStatusCounts();
  const second = buildReportArtifactStatusCounts();

  assert.deepEqual(first, {
    [REPORT_ARTIFACT_STATUSES.ok]: 0,
    [REPORT_ARTIFACT_STATUSES.error]: 0,
    [REPORT_ARTIFACT_STATUSES.invalid]: 0,
    [REPORT_ARTIFACT_STATUSES.invalidJson]: 0,
  });
  assert.deepEqual(second, first);
  assert.notEqual(first, second);
});

test('formatReportArtifactStatusCounts uses canonical order and defaults', () => {
  const formatted = formatReportArtifactStatusCounts({
    [REPORT_ARTIFACT_STATUSES.invalid]: 4,
    [REPORT_ARTIFACT_STATUSES.ok]: 2,
  });
  assert.equal(formatted, 'ok=2, error=0, invalid=4, invalid-json=0');
});

test('hasExpectedReportArtifactStatusKeys validates exact key sets', () => {
  assert.equal(
    hasExpectedReportArtifactStatusKeys({
      [REPORT_ARTIFACT_STATUSES.ok]: 1,
      [REPORT_ARTIFACT_STATUSES.error]: 0,
      [REPORT_ARTIFACT_STATUSES.invalid]: 0,
      [REPORT_ARTIFACT_STATUSES.invalidJson]: 0,
    }),
    true,
  );
  assert.equal(
    hasExpectedReportArtifactStatusKeys({
      [REPORT_ARTIFACT_STATUSES.ok]: 1,
      [REPORT_ARTIFACT_STATUSES.error]: 0,
    }),
    false,
  );
  assert.equal(
    hasExpectedReportArtifactStatusKeys({
      [REPORT_ARTIFACT_STATUSES.ok]: 1,
      [REPORT_ARTIFACT_STATUSES.error]: 0,
      [REPORT_ARTIFACT_STATUSES.invalid]: 0,
      [REPORT_ARTIFACT_STATUSES.invalidJson]: 0,
      extra: 2,
    }),
    false,
  );
});

test('computeReportArtifactStatusCounts aggregates known status rows', () => {
  const counts = computeReportArtifactStatusCounts([
    { status: REPORT_ARTIFACT_STATUSES.ok },
    { status: REPORT_ARTIFACT_STATUSES.ok },
    { status: REPORT_ARTIFACT_STATUSES.error },
    { status: REPORT_ARTIFACT_STATUSES.invalidJson },
    { status: REPORT_ARTIFACT_STATUSES.invalid },
  ]);
  assert.deepEqual(counts, {
    [REPORT_ARTIFACT_STATUSES.ok]: 2,
    [REPORT_ARTIFACT_STATUSES.error]: 1,
    [REPORT_ARTIFACT_STATUSES.invalid]: 1,
    [REPORT_ARTIFACT_STATUSES.invalidJson]: 1,
  });
});

test('doReportArtifactStatusCountsMatch compares canonical keys', () => {
  const left = {
    [REPORT_ARTIFACT_STATUSES.ok]: 1,
    [REPORT_ARTIFACT_STATUSES.error]: 2,
    [REPORT_ARTIFACT_STATUSES.invalid]: 3,
    [REPORT_ARTIFACT_STATUSES.invalidJson]: 4,
  };
  assert.equal(doReportArtifactStatusCountsMatch(left, { ...left }), true);
  assert.equal(
    doReportArtifactStatusCountsMatch(left, {
      ...left,
      [REPORT_ARTIFACT_STATUSES.invalidJson]: 5,
    }),
    false,
  );
});

test('isValidRecommendedActions validates command/path entries', () => {
  assert.equal(
    isValidRecommendedActions([{ command: 'npm run verify', paths: ['reports/a.json'] }]),
    true,
  );
  assert.equal(isValidRecommendedActions([{ command: '', paths: ['reports/a.json'] }]), false);
  assert.equal(isValidRecommendedActions([{ command: 'x', paths: [''] }]), false);
});

test('isValidReportArtifactResultEntry enforces ok/failure semantics', () => {
  assert.equal(
    isValidReportArtifactResultEntry({
      path: 'reports/a.json',
      kind: 'baseline-suggestions',
      status: REPORT_ARTIFACT_STATUSES.ok,
      ok: true,
      message: null,
      recommendedCommand: null,
    }),
    true,
  );

  assert.equal(
    isValidReportArtifactResultEntry({
      path: 'reports/b.json',
      kind: 'scenario-tuning-dashboard',
      status: REPORT_ARTIFACT_STATUSES.error,
      ok: false,
      message: 'read failure',
      recommendedCommand: 'npm run verify',
    }),
    true,
  );

  assert.equal(
    isValidReportArtifactResultEntry({
      path: 'reports/c.json',
      kind: 'scenario-tuning-dashboard',
      status: REPORT_ARTIFACT_STATUSES.error,
      ok: true,
      message: null,
      recommendedCommand: null,
    }),
    false,
  );
});

test('buildRecommendedActionsFromResults groups by command and sorts paths', () => {
  const actions = buildRecommendedActionsFromResults([
    {
      ok: false,
      path: 'reports/c.json',
      recommendedCommand: 'npm run verify',
    },
    {
      ok: true,
      path: 'reports/a.json',
      recommendedCommand: null,
    },
    {
      ok: false,
      path: 'reports/b.json',
      recommendedCommand: 'npm run verify',
    },
    {
      ok: false,
      path: 'reports/x.json',
      recommendedCommand: 'npm run custom',
    },
  ]);

  assert.deepEqual(actions, [
    {
      command: 'npm run custom',
      paths: ['reports/x.json'],
    },
    {
      command: 'npm run verify',
      paths: ['reports/b.json', 'reports/c.json'],
    },
  ]);
});

test('normalize/compare recommended actions are order-insensitive', () => {
  const left = [
    { command: 'npm run verify', paths: ['reports/b.json', 'reports/a.json'] },
    { command: 'npm run custom', paths: ['reports/c.json'] },
  ];
  const right = [
    { command: 'npm run custom', paths: ['reports/c.json'] },
    { command: 'npm run verify', paths: ['reports/a.json', 'reports/b.json'] },
  ];

  assert.deepEqual(normalizeRecommendedActions(left), normalizeRecommendedActions(right));
  assert.equal(areRecommendedActionsEqual(left, right), true);
  assert.equal(
    areRecommendedActionsEqual(left, [{ command: 'npm run verify', paths: ['reports/a.json'] }]),
    false,
  );
});
