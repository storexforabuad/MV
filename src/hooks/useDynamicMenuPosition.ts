'use client';
import { useState, useCallback } from 'react';

export function useDynamicMenuPosition() {
  const [menuPosition, setMenuPosition] = useState('bottom');

  const calculateMenuPosition = useCallback((buttonElement: HTMLElement) => {
    if (!buttonElement) return;

    const rect = buttonElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 200; // Approximate height of the menu

    if (spaceBelow < menuHeight) {
      setMenuPosition('top');
    } else {
      setMenuPosition('bottom');
    }
  }, []);

  return { menuPosition, calculateMenuPosition };
}
