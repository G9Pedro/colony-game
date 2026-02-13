import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReportDiagnostic,
  emitJsonDiagnostic,
  isJsonDiagnosticsEnabled,
  isKnownReportDiagnosticCode,
  isValidReportDiagnosticPayload,
  parseReportDiagnosticsFromText,
  REPORT_DIAGNOSTIC_CODES,
  REPORT_DIAGNOSTICS_SCHEMA_VERSION,
  REPORT_DIAGNOSTIC_TYPE,
} from '../scripts/reportDiagnostics.js';

function withEnv(name, value, callback) {
  const previous = process.env[name];
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
  try {
    callback();
  } finally {
    if (previous === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = previous;
    }
  }
}

function captureConsole(methodName, callback) {
  const previous = console[methodName];
  const lines = [];
  console[methodName] = (line) => {
    lines.push(line);
  };
  try {
    callback(lines);
  } finally {
    console[methodName] = previous;
  }
}

test('isJsonDiagnosticsEnabled tracks REPORT_DIAGNOSTICS_JSON env', () => {
  withEnv('REPORT_DIAGNOSTICS_JSON', '1', () => {
    assert.equal(isJsonDiagnosticsEnabled(), true);
  });
  withEnv('REPORT_DIAGNOSTICS_JSON', undefined, () => {
    assert.equal(isJsonDiagnosticsEnabled(), false);
  });
});

test('emitJsonDiagnostic is a no-op when JSON diagnostics disabled', () => {
  withEnv('REPORT_DIAGNOSTICS_JSON', undefined, () => {
    captureConsole('log', (lines) => {
      emitJsonDiagnostic({
        level: 'info',
        code: REPORT_DIAGNOSTIC_CODES.baselineSuggestionSummary,
        message: 'hello',
      });
      assert.equal(lines.length, 0);
    });
  });
});

test('emitJsonDiagnostic writes structured JSON line to matching stream', () => {
  withEnv('REPORT_DIAGNOSTICS_JSON', '1', () => {
    captureConsole('warn', (lines) => {
      emitJsonDiagnostic({
        level: 'warn',
        code: REPORT_DIAGNOSTIC_CODES.artifactReadError,
        message: 'fallback',
        context: { path: 'reports/a.json' },
      });
      assert.equal(lines.length, 1);
      const payload = JSON.parse(lines[0]);
      assert.equal(payload.type, REPORT_DIAGNOSTIC_TYPE);
      assert.equal(payload.schemaVersion, REPORT_DIAGNOSTICS_SCHEMA_VERSION);
      assert.equal(typeof payload.generatedAt, 'string');
      assert.equal(payload.script, null);
      assert.equal(payload.runId, null);
      assert.equal(payload.level, 'warn');
      assert.equal(payload.code, REPORT_DIAGNOSTIC_CODES.artifactReadError);
      assert.deepEqual(payload.context, { path: 'reports/a.json' });
    });
  });
});

test('emitJsonDiagnostic propagates runId from environment when unset', () => {
  withEnv('REPORT_DIAGNOSTICS_JSON', '1', () => {
    withEnv('REPORT_DIAGNOSTICS_RUN_ID', 'ci-run-42', () => {
      captureConsole('log', (lines) => {
        emitJsonDiagnostic({
          level: 'info',
          code: REPORT_DIAGNOSTIC_CODES.baselineSuggestionSummary,
          message: 'summary',
        });
        const payload = JSON.parse(lines[0]);
        assert.equal(payload.runId, 'ci-run-42');
      });
    });
  });
});

test('buildReportDiagnostic validates levels, codes, messages and context', () => {
  const payload = buildReportDiagnostic({
    level: 'info',
    code: REPORT_DIAGNOSTIC_CODES.artifactMissing,
    message: 'baseline missing',
    context: { baselinePath: 'reports/scenario-tuning-dashboard.baseline.json' },
  });
  assert.equal(payload.type, 'report-diagnostic');
  assert.equal(payload.schemaVersion, REPORT_DIAGNOSTICS_SCHEMA_VERSION);
  assert.equal(payload.script, null);
  assert.equal(payload.runId, null);
  assert.equal(payload.code, REPORT_DIAGNOSTIC_CODES.artifactMissing);
  assert.throws(
    () =>
      buildReportDiagnostic({
        level: 'debug',
        code: REPORT_DIAGNOSTIC_CODES.artifactMissing,
        message: 'bad level',
      }),
    /invalid report diagnostic level/i,
  );
  assert.throws(
    () =>
      buildReportDiagnostic({
        level: 'info',
        code: 'unknown-code',
        message: 'bad code',
      }),
    /unknown report diagnostic code/i,
  );
  assert.throws(
    () =>
      buildReportDiagnostic({
        level: 'info',
        code: REPORT_DIAGNOSTIC_CODES.artifactMissing,
        message: '',
      }),
    /non-empty string/i,
  );
  assert.throws(
    () =>
      buildReportDiagnostic({
        level: 'info',
        code: REPORT_DIAGNOSTIC_CODES.artifactMissing,
        message: 'bad context',
        context: [],
      }),
    /context must be an object or null/i,
  );
});

test('isKnownReportDiagnosticCode recognizes known code set', () => {
  assert.equal(isKnownReportDiagnosticCode(REPORT_DIAGNOSTIC_CODES.artifactInvalidJson), true);
  assert.equal(isKnownReportDiagnosticCode('random-diagnostic'), false);
});

test('isValidReportDiagnosticPayload validates parsed payload shape', () => {
  assert.equal(
    isValidReportDiagnosticPayload({
      ...buildReportDiagnostic({
        level: 'error',
        code: REPORT_DIAGNOSTIC_CODES.artifactReadError,
        message: 'failed to read',
        context: { path: 'reports/a.json' },
      }),
    }),
    true,
  );
  assert.equal(
    isValidReportDiagnosticPayload({
      level: 'error',
      code: 'unknown-code',
      message: 'bad',
      context: {},
    }),
    false,
  );
});

test('parseReportDiagnosticsFromText extracts and validates diagnostic lines', () => {
  const text = [
    'normal log line',
    JSON.stringify(buildReportDiagnostic({
      level: 'warn',
      code: REPORT_DIAGNOSTIC_CODES.baselineSignatureDrift,
      message: 'drift',
      context: { changed: 2 },
    })),
    '{"type":"report-diagnostic","level":"info","code":"unknown","message":"bad","context":{}}',
    '{"type":"report-diagnostic","level":"warn","code":"artifact-read-error","message":"ok","context":[]}',
  ].join('\n');

  const diagnostics = parseReportDiagnosticsFromText(text);
  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0].code, REPORT_DIAGNOSTIC_CODES.baselineSignatureDrift);
});
