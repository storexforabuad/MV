'use client';

/**
 * SuperAdmin Session Management
 * Handles persistent access to the platform pulse dashboard.
 */

const SUPER_ADMIN_KEY = 'sa_session_v1';
const SA_AUTH_FLAG = 'sa_authenticated';

export interface SuperAdminSession {
    isRoot: boolean;
    expiresAt: number;
    lastPulse: number;
}

export const getSuperAdminSession = (): SuperAdminSession | null => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(SUPER_ADMIN_KEY);
    if (!saved) return null;

    try {
        const session: SuperAdminSession = JSON.parse(saved);
        if (Date.now() > session.expiresAt) {
            localStorage.removeItem(SUPER_ADMIN_KEY);
            return null;
        }
        return session;
    } catch {
        return null;
    }
};

export const createSuperAdminSession = () => {
    if (typeof window === 'undefined') return;
    const session: SuperAdminSession = {
        isRoot: true,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        lastPulse: Date.now()
    };
    localStorage.setItem(SUPER_ADMIN_KEY, JSON.stringify(session));
    localStorage.setItem(SA_AUTH_FLAG, 'true');
};

export const clearSuperAdminSession = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SUPER_ADMIN_KEY);
    localStorage.removeItem(SA_AUTH_FLAG);
};

export const isSuperAdmin = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SA_AUTH_FLAG) === 'true';
};
