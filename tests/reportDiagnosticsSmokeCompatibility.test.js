import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REPORT_DIAGNOSTICS_SMOKE_SCHEMA_VERSION,
  REPORT_DIAGNOSTICS_SMOKE_SCENARIO_FIELDS,
  REPORT_DIAGNOSTICS_SMOKE_SUMMARY_FIELDS,
  REPORT_DIAGNOSTICS_SMOKE_SUMMARY_TYPE,
} from '../scripts/reportDiagnosticsSmokeSummary.js';

test('diagnostics smoke summary compatibility surface remains stable', () => {
  assert.equal(REPORT_DIAGNOSTICS_SMOKE_SUMMARY_TYPE, 'report-diagnostics-smoke-summary');
  assert.equal(REPORT_DIAGNOSTICS_SMOKE_SCHEMA_VERSION, 1);
  assert.deepEqual(REPORT_DIAGNOSTICS_SMOKE_SUMMARY_FIELDS, [
    'type',
    'schemaVersion',
    'generatedAt',
    'runId',
    'scenarioCount',
    'passedScenarioCount',
    'failedScenarioCount',
    'diagnosticsCount',
    'diagnosticsByCode',
    'diagnosticsByLevel',
    'diagnosticsByScript',
    'scenarios',
  ]);
  assert.deepEqual(REPORT_DIAGNOSTICS_SMOKE_SCENARIO_FIELDS, [
    'name',
    'expectedScript',
    'expectedExitCode',
    'actualExitCode',
    'diagnosticsCount',
    'observedCodes',
    'ok',
    'errors',
  ]);
});
