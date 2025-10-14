'use client';

import { createContext, useContext, useState, useMemo, useCallback } from 'react';

export type SpotlightStep = 'inactive' | 'tips' | 'nav';

interface SpotlightContextType {
  spotlightStep: SpotlightStep;
  setSpotlightStep: (step: SpotlightStep) => void;
  completeSpotlight: () => void;
  isTipsSpotlightActive: boolean;
  setIsTipsSpotlightActive: (isActive: boolean) => void;
}

const SpotlightContext = createContext<SpotlightContextType | undefined>(undefined);

export function SpotlightProvider({ children }: { children: React.ReactNode }) {
  const [spotlightStep, setSpotlightStep] = useState<SpotlightStep>('inactive');
  const [isTipsSpotlightActive, setIsTipsSpotlightActive] = useState(false);

  const completeSpotlight = useCallback(() => {
    localStorage.setItem('hasCompletedSpotlight', 'true');
    setSpotlightStep('inactive');
  }, []);

  const contextValue = useMemo(() => ({
    spotlightStep,
    setSpotlightStep,
    completeSpotlight,
    isTipsSpotlightActive,
    setIsTipsSpotlightActive,
  }), [spotlightStep, completeSpotlight, isTipsSpotlightActive]);

  return (
    <SpotlightContext.Provider value={contextValue}>
      {children}
    </SpotlightContext.Provider>
  );
}

export function useSpotlightContext() {
  const context = useContext(SpotlightContext);
  if (context === undefined) {
    throw new Error('useSpotlightContext must be used within a SpotlightProvider');
  }
  return context;
}
