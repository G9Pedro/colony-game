export function bootstrapMainUI({
  ui,
  renderer,
  engine,
  scenarioDefinitions,
  balanceProfileDefinitions,
}) {
  ui.attachRenderer(renderer);
  ui.setRendererModeOptions(
    renderer.getAvailableModes?.() ?? ['isometric'],
    renderer.getRendererMode?.() ?? 'isometric',
  );
  ui.setScenarioOptions(Object.values(scenarioDefinitions), engine.state.scenarioId);
  ui.setBalanceProfileOptions(
    Object.values(balanceProfileDefinitions),
    engine.state.balanceProfileId,
  );
}
