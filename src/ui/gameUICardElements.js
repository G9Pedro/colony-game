export function createImageCanvasNode(image, className, documentObject = document) {
  const node = documentObject.createElement('canvas');
  node.width = image.width;
  node.height = image.height;
  node.className = className;
  node.getContext('2d').drawImage(image, 0, 0);
  return node;
}

export function createResourceChipElement({ row, icon, formatRate, documentObject = document }) {
  const card = documentObject.createElement('div');
  card.className = 'resource-chip';

  const iconNode = createImageCanvasNode(icon, 'resource-icon', documentObject);

  const name = documentObject.createElement('span');
  name.className = 'resource-name';
  name.textContent = row.label;
  const value = documentObject.createElement('strong');
  value.textContent = `${row.roundedValue}`;
  const delta = documentObject.createElement('small');
  delta.textContent = formatRate(row.rate);
  delta.className = row.rateClassName;

  const labelWrap = documentObject.createElement('div');
  labelWrap.className = 'resource-meta';
  labelWrap.append(name, value, delta);
  card.append(iconNode, labelWrap);
  return card;
}

export function createBuildCategoryButton({ row, onSelectCategory, documentObject = document }) {
  const button = documentObject.createElement('button');
  button.className = `category-pill ${row.active ? 'active' : ''}`;
  button.textContent = row.label;
  button.addEventListener('click', () => onSelectCategory(row.id));
  return button;
}

export function createBuildCardElement({
  row,
  thumbnail,
  onToggleBuildType,
  documentObject = document,
}) {
  const card = documentObject.createElement('button');
  card.className = `build-card ${row.active ? 'active' : ''}`;
  card.disabled = !row.unlocked;
  card.type = 'button';
  card.addEventListener('click', () => onToggleBuildType(row.id));

  const thumbNode = createImageCanvasNode(thumbnail, 'build-thumb', documentObject);

  const title = documentObject.createElement('strong');
  title.textContent = row.name;
  const subtitle = documentObject.createElement('small');
  subtitle.textContent = row.subtitle;
  if (row.warning) {
    subtitle.classList.add('warning');
  }

  const meta = documentObject.createElement('span');
  meta.className = 'build-meta';
  meta.append(title, subtitle);
  card.append(thumbNode, meta);
  return card;
}

