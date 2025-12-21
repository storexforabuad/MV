const STORAGE_PREFIX = 'vendor-attempts:';
export const DEFAULT_MAX_ATTEMPTS = 5;
export const DEFAULT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

type AttemptRecord = {
  count: number;
  firstTs: number;
};

function key(storeId: string) {
  return `${STORAGE_PREFIX}${storeId}`;
}

function readRaw(storeId: string): AttemptRecord | null {
  try {
    const raw = sessionStorage.getItem(key(storeId));
    if (!raw) return null;
    return JSON.parse(raw) as AttemptRecord;
  } catch {
    return null;
  }
}

function writeRaw(storeId: string, rec: AttemptRecord) {
  try {
    sessionStorage.setItem(key(storeId), JSON.stringify(rec));
  } catch {}
}

export function clearAttempts(storeId: string) {
  try {
    sessionStorage.removeItem(key(storeId));
  } catch {}
}

export function getAttemptState(storeId: string, windowMs = DEFAULT_WINDOW_MS, maxAttempts = DEFAULT_MAX_ATTEMPTS) {
  const now = Date.now();
  const rec = readRaw(storeId);
  if (!rec) return { count: 0, locked: false, attemptsLeft: maxAttempts, retryAfterMs: 0 };
  if (now - rec.firstTs > windowMs) {
    // window expired
    return { count: 0, locked: false, attemptsLeft: maxAttempts, retryAfterMs: 0 };
  }
  const locked = rec.count >= maxAttempts;
  const retryAfterMs = locked ? windowMs - (now - rec.firstTs) : 0;
  return { count: rec.count, locked, attemptsLeft: Math.max(0, maxAttempts - rec.count), retryAfterMs };
}

export function recordFailure(storeId: string, windowMs = DEFAULT_WINDOW_MS, maxAttempts = DEFAULT_MAX_ATTEMPTS) {
  const now = Date.now();
  const rec = readRaw(storeId);
  if (!rec || now - rec.firstTs > windowMs) {
    const newRec = { count: 1, firstTs: now };
    writeRaw(storeId, newRec);
    return getAttemptState(storeId, windowMs, maxAttempts);
  }
  const updated = { count: rec.count + 1, firstTs: rec.firstTs };
  writeRaw(storeId, updated);
  return getAttemptState(storeId, windowMs, maxAttempts);
}

export function formatMs(ms: number) {
  if (!ms || ms <= 0) return '0s';
  const total = Math.floor(ms / 1000);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export default {
  getAttemptState,
  recordFailure,
  clearAttempts,
  formatMs,
};
