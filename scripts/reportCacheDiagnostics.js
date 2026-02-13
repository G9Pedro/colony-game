import { REPORT_DIAGNOSTIC_CODES } from './reportDiagnostics.js';
import {
  buildReadArtifactFailureContext,
  formatReadArtifactFailureMessage,
  getReadArtifactDiagnosticCode,
} from './reportPayloadInput.js';

export function handleJsonCacheLoadFailure({
  error,
  emitDiagnostic,
  inputPath,
  cacheArtifactLabel,
  cacheReadFailureMessage,
  genericFailureMessage,
}) {
  const readFailure = error?.cacheReadFailure;
  if (readFailure) {
    const diagnosticCode =
      getReadArtifactDiagnosticCode(readFailure) ?? REPORT_DIAGNOSTIC_CODES.artifactReadError;
    emitDiagnostic({
      level: 'error',
      code: diagnosticCode,
      message: cacheReadFailureMessage,
      context: buildReadArtifactFailureContext(readFailure),
    });
    console.error(
      formatReadArtifactFailureMessage({
        readResult: readFailure,
        artifactLabel: cacheArtifactLabel,
      }),
    );
    return true;
  }

  emitDiagnostic({
    level: 'error',
    code: REPORT_DIAGNOSTIC_CODES.artifactReadError,
    message: genericFailureMessage,
    context: {
      path: inputPath,
      reason: error?.message ?? 'unknown error',
      errorCode: error?.code ?? null,
    },
  });
  console.error(
    `Unable to prepare ${cacheArtifactLabel} at "${inputPath}": ${error?.message ?? 'unknown error'}`,
  );
  return true;
}
