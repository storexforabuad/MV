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
                    <div className="fixed inset-0 bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden flex flex-col justify-end">
                    <Transition.Child
                        as={Fragment}
                        enter="transform transition ease-in-out duration-300"
                        enterFrom="translate-y-full"
                        enterTo="translate-y-0"
                        leave="transform transition ease-in-out duration-200"
                        leaveFrom="translate-y-0"
                        leaveTo="translate-y-full"
                    >
                        <Dialog.Panel className="relative bg-white dark:bg-gray-900 rounded-t-3xl shadow-xl max-h-[70vh] flex flex-col w-full">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" />
                                <Dialog.Title className="text-lg font-bold text-center text-gray-900 dark:text-gray-100">
                                    Select a Category
                                </Dialog.Title>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {/* Create New Category Section */}
                                {isCreating ? (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border-2 border-blue-500">
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
                                            className="w-full bg-transparent border-b border-blue-500 focus:ring-0 focus:outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 mb-4 pb-2 text-lg font-medium"
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleSaveNew}
                                                disabled={isSubmitting || !newCategoryName.trim()}
                                                className="flex-1 p-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                                            >
                                                {isSubmitting ? 'Saving...' : 'Save Category'}
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                disabled={isSubmitting}
                                                className="p-3 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="w-full p-4 text-left rounded-2xl bg-blue-50 dark:bg-blue-900/10 border-2 border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-500 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <PlusIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <span className="font-bold text-lg text-blue-600 dark:text-blue-400">Create New Category</span>
                                        </div>
                                    </button>
                                )}

                                {/* Categories List */}
                                <div className="space-y-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => onSelect(cat.id)}
                                            className={`w-full text-left p-4 text-lg font-bold rounded-2xl transition-all border-2 ${selectedCategoryId === cat.id
                                                ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 border-blue-600 shadow-md shadow-blue-500/10'
                                                : 'text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>

                                {categories.length === 0 && !isCreating && (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 dark:text-gray-400 font-medium">No categories yet</p>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first category above</p>
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
