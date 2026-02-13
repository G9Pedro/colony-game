import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { readJsonArtifact } from './reportPayloadInput.js';

async function persistPayload(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(payload, null, 2), 'utf-8');
}

function assertPayloadShape({ path, payload, validatePayload, sourceLabel }) {
  if (typeof validatePayload !== 'function') {
    return;
  }
  if (validatePayload(payload)) {
    return;
  }
  throw new Error(`${sourceLabel} payload at "${path}" failed validation.`);
}

function toReadFailureError({ path, readResult }) {
  const readFailure = {
    ok: false,
    path,
    status: readResult?.status ?? 'error',
    message: readResult?.message ?? null,
    errorCode: readResult?.errorCode ?? null,
  };

  if (readResult?.status === 'invalid-json') {
    const error = new SyntaxError(readResult.message);
    error.cacheReadFailure = readFailure;
    return error;
  }

  const error = new Error(`Unable to read cached payload at "${path}": ${readResult?.message ?? 'read error'}`);
  if (readResult?.errorCode) {
    error.code = readResult.errorCode;
  }
  error.cacheReadFailure = readFailure;
  return error;
}

export async function loadJsonPayloadOrCompute({
  path,
  computePayload,
  recoverOnParseError = false,
  validatePayload = null,
  recoverOnInvalidPayload = false,
}) {
  const readResult = await readJsonArtifact(path);
  if (readResult.ok) {
    const payload = readResult.payload;
    const isValid = typeof validatePayload === 'function' ? validatePayload(payload) : true;
    if (isValid) {
      return {
        source: 'file',
        payload,
      };
    }

    if (!recoverOnInvalidPayload) {
      throw new Error(`Cached payload at "${path}" failed validation.`);
    }

    const repairedPayload = await computePayload();
    assertPayloadShape({
      path,
      payload: repairedPayload,
      validatePayload,
      sourceLabel: 'Recomputed',
    });
    await persistPayload(path, repairedPayload);
    return {
      source: 'recovered-from-invalid-payload',
      payload: repairedPayload,
    };
  }

  const shouldRecoverFromMissing = readResult.status === 'missing';
  const shouldRecoverFromInvalidJson =
    readResult.status === 'invalid-json' && recoverOnParseError;
  if (!shouldRecoverFromMissing && !shouldRecoverFromInvalidJson) {
    throw toReadFailureError({ path, readResult });
  }

  const payload = await computePayload();
  assertPayloadShape({
    path,
    payload,
    validatePayload,
    sourceLabel: 'Computed',
  });
  await persistPayload(path, payload);
  return {
    source: shouldRecoverFromMissing ? 'computed' : 'recovered-from-invalid-json',
    payload,
  };
}
