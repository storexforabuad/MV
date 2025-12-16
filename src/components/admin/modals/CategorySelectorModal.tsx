'use client';
import React, { Fragment, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
            // The parent will optimistically add the category to the list
            // Close the creation form and let the user see it in the list
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
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex flex-col justify-end"
                >
                    <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClose} />

                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 500 }}
                        className="relative bg-card-background rounded-t-3xl shadow-xl max-h-[70vh] flex flex-col z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-border-color flex-shrink-0">
                            <h3 className="text-lg font-semibold text-center text-text-primary">
                                Select a Category
                            </h3>
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
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CategorySelectorModal;
