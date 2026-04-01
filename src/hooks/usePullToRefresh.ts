import { useEffect, useState } from 'react';

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const pullThreshold = 100;
    let currentY = 0;

    function handleTouchStart(e: TouchEvent) {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (startY === 0) return;
      
      currentY = e.touches[0].clientY - startY;
      
      if (currentY > 0 && window.scrollY === 0) {
        setIsPulling(true);
        e.preventDefault();
      }
    }

    async function handleTouchEnd() {
      if (currentY >= pullThreshold && isPulling) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      
      setStartY(0);
      setIsPulling(false);
      currentY = 0;
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, startY, isPulling]);

  return { isPulling: isPulling || isRefreshing };
}
