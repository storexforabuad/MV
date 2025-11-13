'use client';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ViewsBreakdown from '@/components/common/ViewsBreakdown';

interface TotalViewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

const TotalViewsModal: React.FC<TotalViewsModalProps> = ({
  isOpen,
  onClose,
  storeId,
}) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-stretch justify-center text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-full"
            >
              <Dialog.Panel className="relative flex w-full flex-col transform text-left transition-all bg-white dark:bg-slate-900 shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <Dialog.Title as="h3" className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-orange-500"/>
                        Store Performance Analytics
                    </Dialog.Title>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
                    {storeId ? (
                        <ViewsBreakdown storeId={storeId} />
                    ) : (
                        <div className="text-center py-12 text-slate-500">No store selected.</div>
                    )}
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default TotalViewsModal;
