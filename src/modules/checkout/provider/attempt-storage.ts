export const ATTEMPT_TTL_MS = 30 * 60 * 1000;
const ATTEMPT_STORAGE_KEY = 'alasma-checkout-attempt';

export type StoredAttempt = { key: string; fingerprintHash: string; createdAt: number };

function storage(): Storage | null {
  try {
    // eslint-disable-next-line no-restricted-globals -- approved exception 2026-11-03
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function readAttempt(now = Date.now()): StoredAttempt | null {
  try {
    const value: unknown = JSON.parse(storage()?.getItem(ATTEMPT_STORAGE_KEY) ?? 'null');
    if (
      typeof value !== 'object' ||
      value === null ||
      !('key' in value) ||
      typeof value.key !== 'string' ||
      !('fingerprintHash' in value) ||
      typeof value.fingerprintHash !== 'string' ||
      !('createdAt' in value) ||
      typeof value.createdAt !== 'number' ||
      now - value.createdAt >= ATTEMPT_TTL_MS ||
      value.createdAt > now
    ) {
      clearAttempt();
      return null;
    }
    return { key: value.key, fingerprintHash: value.fingerprintHash, createdAt: value.createdAt };
  } catch {
    return null;
  }
}

export function writeAttempt(attempt: StoredAttempt): void {
  try {
    storage()?.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(attempt));
  } catch {
    // The caller retains the attempt in memory when storage is unavailable.
  }
}

export function clearAttempt(): void {
  try {
    storage()?.removeItem(ATTEMPT_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private browsing.
  }
}
