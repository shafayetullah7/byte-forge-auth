export function resolveSellerUploadFolder(
  userId: string,
  subfolder?: string,
): string {
  const base = `sellers/${userId}`;
  if (!subfolder?.trim()) {
    return base;
  }

  if (subfolder.includes('..')) {
    return base;
  }

  const safe = subfolder
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .split('/')
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, ''))
    .filter(Boolean)
    .join('/');

  return safe ? `${base}/${safe}` : base;
}
