export const DEFAULT_THUMBNAIL =
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=225&fit=crop';

export const sanitizeThumbnailUrls = (thumbnails: string[]): string[] =>
  thumbnails
    .map((thumbnail) => thumbnail.trim())
    .filter((thumbnail) => thumbnail.length > 0);

export const resolveEditorThumbnails = (
  thumbnail: string,
  thumbnails?: string[]
): string[] => {
  const normalized = sanitizeThumbnailUrls(thumbnails ?? []);
  if (normalized.length > 0) {
    return normalized;
  }

  const legacyThumbnail = thumbnail.trim();
  return legacyThumbnail ? [legacyThumbnail] : [];
};

export const getPrimaryThumbnail = (
  thumbnails: string[],
  fallback = DEFAULT_THUMBNAIL
): string => {
  const normalized = sanitizeThumbnailUrls(thumbnails);
  return normalized[0] || fallback;
};
