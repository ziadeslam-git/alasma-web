// Hostnames (no scheme, no port) that may load the DEV server's assets and HMR socket besides localhost. Next blocks
// every other origin in development, so a phone opening http://<pc-lan-ip>:3000 gets the HTML but never hydrates (no
// typing, disabled buttons). Production builds ignore this setting, and this function returns nothing there anyway.
//
// DEV_ALLOWED_ORIGINS="192.168.1.8,*.local-origin.dev" (comma separated) replaces the default list. In Next's syntax a
// `*` stands for exactly one label, so the default covers the usual home networks (192.168.x.y) and nothing else.
export const DEFAULT_DEV_ALLOWED_ORIGINS = ['192.168.*.*'] as const;

export function getDevAllowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  if (env.NODE_ENV === 'production') {
    return [];
  }

  const fromEnv = (env.DEV_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return fromEnv.length > 0 ? fromEnv : [...DEFAULT_DEV_ALLOWED_ORIGINS];
}
