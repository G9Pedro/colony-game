import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReportDiagnostic,
  emitJsonDiagnostic,
  isJsonDiagnosticsEnabled,
  isKnownReportDiagnosticCode,
  REPORT_DIAGNOSTIC_CODES,
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
      assert.equal(payload.type, 'report-diagnostic');
      assert.equal(payload.level, 'warn');
      assert.equal(payload.code, REPORT_DIAGNOSTIC_CODES.artifactReadError);
      assert.deepEqual(payload.context, { path: 'reports/a.json' });
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
