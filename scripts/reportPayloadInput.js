import { readFile } from 'node:fs/promises';
import { validateReportPayloadByKind } from '../src/game/reportPayloadValidators.js';
import { REPORT_DIAGNOSTIC_CODES } from './reportDiagnostics.js';

export const READ_ARTIFACT_DIAGNOSTIC_CODES = Object.freeze({
  missing: REPORT_DIAGNOSTIC_CODES.artifactMissing,
  invalidJson: REPORT_DIAGNOSTIC_CODES.artifactInvalidJson,
  invalidPayload: REPORT_DIAGNOSTIC_CODES.artifactInvalidPayload,
  readError: REPORT_DIAGNOSTIC_CODES.artifactReadError,
});

function classifyReadFailure(path, error) {
  if (error?.code === 'ENOENT') {
    return {
      ok: false,
      path,
      status: 'missing',
      message: error.message,
      errorCode: error.code,
    };
  }

  return {
    ok: false,
    path,
    status: 'error',
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
      status: 'invalid-json',
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
      status: 'invalid',
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

  if (readResult.status === 'missing') {
    return READ_ARTIFACT_DIAGNOSTIC_CODES.missing;
  }

  if (readResult.status === 'invalid-json') {
    return READ_ARTIFACT_DIAGNOSTIC_CODES.invalidJson;
  }

  if (readResult.status === 'invalid') {
    return READ_ARTIFACT_DIAGNOSTIC_CODES.invalidPayload;
  }

  return READ_ARTIFACT_DIAGNOSTIC_CODES.readError;
}

export function buildReadArtifactFailureLabel(readResult) {
  if (!readResult || readResult.ok) {
    return null;
  }

  if (readResult.status === 'missing') {
    return 'missing file';
  }

  if (readResult.status === 'invalid-json') {
    return 'invalid JSON';
  }

  if (readResult.status === 'invalid') {
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
  if (status === 'invalid-json') {
    return READ_ARTIFACT_DIAGNOSTIC_CODES.invalidJson;
  }
  if (status === 'invalid') {
    return READ_ARTIFACT_DIAGNOSTIC_CODES.invalidPayload;
  }
  if (status === 'error') {
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

  const message =
    readResult.status === 'missing'
      ? `Missing report artifact at "${path}".`
      : readResult.status === 'invalid-json'
        ? 'Invalid JSON payload.'
        : readResult.message;

  return {
    path,
    kind,
    errorType: readResult.status === 'invalid-json' ? 'invalid-json' : 'error',
    message,
  };
}
