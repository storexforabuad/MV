import { useState, useEffect } from 'react';

export function useConnectionCheck(timeout = 10000) {
  const [isConnectionError, setIsConnectionError] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch('/api/ping', {
          signal: controller.signal,
          // Add cache control to prevent caching
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        
        clearTimeout(timeoutId);

        const data = await response.json();
        
        if (!response.ok || data.status !== 'ok') {
          setIsConnectionError(true);
          console.error('Connection check failed:', response.status);
        } else {
          setIsConnectionError(false);
        }
      } catch (fetchError: unknown) {
        setIsConnectionError(true);
        if (fetchError instanceof Error) {
          console.error('Connection check error:', fetchError.message);
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
  }, [timeout]);

  return { isConnectionError, setIsConnectionError, isChecking };
}
