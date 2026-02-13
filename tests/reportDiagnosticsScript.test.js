import test from 'node:test';
import assert from 'node:assert/strict';
import { emitJsonDiagnostic, isJsonDiagnosticsEnabled } from '../scripts/reportDiagnostics.js';

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
        code: 'example',
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
        code: 'artifact-read-error',
        message: 'fallback',
        context: { path: 'reports/a.json' },
      });
      assert.equal(lines.length, 1);
      const payload = JSON.parse(lines[0]);
      assert.equal(payload.type, 'report-diagnostic');
      assert.equal(payload.level, 'warn');
      assert.equal(payload.code, 'artifact-read-error');
      assert.deepEqual(payload.context, { path: 'reports/a.json' });
    });
  });
});
