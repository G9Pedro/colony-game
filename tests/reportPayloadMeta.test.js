import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasValidMeta,
  REPORT_KINDS,
  REPORT_SCHEMA_VERSIONS,
  withReportMeta,
} from '../src/game/reportPayloadMeta.js';

test('withReportMeta stamps canonical metadata for known kind', () => {
  const payload = withReportMeta(REPORT_KINDS.scenarioTuningDashboard, { value: 1 });
  assert.equal(payload.meta.kind, REPORT_KINDS.scenarioTuningDashboard);
  assert.equal(
    payload.meta.schemaVersion,
    REPORT_SCHEMA_VERSIONS[REPORT_KINDS.scenarioTuningDashboard],
  );
  assert.equal(payload.generatedAt, payload.meta.generatedAt);
  assert.equal(payload.value, 1);
});

test('hasValidMeta validates expected kind and generatedAt parity', () => {
  const payload = withReportMeta(REPORT_KINDS.baselineSuggestions, {});
  assert.equal(hasValidMeta(payload, REPORT_KINDS.baselineSuggestions), true);
  assert.equal(hasValidMeta(payload, REPORT_KINDS.scenarioTuningTrend), false);

  const mismatched = { ...payload, generatedAt: '1999-01-01T00:00:00.000Z' };
  assert.equal(hasValidMeta(mismatched, REPORT_KINDS.baselineSuggestions), false);
});

test('hasValidMeta rejects non-canonical ISO timestamps', () => {
  const payload = withReportMeta(REPORT_KINDS.baselineSuggestions, {});
  const withInvalidRootTimestamp = { ...payload, generatedAt: '2026-01-01' };
  assert.equal(hasValidMeta(withInvalidRootTimestamp, REPORT_KINDS.baselineSuggestions), false);

  const withInvalidMetaTimestamp = {
    ...payload,
    meta: { ...payload.meta, generatedAt: 'invalid-date' },
  };
  assert.equal(hasValidMeta(withInvalidMetaTimestamp, REPORT_KINDS.baselineSuggestions), false);
});

test('hasValidMeta rejects unknown expected report kind', () => {
  const payload = withReportMeta(REPORT_KINDS.baselineSuggestions, {});
  assert.equal(hasValidMeta(payload, 'unknown-kind'), false);
});

test('withReportMeta rejects unknown report kind', () => {
  assert.throws(() => withReportMeta('unknown-kind', {}), /Unknown report kind/i);
});
