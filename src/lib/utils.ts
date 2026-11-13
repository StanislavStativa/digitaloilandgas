export function getBaseUrl(host?: string | null): string {
  if (host) {
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    return `${protocol}://${host}`;
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  );
}

export function getFullUrl(path: string, host?: string | null): string {
  const baseUrl = getBaseUrl(host);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Sitecore checkbox value → boolean. Edge returns true/false, some serializers "1"/"".
 * Only a missing value (undefined/null) uses `fallback`; an explicit false/""/"0" stays false.
 * Pass the raw value, e.g. `readCheckbox(getFieldValue(datasource?.showArrows)?.value, true)`.
 */
export function readCheckbox(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") return ["1", "true"].includes(value.trim().toLowerCase());
  return value === true || value === 1;
}
