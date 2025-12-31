"use client";

import { ReactNode } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalShellProps {
  title?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  strip?: ReactNode;
}

export default function ModalShell({ title, onClose, children, footer, strip }: ModalShellProps) {
  return (
    <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-4 text-left shadow-xl transition-all">
      <button
        type="button"
        className="absolute right-4 top-4 -m-2 p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        onClick={onClose}
      >
        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
      </button>

      {title && (
        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          {title}
        </Dialog.Title>
      )}

      <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">{children}</div>

      {strip && (
        <div className="mt-4 sticky bottom-16 z-10">{strip}</div>
      )}

      {footer && (
        <div className="mt-4 sm:mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 bg-white dark:bg-gray-800">
          {footer}
        </div>
      )}
    </div>
  );
}
