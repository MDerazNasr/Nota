export function normalizeHref(url: string) {
  const trimmed = url.trim();

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) || trimmed.startsWith("mailto:")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}
