'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to handle modal closing via the browser's back button.
 * Pushes a history state when the modal opens and listens for popstate events.
 * 
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback function to close the modal
 * @param modalKey - Unique identifier for the modal in history state
 */
export function useModalBackNavigation(isOpen: boolean, onClose: () => void, modalKey: string = 'modal-open') {
    const hasPushedState = useRef(false);
    const onCloseRef = useRef(onClose);

    // Keep onClose callback up to date without re-triggering the effect
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        // Only perform logic if the modal is open
        if (!isOpen) return;

        // Push state to handle back button only once per open
        if (!hasPushedState.current) {
            window.history.pushState({ modal: modalKey }, '');
            hasPushedState.current = true;
        }

        const handlePopState = (event: PopStateEvent) => {
            // If we detect a popstate and our modal is "pushed", close it
            if (hasPushedState.current) {
                hasPushedState.current = false;
                onCloseRef.current();
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);

            // Cleanup: If the modal is closed via UI (X button, etc.), 
            // we need to remove the added history entry to keep it clean.
            if (hasPushedState.current) {
                hasPushedState.current = false;
                // Only go back if the current state is indeed our modal's state
                if (window.history.state?.modal === modalKey) {
                    window.history.back();
                }
            }
        };
    }, [isOpen, modalKey]);
}
