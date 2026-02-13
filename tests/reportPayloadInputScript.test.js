import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { REPORT_KINDS, withReportMeta } from '../src/game/reportPayloadValidators.js';
import {
  buildReadArtifactFailureLabel,
  readJsonArtifact,
  readValidatedReportArtifact,
  toArtifactValidationEntry,
} from '../scripts/reportPayloadInput.js';

test('readJsonArtifact returns parsed payload for valid JSON file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'report-input-helper-'));
  const artifactPath = join(directory, 'artifact.json');

  try {
    await writeFile(artifactPath, JSON.stringify({ ok: true, count: 2 }), 'utf-8');
    const result = await readJsonArtifact(artifactPath);

    assert.equal(result.ok, true);
    assert.deepEqual(result.payload, { ok: true, count: 2 });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('readJsonArtifact classifies missing and invalid-json outcomes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'report-input-helper-'));
  const missingPath = join(directory, 'missing.json');
  const invalidPath = join(directory, 'invalid.json');

  try {
    await writeFile(invalidPath, '{"broken": ', 'utf-8');

    const missingResult = await readJsonArtifact(missingPath);
    assert.equal(missingResult.ok, false);
    assert.equal(missingResult.status, 'missing');

    const invalidJsonResult = await readJsonArtifact(invalidPath);
    assert.equal(invalidJsonResult.ok, false);
    assert.equal(invalidJsonResult.status, 'invalid-json');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('readJsonArtifact classifies non-file read failures as error', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'report-input-helper-'));

  try {
    const result = await readJsonArtifact(directory);
    assert.equal(result.ok, false);
    assert.equal(result.status, 'error');
    assert.equal(typeof result.message, 'string');
    assert.equal(result.errorCode, 'EISDIR');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('readValidatedReportArtifact rejects schema-invalid payloads', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'report-input-helper-'));
  const artifactPath = join(directory, 'artifact.json');

  try {
    await writeFile(
      artifactPath,
      JSON.stringify(
        withReportMeta(REPORT_KINDS.scenarioTuningValidation, {
          ok: true,
          errors: [],
          warnings: [],
          issueCount: 1,
          checkedScenarioCount: 1,
        }),
      ),
      'utf-8',
    );

    const result = await readValidatedReportArtifact({
      path: artifactPath,
      kind: REPORT_KINDS.scenarioTuningValidation,
    });
    assert.equal(result.ok, false);
    assert.equal(result.status, 'invalid');
    assert.match(result.message, /failed validation/i);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('toArtifactValidationEntry maps helper outcomes to evaluator contract', () => {
  const okEntry = toArtifactValidationEntry({
    path: 'reports/example.json',
    kind: REPORT_KINDS.scenarioTuningDashboard,
    readResult: {
      ok: true,
      payload: { report: true },
    },
  });
  assert.deepEqual(okEntry, {
    path: 'reports/example.json',
    kind: REPORT_KINDS.scenarioTuningDashboard,
    payload: { report: true },
  });

  const invalidJsonEntry = toArtifactValidationEntry({
    path: 'reports/example.json',
    kind: REPORT_KINDS.scenarioTuningDashboard,
    readResult: {
      ok: false,
      status: 'invalid-json',
      message: 'Unexpected token',
    },
  });
  assert.equal(invalidJsonEntry.errorType, 'invalid-json');
  assert.equal(invalidJsonEntry.message, 'Invalid JSON payload.');

  const missingEntry = toArtifactValidationEntry({
    path: 'reports/example.json',
    kind: REPORT_KINDS.scenarioTuningDashboard,
    readResult: {
      ok: false,
      status: 'missing',
      message: 'ENOENT',
    },
  });
  assert.equal(missingEntry.errorType, 'error');
  assert.equal(missingEntry.message, 'Missing report artifact at "reports/example.json".');
});

test('buildReadArtifactFailureLabel returns stable labels by status', () => {
  assert.equal(
    buildReadArtifactFailureLabel({ ok: false, status: 'missing', message: 'ENOENT' }),
    'missing file',
  );
  assert.equal(
    buildReadArtifactFailureLabel({ ok: false, status: 'invalid-json', message: 'unexpected' }),
    'invalid JSON',
  );
  assert.equal(
    buildReadArtifactFailureLabel({ ok: false, status: 'invalid', message: 'schema mismatch' }),
    'schema mismatch',
  );
  assert.equal(
    buildReadArtifactFailureLabel({ ok: false, status: 'error', errorCode: 'EISDIR' }),
    'EISDIR',
  );
  assert.equal(buildReadArtifactFailureLabel({ ok: true, payload: {} }), null);
});
