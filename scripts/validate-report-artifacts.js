import { readFile } from 'node:fs/promises';
import {
  REPORT_KINDS,
  validateReportPayloadByKind,
} from '../src/game/reportPayloadValidators.js';

const DEFAULT_REPORT_TARGETS = [
  { path: 'reports/scenario-tuning-validation.json', kind: REPORT_KINDS.scenarioTuningValidation },
  { path: 'reports/scenario-tuning-dashboard.json', kind: REPORT_KINDS.scenarioTuningDashboard },
  {
    path: 'reports/scenario-tuning-baseline-suggestions.json',
    kind: REPORT_KINDS.scenarioTuningBaselineSuggestions,
  },
  { path: 'reports/baseline-suggestions.json', kind: REPORT_KINDS.baselineSuggestions },
];

let hasFailure = false;
for (const target of DEFAULT_REPORT_TARGETS) {
  try {
    const payloadText = await readFile(target.path, 'utf-8');
    const payload = JSON.parse(payloadText);
    const validation = validateReportPayloadByKind(target.kind, payload);

    if (!validation.ok) {
      hasFailure = true;
      console.error(`[invalid] ${target.path}: ${validation.reason}`);
      continue;
    }

    console.log(`[ok] ${target.path}: kind=${target.kind}`);
  } catch (error) {
    hasFailure = true;
    if (error instanceof SyntaxError) {
      console.error(`[invalid-json] ${target.path}: ${error.message}`);
    } else {
      console.error(`[error] ${target.path}: ${error.message}`);
    }
  }
}

if (hasFailure) {
  process.exit(1);
}
