import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_DIAGNOSTICS_SMOKE_MARKDOWN_REQUIRED_SECTIONS } from '../scripts/reportDiagnosticsSmokeMarkdown.js';

test('diagnostics smoke markdown required section list remains stable', () => {
  assert.deepEqual(REPORT_DIAGNOSTICS_SMOKE_MARKDOWN_REQUIRED_SECTIONS, [
    '# Report Diagnostics Smoke Summary',
    '## Scenario results',
    '## Diagnostic counts by code',
    '## Diagnostic counts by level',
    '## Diagnostic counts by script',
    '## Failures',
  ]);
});
