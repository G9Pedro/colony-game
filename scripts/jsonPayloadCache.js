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
}) {
  try {
    const text = await readFile(path, 'utf-8');
    return {
      source: 'file',
      payload: JSON.parse(text),
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
