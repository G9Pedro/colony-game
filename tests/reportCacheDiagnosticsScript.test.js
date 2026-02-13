import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import { handleJsonCacheLoadFailure } from '../scripts/reportCacheDiagnostics.js';
import {
  REPORT_READ_FAILURE_SCENARIOS,
  assertReadFailureDiagnosticMatchesScenario,
} from './helpers/reportReadFailureMatrixTestUtils.js';

function captureConsoleErrorLines(runAssertion) {
  const originalConsoleError = console.error;
  const errorLines = [];
  console.error = (line) => {
    errorLines.push(String(line));
  };

  try {
    runAssertion(errorLines);
  } finally {
    console.error = originalConsoleError;
  }
}

test('handleJsonCacheLoadFailure maps classified read failures to canonical diagnostics', () => {
  const emitted = [];
  captureConsoleErrorLines((errorLines) => {
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
    assertReadFailureDiagnosticMatchesScenario({
      diagnostic: emitted[0],
      scenario: REPORT_READ_FAILURE_SCENARIOS.missing,
      expectedLevel: 'error',
      expectedPath: 'reports/baseline-suggestions.json',
    });
    assert.match(errorLines.join('\n'), /Missing baseline suggestion cache payload at/);
  });
});

test('handleJsonCacheLoadFailure maps invalid-json cache failures to invalid-json diagnostic code', () => {
  const emitted = [];
  captureConsoleErrorLines((errorLines) => {
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
    assertReadFailureDiagnosticMatchesScenario({
      diagnostic: emitted[0],
      scenario: REPORT_READ_FAILURE_SCENARIOS.invalidJson,
      expectedLevel: 'error',
      expectedPath: 'reports/scenario-tuning-baseline-suggestions.json',
    });
    assert.equal(emitted[0].context.reason, 'Unexpected token');
    assert.match(
      errorLines.join('\n'),
      /scenario tuning baseline cache payload at "reports\/scenario-tuning-baseline-suggestions\.json" is not valid JSON/,
    );
  });
});

test('handleJsonCacheLoadFailure maps invalid payload failures to invalid-payload diagnostic code', () => {
  const emitted = [];
  captureConsoleErrorLines((errorLines) => {
    const handled = handleJsonCacheLoadFailure({
      error: {
        cacheReadFailure: {
          ok: false,
          path: 'reports/scenario-tuning-dashboard.baseline.json',
          status: 'invalid',
          message: 'Payload failed validation for kind "scenario-tuning-dashboard".',
          errorCode: null,
        },
      },
      emitDiagnostic: (diagnostic) => emitted.push(diagnostic),
      inputPath: 'reports/scenario-tuning-dashboard.baseline.json',
      cacheArtifactLabel: 'scenario tuning dashboard baseline payload',
      cacheReadFailureMessage: 'Scenario tuning dashboard baseline payload read failed.',
      genericFailureMessage: 'Scenario tuning trend baseline read failed.',
    });

    assert.equal(handled, true);
    assert.equal(emitted.length, 1);
    assertReadFailureDiagnosticMatchesScenario({
      diagnostic: emitted[0],
      scenario: REPORT_READ_FAILURE_SCENARIOS.invalidPayload,
      expectedLevel: 'error',
      expectedPath: 'reports/scenario-tuning-dashboard.baseline.json',
    });
    assert.equal(
      emitted[0].context.reason,
      'Payload failed validation for kind "scenario-tuning-dashboard".',
    );
    assert.match(
      errorLines.join('\n'),
      /scenario tuning dashboard baseline payload at "reports\/scenario-tuning-dashboard\.baseline\.json" failed validation\./,
    );
  });
});

test('handleJsonCacheLoadFailure maps classified read errors to artifact-read-error diagnostics', () => {
  const emitted = [];
  captureConsoleErrorLines((errorLines) => {
    const handled = handleJsonCacheLoadFailure({
      error: {
        cacheReadFailure: {
          ok: false,
          path: 'reports/scenario-tuning-dashboard.baseline.json',
          status: 'error',
          message: 'EISDIR: illegal operation on a directory, read',
          errorCode: 'EISDIR',
        },
      },
      emitDiagnostic: (diagnostic) => emitted.push(diagnostic),
      inputPath: 'reports/scenario-tuning-dashboard.baseline.json',
      cacheArtifactLabel: 'scenario tuning dashboard baseline payload',
      cacheReadFailureMessage: 'Scenario tuning dashboard baseline payload read failed.',
      genericFailureMessage: 'Scenario tuning trend baseline read failed.',
    });

    assert.equal(handled, true);
    assert.equal(emitted.length, 1);
    assertReadFailureDiagnosticMatchesScenario({
      diagnostic: emitted[0],
      scenario: REPORT_READ_FAILURE_SCENARIOS.unreadable,
      expectedLevel: 'error',
      expectedPath: 'reports/scenario-tuning-dashboard.baseline.json',
      expectedStatus: 'error',
      expectedErrorCode: 'EISDIR',
    });
    assert.equal(emitted[0].context.reason, 'EISDIR: illegal operation on a directory, read');
    assert.match(
      errorLines.join('\n'),
      /Unable to read scenario tuning dashboard baseline payload at "reports\/scenario-tuning-dashboard\.baseline\.json"/,
    );
  });
});

test('handleJsonCacheLoadFailure emits fallback artifact-read-error for unexpected failures', () => {
  const emitted = [];
  captureConsoleErrorLines((errorLines) => {
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
  });
});
