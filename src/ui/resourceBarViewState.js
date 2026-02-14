export function buildResourceBarRows({
  resourceDefinitions,
  resources,
  resourceRates,
  mapDisplayedValue,
}) {
  return Object.entries(resourceDefinitions).map(([resourceId, definition]) => {
    const displayed = mapDisplayedValue(resourceId, resources[resourceId] ?? 0);
    const rounded = Math.floor(displayed);
    const rate = resourceRates[resourceId] ?? 0;
    return {
      id: resourceId,
      label: definition.label,
      roundedValue: rounded,
      rate,
      rateClassName: rate >= 0 ? 'positive' : 'negative',
    };
  });
}

