export function getOrCreateCachedSprite(cache, key, createValue) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const value = createValue();
  cache.set(key, value);
  return value;
}

