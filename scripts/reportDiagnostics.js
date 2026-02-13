export function isJsonDiagnosticsEnabled() {
  return process.env.REPORT_DIAGNOSTICS_JSON === '1';
}

export function emitJsonDiagnostic({
  level = 'info',
  code,
  message,
  context = null,
}) {
  if (!isJsonDiagnosticsEnabled()) {
    return;
  }

  const payload = {
    type: 'report-diagnostic',
    level,
    code,
    message,
    context,
  };

  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}
