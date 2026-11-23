import { useEffect, useState } from 'react';

function readPath() {
  const path = window.location.hash.replace(/^#/, '').split('?')[0];
  return decodeURIComponent(path) || '/';
}

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

export function usePath() {
  const [path, setPath] = useState(readPath);
  useEffect(() => subscribe(() => setPath(readPath())), []);
  return path;
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const part = patternParts[index];
    if (part.startsWith(':')) {
      params[part.slice(1)] = pathParts[index];
    } else if (part !== pathParts[index]) {
      return null;
    }
  }
  return params;
}

export function isPathActive(currentPath: string, href: string, exact = false) {
  if (currentPath === href) return true;
  return !exact && currentPath.startsWith(`${href}/`);
}
