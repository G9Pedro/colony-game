import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

async function persistPayload(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(payload, null, 2), 'utf-8');
}

export async function loadJsonPayloadOrCompute({
  path,
  computePayload,
  recoverOnParseError = false,
  validatePayload = null,
  recoverOnInvalidPayload = false,
}) {
  try {
    const text = await readFile(path, 'utf-8');
    const payload = JSON.parse(text);
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
    await persistPayload(path, repairedPayload);
    return {
      source: 'recovered-from-invalid-payload',
      payload: repairedPayload,
    };
  } catch (error) {
    const isMissingFile = error?.code === 'ENOENT';
    const isParseError = error instanceof SyntaxError;

    if (!isMissingFile && !(recoverOnParseError && isParseError)) {
      throw error;
    }

    const payload = await computePayload();
    await persistPayload(path, payload);
    return {
      source: isMissingFile ? 'computed' : 'recovered-from-invalid-json',
      payload,
    };
  }
}
