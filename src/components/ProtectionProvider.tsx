'use client';

import React, { useEffect } from 'react';
import toast from 'react-hot-toast';

interface ProtectionProviderProps {
    children: React.ReactNode;
}

export default function ProtectionProvider({ children }: ProtectionProviderProps) {
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            // Allow context menu on input and textarea elements
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }
            e.preventDefault();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Block common screenshot shortcuts
            // PrintScreen
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                toast.error('Screenshots are discouraged for privacy.', { id: 'screenshot-toast' });
                return;
            }

            // Cmd+Shift+3/4/5 (Mac) or Win+Shift+S (Windows)
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

            if (cmdOrCtrl && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5' || e.key === 'S')) {
                // Note: Browsers cannot fully block OS-level shortcuts, but we can try to intercept
                // and show a warning.
                toast.error('Screenshots are discouraged for privacy.', { id: 'screenshot-toast' });
            }

            // Block Ctrl+C / Cmd+C (Copy)
            if (cmdOrCtrl && e.key === 'c') {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
                    e.preventDefault();
                    toast.error('Copying content is disabled.', { id: 'copy-toast' });
                }
            }

            // Block Ctrl+U (View Source)
            if (cmdOrCtrl && e.key === 'u') {
                e.preventDefault();
            }
        };

        const handleDragStart = (e: DragEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') {
                e.preventDefault();
            }
        };

        const handleCopy = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
                e.preventDefault();
            }
        };

        // Add event listeners
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('dragstart', handleDragStart);
        document.addEventListener('copy', handleCopy);

        return () => {
            // Clean up event listeners
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('dragstart', handleDragStart);
            document.removeEventListener('copy', handleCopy);
        };
    }, []);

    return <>{children}</>;
}
