export function formatCost(cost) {
  return Object.entries(cost)
    .map(([resource, amount]) => `${amount} ${resource}`)
    .join(', ');
}

export function percent(part, whole) {
  if (whole <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (part / whole) * 100));
}

export function formatRate(value) {
  const rounded = Math.abs(value) < 0.05 ? 0 : value;
  if (rounded === 0) {
    return '±0/day';
  }
  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}/day`;
}

