import { deserializeState, serializeState } from './saveLoad.js';

export const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;

export function buildExportFilename(state) {
  const scenario = state.scenarioId ?? 'frontier';
  const day = state.day ?? 1;
  return `colony-frontier-${scenario}-day-${day}.json`;
}

export function downloadStateSnapshot(state) {
  const payload = serializeState(state);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = buildExportFilename(state);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function readStateFromFile(file) {
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error(`Save file too large. Max size is ${Math.floor(MAX_IMPORT_FILE_BYTES / 1024)} KB.`);
  }
  const payload = await file.text();
  return deserializeState(payload);
}
