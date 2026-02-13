import { readFile } from 'node:fs/promises';
import { validateReportPayloadByKind } from '../src/game/reportPayloadValidators.js';
import { REPORT_DIAGNOSTIC_CODES } from './reportDiagnostics.js';

export const READ_ARTIFACT_DIAGNOSTIC_CODES = Object.freeze({
  missing: REPORT_DIAGNOSTIC_CODES.artifactMissing,
  invalidJson: REPORT_DIAGNOSTIC_CODES.artifactInvalidJson,
  invalidPayload: REPORT_DIAGNOSTIC_CODES.artifactInvalidPayload,
  readError: REPORT_DIAGNOSTIC_CODES.artifactReadError,
});

export const READ_ARTIFACT_FAILURE_STATUSES = Object.freeze({
  missing: 'missing',
  invalidJson: 'invalid-json',
  invalidPayload: 'invalid',
  readError: 'error',
});

const READ_ARTIFACT_DIAGNOSTIC_CODES_BY_STATUS = Object.freeze({
  [READ_ARTIFACT_FAILURE_STATUSES.missing]: READ_ARTIFACT_DIAGNOSTIC_CODES.missing,
  [READ_ARTIFACT_FAILURE_STATUSES.invalidJson]: READ_ARTIFACT_DIAGNOSTIC_CODES.invalidJson,
  [READ_ARTIFACT_FAILURE_STATUSES.invalidPayload]: READ_ARTIFACT_DIAGNOSTIC_CODES.invalidPayload,
  [READ_ARTIFACT_FAILURE_STATUSES.readError]: READ_ARTIFACT_DIAGNOSTIC_CODES.readError,
});

function classifyReadFailure(path, error) {
  if (error?.code === 'ENOENT') {
    return {
      ok: false,
      path,
      status: READ_ARTIFACT_FAILURE_STATUSES.missing,
      message: error.message,
      errorCode: error.code,
    };
  }

  return {
    ok: false,
    path,
    status: READ_ARTIFACT_FAILURE_STATUSES.readError,
    message: error.message,
    errorCode: error?.code ?? null,
  };
}

export async function readJsonArtifact(path) {
  let payloadText;
  try {
    payloadText = await readFile(path, 'utf-8');
  } catch (error) {
    return classifyReadFailure(path, error);
  }

  try {
    return {
      ok: true,
      path,
      payload: JSON.parse(payloadText),
    };
  } catch (error) {
    return {
      ok: false,
      path,
      status: READ_ARTIFACT_FAILURE_STATUSES.invalidJson,
      message: error.message,
      errorCode: null,
    };
  }
}

export async function readTextArtifact(path) {
  try {
    const text = await readFile(path, 'utf-8');
    return {
      ok: true,
      path,
      text,
    };
  } catch (error) {
    return classifyReadFailure(path, error);
  }
}

export async function readValidatedTextArtifact({
  path,
  validateText = undefined,
  invalidMessage = 'Text artifact failed validation.',
}) {
  const readResult = await readTextArtifact(path);
  if (!readResult.ok || typeof validateText !== 'function') {
    return readResult;
  }

  if (validateText(readResult.text)) {
    return readResult;
  }

  return {
    ok: false,
    path,
    status: READ_ARTIFACT_FAILURE_STATUSES.invalidPayload,
    message: invalidMessage,
    errorCode: null,
  };
}

export async function readValidatedReportArtifact({ path, kind }) {
  const readResult = await readJsonArtifact(path);
  if (!readResult.ok) {
    return readResult;
  }

  const validation = validateReportPayloadByKind(kind, readResult.payload);
  if (!validation.ok) {
    return {
      ok: false,
      path,
      status: READ_ARTIFACT_FAILURE_STATUSES.invalidPayload,
      message: validation.reason,
      errorCode: null,
    };
  }

  return readResult;
}

export function getReadArtifactDiagnosticCode(readResult) {
  if (!readResult || readResult.ok) {
    return null;
  }

  return (
    READ_ARTIFACT_DIAGNOSTIC_CODES_BY_STATUS[readResult.status]
    ?? READ_ARTIFACT_DIAGNOSTIC_CODES.readError
  );
}

export function formatReadArtifactFailureMessage({
  readResult,
  artifactLabel = 'artifact',
  invalidMessage = null,
}) {
  if (!readResult || readResult.ok) {
    return null;
  }

  if (readResult.status === READ_ARTIFACT_FAILURE_STATUSES.missing) {
    return `Missing ${artifactLabel} at "${readResult.path}".`;
  }

  if (readResult.status === READ_ARTIFACT_FAILURE_STATUSES.invalidJson) {
    return `${artifactLabel} at "${readResult.path}" is not valid JSON.`;
  }

  if (readResult.status === READ_ARTIFACT_FAILURE_STATUSES.invalidPayload) {
    return invalidMessage ?? `${artifactLabel} at "${readResult.path}" failed validation.`;
  }

  return `Unable to read ${artifactLabel} at "${readResult.path}": ${readResult.message ?? 'read error'}`;
}

export function buildReadArtifactFailureContext(readResult, extraContext = {}) {
  if (!readResult || readResult.ok) {
    return null;
  }

  return {
    path: readResult.path,
    status: readResult.status,
    reason: readResult.message ?? null,
    errorCode: readResult.errorCode ?? null,
    ...extraContext,
  };
}

export function buildReadArtifactFailureLabel(readResult) {
  if (!readResult || readResult.ok) {
    return null;
  }

  if (readResult.status === READ_ARTIFACT_FAILURE_STATUSES.missing) {
    return 'missing file';
  }

  if (readResult.status === READ_ARTIFACT_FAILURE_STATUSES.invalidJson) {
    return 'invalid JSON';
  }

  if (readResult.status === READ_ARTIFACT_FAILURE_STATUSES.invalidPayload) {
    return readResult.message ?? 'invalid payload';
  }

  return readResult.errorCode ?? readResult.message ?? 'read error';
}

export function buildReadArtifactDiagnostic(readResult) {
  if (!readResult || readResult.ok) {
    return null;
  }

  return {
    code: getReadArtifactDiagnosticCode(readResult),
    label: buildReadArtifactFailureLabel(readResult),
    message: readResult.message ?? null,
  };
}

export function getReportArtifactStatusDiagnosticCode(status) {
  if (status === READ_ARTIFACT_FAILURE_STATUSES.invalidJson) {
    return READ_ARTIFACT_DIAGNOSTIC_CODES.invalidJson;
  }
  if (status === READ_ARTIFACT_FAILURE_STATUSES.invalidPayload) {
    return READ_ARTIFACT_DIAGNOSTIC_CODES.invalidPayload;
  }
  if (status === READ_ARTIFACT_FAILURE_STATUSES.readError) {
    return READ_ARTIFACT_DIAGNOSTIC_CODES.readError;
  }
  return null;
}

export function toArtifactValidationEntry({ path, kind, readResult }) {
  if (readResult.ok) {
    return {
      path,
      kind,
      payload: readResult.payload,
    };
  }

  const message = formatReadArtifactFailureMessage({
    readResult: { ...readResult, path },
    artifactLabel: 'report artifact',
    invalidMessage: readResult.message,
  });

  return {
    path,
    kind,
    errorType: readResult.status === READ_ARTIFACT_FAILURE_STATUSES.invalidJson ? 'invalid-json' : 'error',
    message,
  };
}
