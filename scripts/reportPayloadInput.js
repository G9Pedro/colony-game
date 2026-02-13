import { readFile } from 'node:fs/promises';
import { validateReportPayloadByKind } from '../src/game/reportPayloadValidators.js';

export async function readJsonArtifact(path) {
  try {
    const payloadText = await readFile(path, 'utf-8');
    return {
      ok: true,
      path,
      payload: JSON.parse(payloadText),
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        ok: false,
        path,
        status: 'missing',
        message: error.message,
        errorCode: error.code,
      };
    }

    if (error instanceof SyntaxError) {
      return {
        ok: false,
        path,
        status: 'invalid-json',
        message: error.message,
        errorCode: null,
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

export function toArtifactValidationEntry({ path, kind, readResult }) {
  if (readResult.ok) {
    return {
      path,
      kind,
      payload: readResult.payload,
    };
  }

  return {
    path,
    kind,
    errorType: readResult.status === 'invalid-json' ? 'invalid-json' : 'error',
    message: readResult.message,
  };
}
