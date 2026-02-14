export function handleHireColonistAction(engine, pushNotification) {
  const result = engine.hireColonist();
  if (!result.ok) {
    pushNotification({ kind: 'error', message: result.message });
  }
}

export async function handleImportFileChangeAction(event, getCallbacks) {
  const [file] = event.target.files;
  if (!file) {
    return;
  }
  await getCallbacks().onImport(file);
  event.target.value = '';
}

export function handleRendererModeChangeAction(value, getCallbacks, pushNotification) {
  const success = getCallbacks().onRendererModeChange(value);
  if (!success) {
    pushNotification({
      kind: 'warn',
      message: 'Requested renderer mode is unavailable. Falling back to isometric.',
    });
  }
}

