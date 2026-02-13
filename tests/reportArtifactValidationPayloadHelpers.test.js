import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areRecommendedActionsEqual,
  buildRecommendedActionsFromResults,
  isValidRecommendedActions,
  isValidReportArtifactResultEntry,
  KNOWN_REPORT_ARTIFACT_STATUSES,
  normalizeRecommendedActions,
} from '../src/game/reportArtifactValidationPayloadHelpers.js';

test('KNOWN_REPORT_ARTIFACT_STATUSES contains expected statuses', () => {
  assert.deepEqual(
    Array.from(KNOWN_REPORT_ARTIFACT_STATUSES).sort((a, b) => a.localeCompare(b)),
    ['error', 'invalid', 'invalid-json', 'ok'],
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
      status: 'ok',
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
      status: 'error',
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
      status: 'error',
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
