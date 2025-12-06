import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface EventsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EventsModal = ({ isOpen, onClose }: EventsModalProps) => {
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
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 w-full h-full min-h-[80vh] flex flex-col">
                                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white dark:bg-slate-900 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 mb-6">
                                        <CalendarDaysIcon className="h-10 w-10 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                                    </div>
                                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 dark:text-white mb-4">
                                        Bizcon Events
                                    </Dialog.Title>
                                    <div className="mt-2 max-w-sm mx-auto">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                            Stay tuned for upcoming Bizcon Online and offline events! This is where we will announce Trade Fairs, Pop-ups, Funfairs, Networking Events, and more.
                                        </p>
                                        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                                            <p className="text-base font-medium text-gray-900 dark:text-white">
                                                No events scheduled at the moment.
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Check back later for updates!
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 sm:mt-6">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-xl border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm transition-colors"
                                        onClick={onClose}
                                    >
                                        Done
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};
