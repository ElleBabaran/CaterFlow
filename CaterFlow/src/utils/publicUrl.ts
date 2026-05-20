const STORAGE_KEY = 'caterflow_public_app_url';

export function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]'
  );
}

export function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

export function getStoredPublicAppUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? normalizeBaseUrl(stored) : null;
}

export function setStoredPublicAppUrl(url: string | null): void {
  if (typeof window === 'undefined') return;
  if (!url?.trim()) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, normalizeBaseUrl(url));
}

export function getEnvPublicAppUrl(): string | null {
  const env = import.meta.env.VITE_PUBLIC_APP_URL;
  return env ? normalizeBaseUrl(String(env)) : null;
}

/** Base URL encoded in order QR codes (env → saved override → current origin). */
export function getPublicAppBaseUrl(): string {
  const stored = getStoredPublicAppUrl();
  if (stored) return stored;
  const env = getEnvPublicAppUrl();
  if (env) return env;
  if (typeof window !== 'undefined') {
    return normalizeBaseUrl(window.location.origin);
  }
  return '';
}

export function buildOrderPublicUrl(orderId: string): string {
  const base = getPublicAppBaseUrl();
  return `${base}?orderId=${encodeURIComponent(orderId)}`;
}

export function isQrUrlLoopback(): boolean {
  try {
    const host = new URL(getPublicAppBaseUrl()).hostname;
    return isLoopbackHost(host);
  } catch {
    return true;
  }
}

export function getLoopbackQrHint(): string {
  if (typeof window === 'undefined') return '';
  const port = window.location.port || '5173';
  return `http://YOUR-PC-LAN-IP:${port}`;
}
