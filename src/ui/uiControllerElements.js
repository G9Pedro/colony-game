export function createUIControllerElements(documentObject = document) {
  return {
    scenarioSelect: documentObject.getElementById('scenario-select'),
    balanceProfileSelect: documentObject.getElementById('balance-profile-select'),
    rendererModeSelect: documentObject.getElementById('renderer-mode-select'),
    renderStatsLabel: documentObject.getElementById('render-stats'),
    pauseBtn: documentObject.getElementById('pause-btn'),
    speedButtons: [
      documentObject.getElementById('speed-1-btn'),
      documentObject.getElementById('speed-2-btn'),
      documentObject.getElementById('speed-4-btn'),
    ],
    saveBtn: documentObject.getElementById('save-btn'),
    loadBtn: documentObject.getElementById('load-btn'),
    exportBtn: documentObject.getElementById('export-btn'),
    importBtn: documentObject.getElementById('import-btn'),
    importFileInput: documentObject.getElementById('import-file-input'),
    resetBtn: documentObject.getElementById('reset-btn'),
    hireBtn: documentObject.getElementById('hire-btn'),
    statusLabel: documentObject.getElementById('status-label'),
    dayLabel: documentObject.getElementById('day-label'),
    clockLabel: documentObject.getElementById('clock-label'),
    populationLabel: documentObject.getElementById('population-label'),
    moraleLabel: documentObject.getElementById('morale-label'),
    storageLabel: documentObject.getElementById('storage-label'),
    resourceList: documentObject.getElementById('resource-list'),
    buildCategories: documentObject.getElementById('build-categories'),
    buildList: documentObject.getElementById('build-list'),
    researchCurrent: documentObject.getElementById('research-current'),
    researchList: documentObject.getElementById('research-list'),
    objectivesList: documentObject.getElementById('objectives-list'),
    constructionList: documentObject.getElementById('construction-list'),
    colonistList: documentObject.getElementById('colonist-list'),
    metricsSummary: documentObject.getElementById('metrics-summary'),
    runHistory: documentObject.getElementById('run-history'),
    notifications: documentObject.getElementById('notifications'),
    messageBanner: documentObject.getElementById('message-banner'),
    hintBadge: documentObject.getElementById('hint-badge'),
    minimapCanvas: documentObject.getElementById('minimap-canvas'),
    infoPanelTitle: documentObject.getElementById('info-panel-title'),
    infoPanelBody: documentObject.getElementById('info-panel-body'),
  };
}

export function createUIControllerDefaultCallbacks() {
  return {
    onSave: () => {},
    onLoad: () => {},
    onExport: () => {},
    onImport: async () => {},
    onReset: () => {},
    onScenarioChange: () => {},
    onBalanceProfileChange: () => {},
    onRendererModeChange: () => true,
  };
}

