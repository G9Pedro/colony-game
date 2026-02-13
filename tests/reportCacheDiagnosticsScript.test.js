import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import { handleJsonCacheLoadFailure } from '../scripts/reportCacheDiagnostics.js';

test('handleJsonCacheLoadFailure maps classified read failures to canonical diagnostics', () => {
  const emitted = [];
  const originalConsoleError = console.error;
  const errorLines = [];
  console.error = (line) => {
    errorLines.push(String(line));
  };

  try {
    const handled = handleJsonCacheLoadFailure({
      error: {
        cacheReadFailure: {
          ok: false,
          path: 'reports/baseline-suggestions.json',
          status: 'missing',
          message: 'ENOENT',
          errorCode: 'ENOENT',
        },
      },
      emitDiagnostic: (diagnostic) => emitted.push(diagnostic),
      inputPath: 'reports/baseline-suggestions.json',
      cacheArtifactLabel: 'baseline suggestion cache payload',
      cacheReadFailureMessage: 'Baseline suggestion cache payload read failed.',
      genericFailureMessage: 'Baseline suggestion check failed before summary evaluation.',
    });

    assert.equal(handled, true);
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].code, REPORT_DIAGNOSTIC_CODES.artifactMissing);
    assert.equal(emitted[0].context.path, 'reports/baseline-suggestions.json');
    assert.equal(emitted[0].context.status, 'missing');
    assert.match(errorLines.join('\n'), /Missing baseline suggestion cache payload at/);
  } finally {
    console.error = originalConsoleError;
  }
});

test('handleJsonCacheLoadFailure maps invalid-json cache failures to invalid-json diagnostic code', () => {
  const emitted = [];
  const originalConsoleError = console.error;
  const errorLines = [];
  console.error = (line) => {
    errorLines.push(String(line));
  };

  try {
    const handled = handleJsonCacheLoadFailure({
      error: {
        cacheReadFailure: {
          ok: false,
          path: 'reports/scenario-tuning-baseline-suggestions.json',
          status: 'invalid-json',
          message: 'Unexpected token',
          errorCode: null,
        },
      },
      emitDiagnostic: (diagnostic) => emitted.push(diagnostic),
      inputPath: 'reports/scenario-tuning-baseline-suggestions.json',
      cacheArtifactLabel: 'scenario tuning baseline cache payload',
      cacheReadFailureMessage: 'Scenario tuning baseline cache payload read failed.',
      genericFailureMessage: 'Scenario tuning baseline check failed before summary evaluation.',
    });

    assert.equal(handled, true);
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].code, REPORT_DIAGNOSTIC_CODES.artifactInvalidJson);
    assert.equal(emitted[0].context.status, 'invalid-json');
    assert.equal(emitted[0].context.errorCode, null);
    assert.equal(emitted[0].context.reason, 'Unexpected token');
    assert.match(
      errorLines.join('\n'),
      /scenario tuning baseline cache payload at "reports\/scenario-tuning-baseline-suggestions\.json" is not valid JSON/,
    );
  } finally {
    console.error = originalConsoleError;
  }
});

test('handleJsonCacheLoadFailure emits fallback artifact-read-error for unexpected failures', () => {
  const emitted = [];
  const originalConsoleError = console.error;
  const errorLines = [];
  console.error = (line) => {
    errorLines.push(String(line));
  };

  try {
    const handled = handleJsonCacheLoadFailure({
      error: Object.assign(new Error('boom'), { code: 'EFAIL' }),
      emitDiagnostic: (diagnostic) => emitted.push(diagnostic),
      inputPath: 'reports/scenario-tuning-baseline-suggestions.json',
      cacheArtifactLabel: 'scenario tuning baseline cache payload',
      cacheReadFailureMessage: 'Scenario tuning baseline cache payload read failed.',
      genericFailureMessage: 'Scenario tuning baseline check failed before summary evaluation.',
    });

    assert.equal(handled, true);
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].code, REPORT_DIAGNOSTIC_CODES.artifactReadError);
    assert.equal(
      emitted[0].context.path,
      'reports/scenario-tuning-baseline-suggestions.json',
    );
    assert.equal(emitted[0].context.reason, 'boom');
    assert.equal(emitted[0].context.errorCode, 'EFAIL');
    assert.match(errorLines.join('\n'), /Unable to prepare scenario tuning baseline cache payload/);
  } finally {
    console.error = originalConsoleError;
  }
});
