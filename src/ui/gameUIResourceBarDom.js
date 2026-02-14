export function renderGameUIResourceBar({
  elements,
  resourceDefinitions,
  resources,
  resourceRates,
  valueAnimator,
  spriteFactory,
  buildResourceBarRows,
  createResourceChipElement,
  formatRate,
}) {
  elements.resourceList.innerHTML = '';
  const rows = buildResourceBarRows({
    resourceDefinitions,
    resources,
    resourceRates,
    mapDisplayedValue: (resourceId, value) => valueAnimator.tweenValue(`resource:${resourceId}`, value),
  });

  rows.forEach((row) => {
    const icon = spriteFactory.getResourceIcon(row.id, 20);
    const card = createResourceChipElement({
      row,
      icon,
      formatRate,
    });
    elements.resourceList.appendChild(card);
  });
}

