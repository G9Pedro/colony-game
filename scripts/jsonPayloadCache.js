import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function loadJsonPayloadOrCompute({
  path,
  computePayload,
}) {
  try {
    const text = await readFile(path, 'utf-8');
    return {
      source: 'file',
      payload: JSON.parse(text),
    };
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }

    const payload = await computePayload();
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(payload, null, 2), 'utf-8');
    return {
      source: 'computed',
      payload,
    };
  }
}
