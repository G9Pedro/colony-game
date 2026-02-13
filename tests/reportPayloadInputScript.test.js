import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { REPORT_KINDS, withReportMeta } from '../src/game/reportPayloadValidators.js';
import { REPORT_ARTIFACT_ENTRY_ERROR_TYPES } from '../src/game/reportArtifactValidationPayloadHelpers.js';
import {
  buildReadArtifactFailureContext,
  buildReadArtifactFailureLabel,
  buildReadArtifactDiagnostic,
  formatReadArtifactFailureMessage,
  getReportArtifactStatusDiagnosticCode,
  getReadArtifactDiagnosticCode,
  READ_ARTIFACT_DIAGNOSTIC_CODES,
  READ_ARTIFACT_FAILURE_STATUSES,
  readJsonArtifact,
  readTextArtifact,
  readValidatedTextArtifact,
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
    assert.equal(missingResult.status, READ_ARTIFACT_FAILURE_STATUSES.missing);

    const invalidJsonResult = await readJsonArtifact(invalidPath);
    assert.equal(invalidJsonResult.ok, false);
    assert.equal(invalidJsonResult.status, READ_ARTIFACT_FAILURE_STATUSES.invalidJson);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('readJsonArtifact classifies non-file read failures as error', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'report-input-helper-'));

  try {
    const result = await readJsonArtifact(directory);
    assert.equal(result.ok, false);
    assert.equal(result.status, READ_ARTIFACT_FAILURE_STATUSES.readError);
    assert.equal(typeof result.message, 'string');
    assert.equal(result.errorCode, 'EISDIR');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('readTextArtifact returns file text and classifies missing/error outcomes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'report-input-helper-'));
  const textPath = join(directory, 'artifact.md');
  const missingPath = join(directory, 'missing.md');

  try {
    await writeFile(textPath, '# Smoke Report\n\nok', 'utf-8');

    const textResult = await readTextArtifact(textPath);
    assert.equal(textResult.ok, true);
    assert.equal(textResult.text, '# Smoke Report\n\nok');

    const missingResult = await readTextArtifact(missingPath);
    assert.equal(missingResult.ok, false);
    assert.equal(missingResult.status, READ_ARTIFACT_FAILURE_STATUSES.missing);

    const unreadableResult = await readTextArtifact(directory);
    assert.equal(unreadableResult.ok, false);
    assert.equal(unreadableResult.status, READ_ARTIFACT_FAILURE_STATUSES.readError);
    assert.equal(unreadableResult.errorCode, 'EISDIR');
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
    assert.equal(result.status, READ_ARTIFACT_FAILURE_STATUSES.invalidPayload);
    assert.match(result.message, /failed validation/i);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('readValidatedTextArtifact classifies invalid text through validator callback', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'report-input-helper-'));
  const artifactPath = join(directory, 'artifact.md');

  try {
    await writeFile(artifactPath, '# not-the-expected-header', 'utf-8');

    const invalidResult = await readValidatedTextArtifact({
      path: artifactPath,
      validateText: (text) => text.startsWith('# expected-header'),
      invalidMessage: 'Markdown header is invalid.',
    });
    assert.equal(invalidResult.ok, false);
    assert.equal(invalidResult.status, READ_ARTIFACT_FAILURE_STATUSES.invalidPayload);
    assert.equal(invalidResult.message, 'Markdown header is invalid.');

    const validResult = await readValidatedTextArtifact({
      path: artifactPath,
      validateText: (text) => text.startsWith('# not-the-expected-header'),
    });
    assert.equal(validResult.ok, true);
    assert.equal(validResult.text, '# not-the-expected-header');
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
      status: READ_ARTIFACT_FAILURE_STATUSES.invalidJson,
      message: 'Unexpected token',
    },
  });
  assert.equal(invalidJsonEntry.errorType, REPORT_ARTIFACT_ENTRY_ERROR_TYPES.invalidJson);
  assert.equal(
    invalidJsonEntry.message,
    'report artifact at "reports/example.json" is not valid JSON.',
  );

  const missingEntry = toArtifactValidationEntry({
    path: 'reports/example.json',
    kind: REPORT_KINDS.scenarioTuningDashboard,
    readResult: {
      ok: false,
      status: READ_ARTIFACT_FAILURE_STATUSES.missing,
      message: 'ENOENT',
    },
  });
  assert.equal(missingEntry.errorType, REPORT_ARTIFACT_ENTRY_ERROR_TYPES.readError);
  assert.equal(missingEntry.message, 'Missing report artifact at "reports/example.json".');

  const errorEntry = toArtifactValidationEntry({
    path: 'reports/example.json',
    kind: REPORT_KINDS.scenarioTuningDashboard,
    readResult: {
      ok: false,
      status: READ_ARTIFACT_FAILURE_STATUSES.readError,
      message: 'EISDIR',
    },
  });
  assert.equal(errorEntry.errorType, REPORT_ARTIFACT_ENTRY_ERROR_TYPES.readError);
  assert.equal(
    errorEntry.message,
    'Unable to read report artifact at "reports/example.json": EISDIR',
  );
});

test('buildReadArtifactFailureLabel returns stable labels by status', () => {
  assert.equal(
    buildReadArtifactFailureLabel({
      ok: false,
      status: READ_ARTIFACT_FAILURE_STATUSES.missing,
      message: 'ENOENT',
    }),
    'missing file',
  );
  assert.equal(
    buildReadArtifactFailureLabel({
      ok: false,
      status: READ_ARTIFACT_FAILURE_STATUSES.invalidJson,
      message: 'unexpected',
    }),
    'invalid JSON',
  );
  assert.equal(
    buildReadArtifactFailureLabel({
      ok: false,
      status: READ_ARTIFACT_FAILURE_STATUSES.invalidPayload,
      message: 'schema mismatch',
    }),
    'schema mismatch',
  );
  assert.equal(
    buildReadArtifactFailureLabel({
      ok: false,
      status: READ_ARTIFACT_FAILURE_STATUSES.readError,
      errorCode: 'EISDIR',
    }),
    'EISDIR',
  );
  assert.equal(buildReadArtifactFailureLabel({ ok: true, payload: {} }), null);
});

test('formatReadArtifactFailureMessage renders consistent missing/read/invalid strings', () => {
  assert.equal(
    formatReadArtifactFailureMessage({
      readResult: {
        ok: false,
        status: READ_ARTIFACT_FAILURE_STATUSES.missing,
        path: 'reports/missing.json',
      },
      artifactLabel: 'diagnostics smoke report',
    }),
    'Missing diagnostics smoke report at "reports/missing.json".',
  );
  assert.equal(
    formatReadArtifactFailureMessage({
      readResult: {
        ok: false,
        status: READ_ARTIFACT_FAILURE_STATUSES.invalidJson,
        path: 'reports/invalid.json',
      },
      artifactLabel: 'diagnostics smoke report',
    }),
    'diagnostics smoke report at "reports/invalid.json" is not valid JSON.',
  );
  assert.equal(
    formatReadArtifactFailureMessage({
      readResult: {
        ok: false,
        status: READ_ARTIFACT_FAILURE_STATUSES.readError,
        path: 'reports/broken.json',
        message: 'EISDIR',
      },
      artifactLabel: 'diagnostics smoke report',
    }),
    'Unable to read diagnostics smoke report at "reports/broken.json": EISDIR',
  );
  assert.equal(
    formatReadArtifactFailureMessage({
      readResult: {
        ok: false,
        status: READ_ARTIFACT_FAILURE_STATUSES.invalidPayload,
        path: 'reports/broken.md',
      },
      artifactLabel: 'diagnostics smoke markdown report',
      invalidMessage: 'Markdown content failed validation.',
    }),
    'Markdown content failed validation.',
  );
});

test('buildReadArtifactFailureContext builds stable diagnostic context fields', () => {
  assert.deepEqual(
    buildReadArtifactFailureContext(
      {
        ok: false,
        path: 'reports/report.json',
        status: READ_ARTIFACT_FAILURE_STATUSES.readError,
        message: 'EISDIR',
        errorCode: 'EISDIR',
      },
      { artifactKind: 'diagnostics-smoke-summary' },
    ),
    {
      path: 'reports/report.json',
      status: READ_ARTIFACT_FAILURE_STATUSES.readError,
      reason: 'EISDIR',
      errorCode: 'EISDIR',
      artifactKind: 'diagnostics-smoke-summary',
    },
  );
  assert.equal(buildReadArtifactFailureContext({ ok: true, payload: {} }), null);
});

test('getReadArtifactDiagnosticCode maps statuses to stable codes', () => {
  assert.equal(
    getReadArtifactDiagnosticCode({
      ok: false,
      status: READ_ARTIFACT_FAILURE_STATUSES.missing,
    }),
    READ_ARTIFACT_DIAGNOSTIC_CODES.missing,
  );
  assert.equal(
    getReadArtifactDiagnosticCode({
      ok: false,
      status: READ_ARTIFACT_FAILURE_STATUSES.invalidJson,
    }),
    READ_ARTIFACT_DIAGNOSTIC_CODES.invalidJson,
  );
  assert.equal(
    getReadArtifactDiagnosticCode({
      ok: false,
      status: READ_ARTIFACT_FAILURE_STATUSES.invalidPayload,
    }),
    READ_ARTIFACT_DIAGNOSTIC_CODES.invalidPayload,
  );
  assert.equal(
    getReadArtifactDiagnosticCode({
      ok: false,
      status: READ_ARTIFACT_FAILURE_STATUSES.readError,
    }),
    READ_ARTIFACT_DIAGNOSTIC_CODES.readError,
  );
  assert.equal(getReadArtifactDiagnosticCode({ ok: true, payload: {} }), null);
});

test('buildReadArtifactDiagnostic returns structured read failure details', () => {
  assert.deepEqual(
    buildReadArtifactDiagnostic({
      ok: false,
      status: READ_ARTIFACT_FAILURE_STATUSES.invalidJson,
      message: 'Unexpected token',
    }),
    {
      code: READ_ARTIFACT_DIAGNOSTIC_CODES.invalidJson,
      label: 'invalid JSON',
      message: 'Unexpected token',
    },
  );
  assert.equal(buildReadArtifactDiagnostic({ ok: true, payload: {} }), null);
});

test('getReportArtifactStatusDiagnosticCode maps report statuses to codes', () => {
  assert.equal(
    getReportArtifactStatusDiagnosticCode(READ_ARTIFACT_FAILURE_STATUSES.invalidJson),
    READ_ARTIFACT_DIAGNOSTIC_CODES.invalidJson,
  );
  assert.equal(
    getReportArtifactStatusDiagnosticCode(READ_ARTIFACT_FAILURE_STATUSES.invalidPayload),
    READ_ARTIFACT_DIAGNOSTIC_CODES.invalidPayload,
  );
  assert.equal(
    getReportArtifactStatusDiagnosticCode(READ_ARTIFACT_FAILURE_STATUSES.readError),
    READ_ARTIFACT_DIAGNOSTIC_CODES.readError,
  );
  assert.equal(getReportArtifactStatusDiagnosticCode('ok'), null);
});
