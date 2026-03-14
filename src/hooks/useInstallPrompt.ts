'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
const PWA_INSTALLED_KEY = 'pwaInstalled';
const PWA_IOS_DISMISSED_KEY = 'pwaIosDismissed';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const sessionDismissed = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIos(/iphone|ipad|ipod/.test(userAgent));
    }
  }, []);

  const pathname = usePathname();
  const params = useParams();
  const storeId = typeof params?.storeId === 'string' ? params.storeId : '';
  const isOnStoreHomepage = pathname === `/${storeId}`;
  const isOnRoadmap = pathname === '/devteam/roadmap';
  const isOnGrowthPortal = pathname === '/devteam/growth';

  // 1. Effect for capturing the browser event and checking standalone. Runs only once.
  useEffect(() => {
    // Check if the app is already running in standalone mode (installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      console.log('App is running in standalone mode. Skipping install prompt logic.');
      localStorage.setItem(PWA_INSTALLED_KEY, 'true');
      return;
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('beforeinstallprompt event captured.');
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed successfully!');
      setShowPrompt(false);
      localStorage.setItem(PWA_INSTALLED_KEY, 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 2. Effect for deciding WHEN to show the prompt.
  // This runs when the event is captured, or when the user navigates.
  useEffect(() => {
    // If the app is already marked as installed, don't show the prompt.
    if (typeof window !== 'undefined' && localStorage.getItem(PWA_INSTALLED_KEY) === 'true') {
      return;
    }

    // 3. SHOW PROMPT LOGIC
    if (isOnStoreHomepage || isOnRoadmap || isOnGrowthPortal) {
      if (sessionDismissed.current) {
        console.log('Prompt session-dismissed. Skipping.');
        return;
      }

      // Check iOS specific dismissal cooldown
      if (typeof window !== 'undefined' && isIos) {
        const iosDismissedAt = localStorage.getItem(PWA_IOS_DISMISSED_KEY);
        if (iosDismissedAt) {
          const timeSinceDismissal = new Date().getTime() - parseInt(iosDismissedAt, 10);
          if (timeSinceDismissal < THIRTY_DAYS) {
            console.log('iOS prompt in cooldown (dismissed recently). Skipping.');
            return;
          }
        }
      }

      const lastPrompted = localStorage.getItem(PWA_PROMPT_LAST_SHOWN_KEY);
      const now = new Date().getTime();

      if (!lastPrompted || (now - parseInt(lastPrompted, 10)) > TWENTY_FOUR_HOURS) {
        setShowPrompt(true);
        console.log('Prompt conditions met. Showing prompt.');
      } else {
        console.log('Not showing prompt, within 24-hour cooldown.');
      }
    }
  }, [deferredPrompt, isOnStoreHomepage, isOnRoadmap, isOnGrowthPortal]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    sessionDismissed.current = true;

    if (typeof window !== 'undefined') {
      const now = new Date().getTime();
      localStorage.setItem(PWA_PROMPT_LAST_SHOWN_KEY, now.toString());
    }

    if (showIosInstructions) {
      setShowIosInstructions(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem(PWA_IOS_DISMISSED_KEY, new Date().getTime().toString());
      }
    }
    console.log('PWA prompt UI dismissed by user.');
  }, [showIosInstructions]);

  const handleInstall = useCallback(() => {
    if (!deferredPrompt) {
      if (isIos) {
        setShowIosInstructions(true);
      } else {
        alert("Browser didn't provide install prompt. You can install via the browser menu (Install App menu in Chrome).");
        setShowPrompt(false);
      }
      return;
    }

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log(`PWA install prompt outcome: ${choiceResult.outcome}`);
      setShowPrompt(false);
    });

  }, [deferredPrompt, isIos]);

  return { showPrompt, handleInstall, handleDismiss, isInstallAvailable: !!deferredPrompt, isIos, showIosInstructions, setShowIosInstructions };
}
