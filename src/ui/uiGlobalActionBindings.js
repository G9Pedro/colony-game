export function bindUIGlobalActions({
  elements,
  engine,
  getCallbacks,
  pushNotification,
}) {
  elements.pauseBtn.addEventListener('click', () => engine.togglePause());
  elements.speedButtons[0].addEventListener('click', () => engine.setSpeed(1));
  elements.speedButtons[1].addEventListener('click', () => engine.setSpeed(2));
  elements.speedButtons[2].addEventListener('click', () => engine.setSpeed(4));
  elements.hireBtn.addEventListener('click', () => {
    const result = engine.hireColonist();
    if (!result.ok) {
      pushNotification({ kind: 'error', message: result.message });
    }
  });

  elements.saveBtn.addEventListener('click', () => getCallbacks().onSave());
  elements.loadBtn.addEventListener('click', () => getCallbacks().onLoad());
  elements.exportBtn.addEventListener('click', () => getCallbacks().onExport());
  elements.importBtn.addEventListener('click', () => elements.importFileInput.click());
  elements.importFileInput.addEventListener('change', async (event) => {
    const [file] = event.target.files;
    if (!file) {
      return;
    }
    await getCallbacks().onImport(file);
    event.target.value = '';
  });
  elements.resetBtn.addEventListener('click', () => getCallbacks().onReset());
  elements.scenarioSelect.addEventListener('change', (event) =>
    getCallbacks().onScenarioChange(event.target.value),
  );
  elements.balanceProfileSelect.addEventListener('change', (event) =>
    getCallbacks().onBalanceProfileChange(event.target.value),
  );
  elements.rendererModeSelect.addEventListener('change', (event) => {
    const success = getCallbacks().onRendererModeChange(event.target.value);
    if (!success) {
      pushNotification({
        kind: 'warn',
        message: 'Requested renderer mode is unavailable. Falling back to isometric.',
      });
    }
  });
}

