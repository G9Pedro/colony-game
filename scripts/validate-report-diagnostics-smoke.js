import { isValidDiagnosticsSmokeSummaryPayload } from './reportDiagnosticsSmokeSummary.js';
import { readJsonArtifact } from './reportPayloadInput.js';

const outputPath =
  process.env.REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH ?? 'reports/report-diagnostics-smoke.json';

function formatReadFailure(readResult) {
  if (readResult.status === 'missing') {
    return `Missing diagnostics smoke report at "${readResult.path}".`;
  }
  if (readResult.status === 'invalid-json') {
    return `Diagnostics smoke report at "${readResult.path}" is not valid JSON.`;
  }
  return `Unable to read diagnostics smoke report at "${readResult.path}": ${readResult.message}`;
}

async function main() {
  const readResult = await readJsonArtifact(outputPath);
  if (!readResult.ok) {
    console.error(formatReadFailure(readResult));
    process.exit(1);
  }

  if (!isValidDiagnosticsSmokeSummaryPayload(readResult.payload)) {
    console.error(
      `Diagnostics smoke report at "${outputPath}" failed contract validation (type/schema/count invariants).`,
    );
    process.exit(1);
  }

  if (readResult.payload.failedScenarioCount > 0) {
    console.error(
      `Diagnostics smoke report indicates ${readResult.payload.failedScenarioCount} failed scenario(s).`,
    );
    process.exit(1);
  }

  console.log(
    `Diagnostics smoke report is valid and passing: scenarios=${readResult.payload.scenarioCount}, diagnostics=${readResult.payload.diagnosticsCount}`,
  );
}

await main();
