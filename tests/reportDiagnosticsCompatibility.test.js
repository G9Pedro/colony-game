import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSortedReportDiagnosticCodes,
  isKnownReportDiagnosticCode,
  REPORT_DIAGNOSTIC_CODE_VALUES,
  REPORT_DIAGNOSTIC_FIELDS,
  REPORT_DIAGNOSTICS_SCHEMA_VERSION,
  REPORT_DIAGNOSTIC_LEVELS,
  REPORT_DIAGNOSTIC_TYPE,
} from '../scripts/reportDiagnostics.js';

const EXPECTED_DIAGNOSTIC_CODES = [
  'artifact-invalid-json',
  'artifact-invalid-payload',
  'artifact-missing',
  'artifact-read-error',
  'baseline-signature-drift',
  'baseline-suggestion-summary',
  'diagnostics-smoke-failed-scenarios',
  'diagnostics-smoke-validation-summary',
  'scenario-tuning-baseline-summary',
  'scenario-tuning-intensity-drift',
  'scenario-tuning-intensity-drift-strict',
  'scenario-tuning-intensity-enforcement-tip',
  'scenario-tuning-signature-drift',
];

test('report diagnostics compatibility surface remains stable', () => {
  assert.equal(REPORT_DIAGNOSTICS_SCHEMA_VERSION, 1);
  assert.equal(REPORT_DIAGNOSTIC_TYPE, 'report-diagnostic');
  assert.deepEqual(REPORT_DIAGNOSTIC_LEVELS, ['info', 'warn', 'error']);
  assert.deepEqual(REPORT_DIAGNOSTIC_FIELDS, [
    'type',
    'schemaVersion',
    'generatedAt',
    'script',
    'runId',
    'level',
    'code',
    'message',
    'context',
  ]);
});

test('report diagnostic code catalog matches compatibility fixture', () => {
  const sortedRuntimeCodes = getSortedReportDiagnosticCodes();
  assert.deepEqual(sortedRuntimeCodes, EXPECTED_DIAGNOSTIC_CODES);
  assert.equal(new Set(REPORT_DIAGNOSTIC_CODE_VALUES).size, REPORT_DIAGNOSTIC_CODE_VALUES.length);
  EXPECTED_DIAGNOSTIC_CODES.forEach((code) => {
    assert.equal(isKnownReportDiagnosticCode(code), true);
  });
  assert.equal(isKnownReportDiagnosticCode('diagnostic-code-not-registered'), false);
});
