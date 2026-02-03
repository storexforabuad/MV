'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const PWA_INTENDED_PATH_KEY = 'pwa_intended_path';
const PWA_PATH_TIMESTAMP_KEY = 'pwa_path_timestamp';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function usePWARedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAtStartUrl = pathname === '/start' || pathname === '/start/';

  useEffect(() => {
    if (!isAtStartUrl) return;

    try {
      // Check for query param fallback first
      const codeFromQuery = searchParams.get('code');
      if (codeFromQuery) {
        localStorage.setItem(PWA_INTENDED_PATH_KEY, `/start/${codeFromQuery}/dashboard`);
        localStorage.setItem(PWA_PATH_TIMESTAMP_KEY, new Date().getTime().toString());
        router.push(`/start/${codeFromQuery}/dashboard`);
        return;
      }

      // Check for saved path in localStorage
      const savedPath = localStorage.getItem(PWA_INTENDED_PATH_KEY);
      const savedTimestamp = localStorage.getItem(PWA_PATH_TIMESTAMP_KEY);

      if (savedPath && savedTimestamp) {
        const now = new Date().getTime();
        const pathAge = now - parseInt(savedTimestamp, 10);

        // If path is less than 30 days old, use it
        if (pathAge < THIRTY_DAYS_MS) {
          // Clear the saved path so it doesn't auto-redirect on next open
          // (user can manually go back to /start/ and it will show the form again)
          localStorage.removeItem(PWA_INTENDED_PATH_KEY);
          localStorage.removeItem(PWA_PATH_TIMESTAMP_KEY);

          // Redirect to the saved path
          router.push(savedPath);
          return;
        } else {
          // Path is stale, clear it
          localStorage.removeItem(PWA_INTENDED_PATH_KEY);
          localStorage.removeItem(PWA_PATH_TIMESTAMP_KEY);
        }
      }

      // No valid saved path and no query param — stay on /start/ to show code entry form
    } catch (error) {
      console.warn('PWA redirect error:', error);
      // Continue normally if localStorage fails
    }
  }, [isAtStartUrl, pathname, searchParams, router]);
}
