import { SCENARIO_DEFINITIONS } from './scenarios.js';
import { buildScenarioTuningSignature } from './scenarioTuningSignature.js';

function round(value) {
  return Number(value.toFixed(2));
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function buildDeltaEntries(map = {}) {
  if (!map || typeof map !== 'object') {
    return [];
  }

  return Object.entries(map)
    .filter(([, value]) => isFiniteNumber(value) && value !== 1)
    .map(([key, value]) => ({
      key,
      multiplier: round(value),
      deltaPercent: round((value - 1) * 100),
      absDeltaPercent: round(Math.abs((value - 1) * 100)),
    }))
    .sort((a, b) => b.absDeltaPercent - a.absDeltaPercent || a.key.localeCompare(b.key));
}

function buildDeltaSummary(entries) {
  const count = entries.length;
  if (count === 0) {
    return {
      count: 0,
      meanAbsDeltaPercent: 0,
      maxAbsDeltaPercent: 0,
    };
  }

  const totalAbs = entries.reduce((sum, entry) => sum + entry.absDeltaPercent, 0);
  const maxAbs = entries.reduce((max, entry) => Math.max(max, entry.absDeltaPercent), 0);
  return {
    count,
    meanAbsDeltaPercent: round(totalAbs / count),
    maxAbsDeltaPercent: round(maxAbs),
  };
}

function formatDeltaEntry(entry) {
  const sign = entry.deltaPercent > 0 ? '+' : '';
  return `${entry.key} ${sign}${entry.deltaPercent}% (x${entry.multiplier})`;
}

export function buildScenarioTuningDashboard(scenarios = SCENARIO_DEFINITIONS) {
  const scenarioCards = Object.values(scenarios)
    .map((scenario) => {
      const resourceOutputDeltas = buildDeltaEntries(scenario.productionMultipliers?.resource ?? {});
      const jobOutputDeltas = buildDeltaEntries(scenario.productionMultipliers?.job ?? {});
      const jobPriorityDeltas = buildDeltaEntries(scenario.jobPriorityMultipliers ?? {});
      const allDeltas = [...resourceOutputDeltas, ...jobOutputDeltas, ...jobPriorityDeltas];
      const totalAbsDeltaPercent = round(
        allDeltas.reduce((sum, entry) => sum + entry.absDeltaPercent, 0),
      );

      return {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        signature: buildScenarioTuningSignature(scenario),
        resourceOutputDeltas,
        jobOutputDeltas,
        jobPriorityDeltas,
        resourceOutputSummary: buildDeltaSummary(resourceOutputDeltas),
        jobOutputSummary: buildDeltaSummary(jobOutputDeltas),
        jobPrioritySummary: buildDeltaSummary(jobPriorityDeltas),
        totalAbsDeltaPercent,
        isNeutral: allDeltas.length === 0,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const ranking = [...scenarioCards]
    .sort((a, b) => b.totalAbsDeltaPercent - a.totalAbsDeltaPercent || a.id.localeCompare(b.id))
    .map((scenario, index) => ({
      rank: index + 1,
      scenarioId: scenario.id,
      totalAbsDeltaPercent: scenario.totalAbsDeltaPercent,
    }));

  return {
    scenarioCount: scenarioCards.length,
    activeScenarioCount: scenarioCards.filter((scenario) => !scenario.isNeutral).length,
    scenarios: scenarioCards,
    signatureMap: Object.fromEntries(
      scenarioCards
        .map((scenario) => [scenario.id, scenario.signature])
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
    ranking,
  };
}

export function buildScenarioTuningDashboardMarkdown(dashboard) {
  const lines = [
    '# Scenario Tuning Dashboard',
    '',
    `- Scenarios: ${dashboard.scenarioCount}`,
    `- Active tuning scenarios: ${dashboard.activeScenarioCount}`,
    '',
    '## Tuning Intensity Ranking',
    '',
  ];

  dashboard.ranking.forEach((item) => {
    lines.push(
      `${item.rank}. ${item.scenarioId} — total |delta| ${item.totalAbsDeltaPercent.toFixed(2)}%`,
    );
  });

  lines.push('', '## Scenario Details', '');
  for (const scenario of dashboard.scenarios) {
    lines.push(`### ${scenario.name} (${scenario.id})`);
    lines.push(`- ${scenario.description}`);
    if (scenario.isNeutral) {
      lines.push('- Neutral tuning (no non-1 multipliers).', '');
      continue;
    }

    if (scenario.resourceOutputDeltas.length > 0) {
      lines.push(
        `- Resource output deltas: ${scenario.resourceOutputDeltas.map(formatDeltaEntry).join(', ')}`,
      );
    }
    if (scenario.jobOutputDeltas.length > 0) {
      lines.push(`- Job output deltas: ${scenario.jobOutputDeltas.map(formatDeltaEntry).join(', ')}`);
    }
    if (scenario.jobPriorityDeltas.length > 0) {
      lines.push(
        `- Job priority deltas: ${scenario.jobPriorityDeltas.map(formatDeltaEntry).join(', ')}`,
      );
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}
