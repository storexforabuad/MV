'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useParams } from 'next/navigation';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const PWA_PROMPT_LAST_SHOWN_KEY = 'pwaPromptLastShown';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const pathname = usePathname();
  const params = useParams();
  const storeId = typeof params?.storeId === 'string' ? params.storeId : '';
  const isOnStoreHomepage = pathname === `/${storeId}`;
  const isOnRoadmap = pathname === '/devteam/roadmap';

  // 1. Effect for capturing the browser event. Runs only once.
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('beforeinstallprompt event captured.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 2. Effect for deciding WHEN to show the prompt.
  // This runs when the event is captured, or when the user navigates.
  useEffect(() => {
    if (deferredPrompt && (isOnStoreHomepage || isOnRoadmap)) {
      const lastPrompted = localStorage.getItem(PWA_PROMPT_LAST_SHOWN_KEY);
      const now = new Date().getTime();

      if (!lastPrompted || (now - parseInt(lastPrompted, 10)) > TWENTY_FOUR_HOURS) {
        setShowPrompt(true);
        localStorage.setItem(PWA_PROMPT_LAST_SHOWN_KEY, now.toString());
        console.log('Prompt conditions met. Showing prompt and starting 24-hour cooldown.');
      } else {
        console.log('Not showing prompt, within 24-hour cooldown.');
      }
    }
  }, [deferredPrompt, isOnStoreHomepage]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    console.log('PWA prompt UI dismissed by user.');
  }, []);

  const handleInstall = useCallback(() => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log(`PWA install prompt outcome: ${choiceResult.outcome}`);
      setShowPrompt(false);
    });

  }, [deferredPrompt]);

  return { showPrompt, handleInstall, handleDismiss };
}
