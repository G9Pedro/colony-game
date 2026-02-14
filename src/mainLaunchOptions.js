export function parseMainLaunchParams(search = '') {
  const params = new URLSearchParams(search);
  return {
    seed: params.get('seed'),
    scenarioId: params.get('scenario'),
    balanceProfileId: params.get('balance'),
  };
}

export function buildMainEngineOptions({
  seed,
  scenarioId,
  balanceProfileId,
}) {
  return {
    ...(seed ? { seed } : {}),
    ...(scenarioId ? { scenarioId } : {}),
    ...(balanceProfileId ? { balanceProfileId } : {}),
  };
}
