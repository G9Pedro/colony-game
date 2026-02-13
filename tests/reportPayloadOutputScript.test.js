import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import { buildValidatedReportPayload } from '../scripts/reportPayloadOutput.js';

test('buildValidatedReportPayload returns metadata-wrapped valid payload', () => {
  const payload = buildValidatedReportPayload(
    REPORT_KINDS.scenarioTuningValidation,
    {
      ok: true,
      errors: [],
      warnings: [],
      issueCount: 0,
      checkedScenarioCount: 3,
    },
    'scenario tuning validation',
  );

  assert.equal(payload.meta.kind, REPORT_KINDS.scenarioTuningValidation);
  assert.equal(payload.meta.generatedAt, payload.generatedAt);
  assert.equal(payload.ok, true);
});

test('buildValidatedReportPayload throws for invalid payload contracts', () => {
  assert.throws(
    () =>
      buildValidatedReportPayload(
        REPORT_KINDS.scenarioTuningValidation,
        {
          ok: true,
          errors: [],
          warnings: [],
          issueCount: 1,
          checkedScenarioCount: 3,
        },
        'scenario tuning validation',
      ),
    /Unable to build valid scenario tuning validation payload/i,
  );
});
