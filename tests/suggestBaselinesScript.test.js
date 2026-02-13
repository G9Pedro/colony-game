import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import { isValidBaselineSuggestionPayload } from '../src/game/reportPayloadValidatorsBaseline.js';
import { runNodeDiagnosticsScript } from './helpers/reportDiagnosticsScriptTestUtils.js';

test('suggest baselines script writes schema-valid baseline suggestion payload', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'baseline-suggest-script-'));
  const outputPath = path.join(tempDirectory, 'baseline-suggestions.json');
  const markdownPath = path.join(tempDirectory, 'baseline-suggestions.md');
  const scriptPath = path.resolve('scripts/suggest-baselines.js');

  try {
    const { stdout } = await runNodeDiagnosticsScript(scriptPath, {
      env: {
        SIM_BASELINE_SUGGEST_PATH: outputPath,
        SIM_BASELINE_SUGGEST_MD_PATH: markdownPath,
        SIM_BASELINE_SUGGEST_RUNS: '2',
      },
    });

    const payload = JSON.parse(await readFile(outputPath, 'utf-8'));
    assert.equal(payload.meta.kind, REPORT_KINDS.baselineSuggestions);
    assert.equal(isValidBaselineSuggestionPayload(payload), true);
    assert.match(stdout, /Baseline suggestions written to:/);
    assert.match(stdout, /Changed snapshot signatures detected:/);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
