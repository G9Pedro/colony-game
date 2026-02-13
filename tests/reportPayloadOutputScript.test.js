import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import {
  buildValidatedReportPayload,
  writeJsonArtifact,
  writeTextArtifact,
} from '../scripts/reportPayloadOutput.js';

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

test('writeJsonArtifact and writeTextArtifact persist payloads with parent dirs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'report-output-helper-'));
  const jsonPath = join(dir, 'nested', 'report.json');
  const textPath = join(dir, 'nested', 'report.md');

  try {
    await writeJsonArtifact(jsonPath, { ok: true, version: 1 });
    await writeTextArtifact(textPath, '# Report\n');

    assert.deepEqual(JSON.parse(await readFile(jsonPath, 'utf-8')), { ok: true, version: 1 });
    assert.equal(await readFile(textPath, 'utf-8'), '# Report\n');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
