'use client';
import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon } from '@heroicons/react/24/solid';

interface CategorySelectorProps {
    isOpen: boolean;
    onClose: () => void;
    categories: { id: string; name: string }[];
    selectedCategoryId: string | undefined;
    onSelect: (categoryId: string) => void;
    onAddCategory: (name: string) => Promise<void>;
}

const CategorySelectorModal: React.FC<CategorySelectorProps> = ({
    isOpen,
    onClose,
    categories,
    selectedCategoryId,
    onSelect,
    onAddCategory
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSaveNew = async () => {
        const trimmedName = newCategoryName.trim();
        if (!trimmedName) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onAddCategory(trimmedName);
            // Find the newly created category (it should be the last one added)
            // Since we don't have the ID yet, we'll wait for the parent to refresh
            // and close the creation form
            setNewCategoryName('');
            setIsCreating(false);
        } catch (error) {
            console.error('Failed to create category:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setNewCategoryName('');
        setIsCreating(false);
    };

    const handleClose = () => {
        handleCancel();
        onClose();
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={handleClose}>
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
                        <Dialog.Panel className="bg-card-background rounded-t-3xl shadow-xl max-h-[70vh] flex flex-col">
                            <div className="p-4 border-b border-border-color flex-shrink-0">
                                <Dialog.Title className="text-lg font-semibold text-center text-text-primary">
                                    Select a Category
                                </Dialog.Title>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                {/* Create New Category Section */}
                                {isCreating ? (
                                    <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border-2 border-blue-500">
                                        <input
                                            type="text"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            placeholder="Enter category name"
                                            autoFocus
                                            disabled={isSubmitting}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSaveNew();
                                                } else if (e.key === 'Escape') {
                                                    handleCancel();
                                                }
                                            }}
                                            className="w-full bg-transparent border-b border-blue-500 focus:ring-0 focus:outline-none text-text-primary placeholder:text-text-secondary mb-3 pb-1"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveNew}
                                                disabled={isSubmitting || !newCategoryName.trim()}
                                                className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                            >
                                                {isSubmitting ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                disabled={isSubmitting}
                                                className="px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-input-background rounded-md transition disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="w-full mb-2 p-3 text-left rounded-lg bg-blue-50 dark:bg-blue-900/10 border-2 border-dashed border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <PlusIcon className="w-5 h-5" />
                                            </div>
                                            <span className="font-semibold text-base">Create New Category</span>
                                        </div>
                                    </button>
                                )}

                                {/* Categories List */}
                                <div className="space-y-1">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => onSelect(cat.id)}
                                            className={`w-full text-left p-4 text-lg font-medium rounded-lg transition-all ${selectedCategoryId === cat.id
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
                                                    : 'text-text-primary hover:bg-button-secondary-hover border-2 border-transparent'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>

                                {categories.length === 0 && !isCreating && (
                                    <div className="text-center py-8">
                                        <p className="text-text-secondary">No categories yet</p>
                                        <p className="text-sm text-text-secondary mt-1">Create your first category above</p>
                                    </div>
                                )}
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default CategorySelectorModal;
