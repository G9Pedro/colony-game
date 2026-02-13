import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  REPORT_DIAGNOSTIC_CODES,
} from '../scripts/reportDiagnostics.js';
import {
  assertOutputHasReadFailureDiagnosticContract,
  assertOutputDiagnosticsContract,
} from './helpers/reportDiagnosticsTestUtils.js';
import {
  assertNodeDiagnosticsScriptRejects,
  runNodeDiagnosticsScript,
} from './helpers/reportDiagnosticsScriptTestUtils.js';
import {
  buildMissingArtifactPath,
  createTextArtifact,
  createUnreadableArtifactPath,
} from './helpers/reportReadFailureFixtures.js';
import {
  createPassingSummary,
  writeValidSmokeArtifacts,
} from './helpers/validateReportDiagnosticsSmokeTestUtils.js';

const RUN_ID = 'diagnostic-contract-fixture-run';

test('diagnostics smoke validation script diagnostics follow contract fixture', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-smoke-validate-'));
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    const { reportPath: outputPath, markdownPath: markdownOutputPath } = await writeValidSmokeArtifacts({
      rootDirectory: tempDirectory,
      summary: createPassingSummary({
        runId: RUN_ID,
      }),
    });

    const { stdout, stderr } = await runNodeDiagnosticsScript(scriptPath, {
      env: {
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: outputPath,
        REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownOutputPath,
      },
    });

    assertOutputDiagnosticsContract({
      stdout,
      stderr,
      expectedScript: 'diagnostics:smoke:validate',
      expectedRunId: RUN_ID,
      expectedCodes: [REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeValidationSummary],
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('diagnostics smoke validation emits artifact-missing diagnostic for absent summary', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-smoke-validate-missing-'));
  const missingOutputPath = buildMissingArtifactPath({
    rootDirectory: tempDirectory,
    relativePath: 'missing-report-diagnostics-smoke.json',
  });
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      env: {
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: missingOutputPath,
      },
      assertion: (error) => {
        assertOutputHasReadFailureDiagnosticContract({
          stdout: error.stdout,
          stderr: error.stderr,
          expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactMissing],
          diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactMissing,
          expectedScript: 'diagnostics:smoke:validate',
          expectedRunId: RUN_ID,
          expectedPath: missingOutputPath,
          expectedStatus: 'missing',
          expectedErrorCode: 'ENOENT',
        });
        return true;
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('diagnostics smoke validation emits read-error diagnostic for unreadable summary path', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-smoke-validate-read-error-'));
  const unreadableSummaryPath = path.join(tempDirectory, 'report-diagnostics-smoke.unreadable.json');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    await createUnreadableArtifactPath({
      rootDirectory: tempDirectory,
      relativePath: 'report-diagnostics-smoke.unreadable.json',
    });

    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      env: {
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: unreadableSummaryPath,
      },
      assertion: (error) => {
        assertOutputHasReadFailureDiagnosticContract({
          stdout: error.stdout,
          stderr: error.stderr,
          expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactReadError],
          diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactReadError,
          expectedScript: 'diagnostics:smoke:validate',
          expectedRunId: RUN_ID,
          expectedPath: unreadableSummaryPath,
          expectedStatus: 'error',
          expectedErrorCode: 'EISDIR',
        });
        return true;
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('diagnostics smoke validation emits artifact-missing diagnostic for absent markdown', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-smoke-validate-missing-markdown-'));
  const markdownOutputPath = path.join(tempDirectory, 'missing-report-diagnostics-smoke.md');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    const { reportPath: outputPath } = await writeValidSmokeArtifacts({
      rootDirectory: tempDirectory,
      summary: createPassingSummary({
        runId: RUN_ID,
      }),
      markdownFilename: 'unused-report-diagnostics-smoke.md',
    });

    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      env: {
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: outputPath,
        REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownOutputPath,
      },
      assertion: (error) => {
        const markdownDiagnostic = assertOutputHasReadFailureDiagnosticContract({
          stdout: error.stdout,
          stderr: error.stderr,
          expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactMissing],
          diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactMissing,
          expectedScript: 'diagnostics:smoke:validate',
          expectedRunId: RUN_ID,
          expectedPath: markdownOutputPath,
          expectedStatus: 'missing',
          expectedErrorCode: 'ENOENT',
        });
        assert.equal(markdownDiagnostic.context?.expectedSummaryPath, outputPath);
        return true;
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('diagnostics smoke validation emits invalid-payload diagnostic for invalid markdown', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-smoke-validate-invalid-markdown-'));
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    const {
      reportPath: outputPath,
      markdownPath: markdownOutputPath,
    } = await writeValidSmokeArtifacts({
      rootDirectory: tempDirectory,
      summary: createPassingSummary({
        runId: RUN_ID,
      }),
    });
    await createTextArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'report-diagnostics-smoke.md',
      contents: '# invalid markdown payload',
    });

    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      env: {
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: outputPath,
        REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownOutputPath,
      },
      assertion: (error) => {
        const markdownDiagnostic = assertOutputHasReadFailureDiagnosticContract({
          stdout: error.stdout,
          stderr: error.stderr,
          expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactInvalidPayload],
          diagnosticCode: REPORT_DIAGNOSTIC_CODES.artifactInvalidPayload,
          expectedScript: 'diagnostics:smoke:validate',
          expectedRunId: RUN_ID,
          expectedPath: markdownOutputPath,
          expectedStatus: 'invalid',
          expectedErrorCode: null,
        });
        assert.equal(markdownDiagnostic.context?.expectedSummaryPath, outputPath);
        return true;
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
