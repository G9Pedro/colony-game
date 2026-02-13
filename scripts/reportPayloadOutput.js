import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  validateReportPayloadByKind,
  withReportMeta,
} from '../src/game/reportPayloadValidators.js';

export function buildValidatedReportPayload(kind, payload, label = kind) {
  const wrappedPayload = withReportMeta(kind, payload);
  const validation = validateReportPayloadByKind(kind, wrappedPayload);
  if (!validation.ok) {
    throw new Error(`Unable to build valid ${label} payload: ${validation.reason}`);
  }
  return wrappedPayload;
}

export async function writeJsonArtifact(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(payload, null, 2), 'utf-8');
}

export async function writeTextArtifact(path, contents) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, 'utf-8');
}
