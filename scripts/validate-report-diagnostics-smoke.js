import { isValidDiagnosticsSmokeSummaryPayload } from './reportDiagnosticsSmokeSummary.js';
import {
  getReadArtifactDiagnosticCode,
  readJsonArtifact,
  readValidatedTextArtifact,
} from './reportPayloadInput.js';
import { createScriptDiagnosticEmitter, REPORT_DIAGNOSTIC_CODES } from './reportDiagnostics.js';
import { isValidDiagnosticsSmokeMarkdown } from './reportDiagnosticsSmokeMarkdown.js';

const outputPath =
  process.env.REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH ?? 'reports/report-diagnostics-smoke.json';
const markdownPath =
  process.env.REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH ?? 'reports/report-diagnostics-smoke.md';
const shouldValidateMarkdown = process.env.REPORT_DIAGNOSTICS_SMOKE_VALIDATE_MARKDOWN !== '0';
const emitDiagnostic = createScriptDiagnosticEmitter('diagnostics:smoke:validate');

function formatReadFailure(readResult) {
  if (readResult.status === 'missing') {
    return `Missing diagnostics smoke report at "${readResult.path}".`;
  }
  if (readResult.status === 'invalid-json') {
    return `Diagnostics smoke report at "${readResult.path}" is not valid JSON.`;
  }
  return `Unable to read diagnostics smoke report at "${readResult.path}": ${readResult.message}`;
}

async function main() {
  const readResult = await readJsonArtifact(outputPath);
  if (!readResult.ok) {
    const diagnosticCode =
      getReadArtifactDiagnosticCode(readResult) ?? REPORT_DIAGNOSTIC_CODES.artifactReadError;
    emitDiagnostic({
      level: 'error',
      code: diagnosticCode,
      message: `Diagnostics smoke report read failed (${readResult.status}).`,
      context: {
        path: readResult.path,
        status: readResult.status,
        errorCode: readResult.errorCode ?? null,
      },
    });
    console.error(formatReadFailure(readResult));
    process.exit(1);
  }

  if (!isValidDiagnosticsSmokeSummaryPayload(readResult.payload)) {
    emitDiagnostic({
      level: 'error',
      code: REPORT_DIAGNOSTIC_CODES.artifactInvalidPayload,
      message: 'Diagnostics smoke summary payload failed validation.',
      context: {
        path: outputPath,
      },
    });
    console.error(
      `Diagnostics smoke report at "${outputPath}" failed contract validation (type/schema/count invariants).`,
    );
    process.exit(1);
  }

  if (readResult.payload.failedScenarioCount > 0) {
    emitDiagnostic({
      level: 'error',
      code: REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeFailedScenarios,
      message: 'Diagnostics smoke summary reported failed scenarios.',
      context: {
        path: outputPath,
        failedScenarioCount: readResult.payload.failedScenarioCount,
        scenarioCount: readResult.payload.scenarioCount,
      },
    });
    console.error(
      `Diagnostics smoke report indicates ${readResult.payload.failedScenarioCount} failed scenario(s).`,
    );
    process.exit(1);
  }

  if (shouldValidateMarkdown) {
    const markdownReadResult = await readValidatedTextArtifact({
      path: markdownPath,
      validateText: (text) => isValidDiagnosticsSmokeMarkdown(text, readResult.payload),
      invalidMessage: 'Diagnostics smoke markdown report failed validation.',
    });
    if (!markdownReadResult.ok) {
      const diagnosticCode =
        getReadArtifactDiagnosticCode(markdownReadResult) ?? REPORT_DIAGNOSTIC_CODES.artifactReadError;
      emitDiagnostic({
        level: 'error',
        code: diagnosticCode,
        message:
          markdownReadResult.status === 'invalid'
            ? 'Diagnostics smoke markdown report failed validation.'
            : 'Diagnostics smoke markdown report read failed.',
        context: {
          path: markdownPath,
          status: markdownReadResult.status,
          reason: markdownReadResult.message ?? null,
          errorCode: markdownReadResult.errorCode ?? null,
        },
      });
      if (markdownReadResult.status === 'missing') {
        console.error(`Missing diagnostics smoke markdown report at "${markdownPath}".`);
      } else if (markdownReadResult.status === 'invalid') {
        console.error(
          `Diagnostics smoke markdown report at "${markdownPath}" failed validation against summary payload.`,
        );
      } else {
        console.error(
          `Unable to read diagnostics smoke markdown report at "${markdownPath}": ${markdownReadResult.message ?? 'read error'}`,
        );
      }
      process.exit(1);
    }
  }

  emitDiagnostic({
    level: 'info',
    code: REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeValidationSummary,
    message: 'Diagnostics smoke summary validated successfully.',
    context: {
      path: outputPath,
      scenarioCount: readResult.payload.scenarioCount,
      diagnosticsCount: readResult.payload.diagnosticsCount,
      markdownValidationEnabled: shouldValidateMarkdown,
      markdownPath: shouldValidateMarkdown ? markdownPath : null,
    },
  });

  console.log(
    `Diagnostics smoke report is valid and passing: scenarios=${readResult.payload.scenarioCount}, diagnostics=${readResult.payload.diagnosticsCount}`,
  );
}

await main();
