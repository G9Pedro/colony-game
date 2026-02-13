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
