/**
 * Normalizes a link or route path for comparison: drops the query string and hash,
 * lowercases it and removes trailing slashes. The home page becomes "/", an empty path stays "".
 */
export const normalizePath = (path?: string | null): string => {
  if (!path) return '';
  const clean = path.split(/[?#]/)[0].toLowerCase().replace(/\/+$/, '');
  return clean || '/';
};
