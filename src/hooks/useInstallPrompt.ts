'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function useInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = sessionStorage.getItem('pwaPromptDismissed');
    
    if (!dismissed) {
      console.log('Setting up beforeinstallprompt listener'); // Debug log

      const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
        console.log('Received beforeinstallprompt event'); // Debug log
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Debug check for PWA criteria
      if ('standalone' in navigator) {
        console.log('App is installable');
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    } else {
      console.log('Prompt was previously dismissed this session'); // Debug log
    }
  }, []);

  return { showPrompt, setShowPrompt, deferredPrompt };
}
