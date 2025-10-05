'use client';
import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface CategorySelectorProps {
    isOpen: boolean;
    onClose: () => void;
    categories: { id: string; name: string }[];
    selectedCategoryId: string | undefined;
    onSelect: (categoryId: string) => void;
}

const CategorySelectorModal: React.FC<CategorySelectorProps> = ({ isOpen, onClose, categories, selectedCategoryId, onSelect }) => {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
                </Transition.Child>
                <div className="fixed inset-x-0 bottom-0 z-10">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="translate-y-full"
                        enterTo="translate-y-0"
                        leave="ease-in duration-200"
                        leaveFrom="translate-y-0"
                        leaveTo="translate-y-full"
                    >
                        <Dialog.Panel className="bg-card-background rounded-t-3xl shadow-xl">
                            <div className="p-4 border-b border-border-color">
                                <Dialog.Title className="text-lg font-semibold text-center text-text-primary">
                                    Select a Category
                                </Dialog.Title>
                            </div>
                            <div className="p-2 max-h-60 overflow-y-auto">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => onSelect(cat.id)}
                                        className={`w-full text-left p-4 text-lg font-medium rounded-lg transition-colors ${
                                            selectedCategoryId === cat.id
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-text-primary hover:bg-button-secondary-hover'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default CategorySelectorModal;
