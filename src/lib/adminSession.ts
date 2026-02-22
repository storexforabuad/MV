// Admin session helpers — localStorage-based session persistence
// Key: admin_session_<storeId>
// TTL: 7 days

const KEY = (storeId: string) => `admin_session_${storeId}`;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AdminSession {
    storeId: string;
    grantedAt: number;
    expiresAt: number;
}

/** Returns a valid session or null (clears expired sessions automatically). */
export function getAdminSession(storeId: string): AdminSession | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(KEY(storeId));
        if (!raw) return null;
        const session: AdminSession = JSON.parse(raw);
        if (Date.now() > session.expiresAt) {
            localStorage.removeItem(KEY(storeId));
            return null;
        }
        return session;
    } catch {
        return null;
    }
}

/** Saves a new session for the given storeId (replaces any existing one). */
export function saveAdminSession(storeId: string): void {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    const session: AdminSession = {
        storeId,
        grantedAt: now,
        expiresAt: now + SESSION_TTL_MS,
    };
    localStorage.setItem(KEY(storeId), JSON.stringify(session));
}

/** Removes the session — call on logout. */
export function clearAdminSession(storeId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEY(storeId));
}
