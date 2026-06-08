export function buildImageLookup(images = []) {
  const lookup = {};

  for (const image of images) {
    if (image.url) {
      if (image.filename) lookup[image.filename] = image.url;
      if (image.stored_name) lookup[image.stored_name] = image.url;
    }
  }

  return lookup;
}

export function resolveImageUrl(lookup, name) {
  if (!name || !lookup) return null;
  return lookup[name] || null;
}
