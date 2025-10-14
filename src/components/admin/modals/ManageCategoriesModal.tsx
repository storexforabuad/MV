'use client';

import { useState, useMemo, FC, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GripVertical, MoreVertical, Plus, Search as SearchIcon, Check, Trash2, Edit } from 'lucide-react';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';

interface Category {
    id: string;
    name: string;
    productCount: number;
    totalViews: number;
}

type SortKey = 'custom' | 'name' | 'views' | 'products';

const SortOption: FC<{ label: string; value: SortKey; activeSort: SortKey; onClick: (value: SortKey) => void }> = ({ label, value, activeSort, onClick }) => (
    <button
        onClick={() => onClick(value)}
        className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
            activeSort === value ? 'bg-blue-600 text-white' : 'bg-input-background text-text-primary hover:bg-button-secondary-hover'
        }`}
    >
        {label}
    </button>
);

const CategoryListItem: FC<{ 
    category: Category; 
    isEditing: boolean;
    onSave: (newName: string) => void;
    onCancel: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ category, isEditing, onSave, onCancel, onEdit, onDelete }) => {
    const [name, setName] = useState(category.name);

    if (isEditing) {
        return (
            <div className="flex items-center bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg shadow-sm mb-3 ring-2 ring-blue-500">
                 <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-grow bg-transparent font-bold text-text-primary focus:outline-none"
                    autoFocus
                />
                <button onClick={() => onSave(name)} className="p-2 text-green-600 hover:text-green-700">
                    <Check size={20} />
                </button>
                <button onClick={onCancel} className="p-2 text-red-600 hover:text-red-700">
                    <X size={20} />
                </button>
            </div>
        )
    }

    return (
        <div className="flex items-center bg-background-secondary p-3 rounded-lg shadow-sm mb-3">
            <GripVertical className="text-text-secondary cursor-grab mr-3" />
            <div className="flex-grow">
                <p className="font-bold text-text-primary">{category.name}</p>
                <div className="flex items-center text-xs text-text-secondary mt-1 space-x-4">
                    <span>{category.productCount} products</span>
                    <span>{Intl.NumberFormat('en-US', { notation: 'compact' }).format(category.totalViews)} views</span>
                </div>
            </div>
            <div className="relative">
                 <Dropdown menuItems={[
                    { label: 'Edit', icon: Edit, onClick: onEdit },
                    { label: 'Delete', icon: Trash2, onClick: onDelete, isDestructive: true },
                ]} />
            </div>
        </div>
    );
};

const Dropdown: FC<{ menuItems: {label: string, icon: React.ElementType, onClick: () => void, isDestructive?: boolean}[] }> = ({ menuItems }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-text-secondary hover:text-text-primary">
                <MoreVertical size={20} />
            </button>
            <AnimatePresence>
            { isOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-background-primary border border-border-color rounded-lg shadow-lg z-10">
                    {menuItems.map(item => (
                         <button key={item.label} onClick={() => { item.onClick(); setIsOpen(false); }} 
                            className={`flex items-center w-full px-4 py-2 text-left text-sm ${item.isDestructive ? 'text-red-600' : 'text-text-primary'} hover:bg-background-secondary`}>
                             <item.icon size={16} className="mr-2" />
                            {item.label}
                        </button>
                    ))}
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    )
}

export const ManageCategoriesModal: FC<{ isOpen: boolean; onClose: () => void; categories: Category[] }> = ({ isOpen, onClose, categories: initialCategories }) => {
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('custom');
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<Category | null>(null);

    useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    const sortedAndFilteredCategories = useMemo(() => {
        const sorted = [...categories];
        if (sortKey === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortKey === 'views') sorted.sort((a, b) => b.totalViews - a.totalViews);
        else if (sortKey === 'products') sorted.sort((a, b) => b.productCount - a.productCount);

        return searchQuery ? sorted.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())) : sorted;
    }, [categories, searchQuery, sortKey]);

    const handleAddNew = () => {
      setIsAdding(true);
      setEditingCategoryId('new-category');
    }

    const handleSave = (id: string, newName: string) => {
        if (isAdding) {
            const newCategory = { id: Date.now().toString(), name: newName, productCount: 0, totalViews: 0 };
            setCategories([newCategory, ...categories]);
            setIsAdding(false);
        } else {
            setCategories(categories.map(c => c.id === id ? { ...c, name: newName } : c));
        }
        setEditingCategoryId(null);
    };

    const handleCancel = () => {
        setEditingCategoryId(null);
        setIsAdding(false);
    }

    const handleDelete = (category: Category) => {
        setShowDeleteConfirmation(category);
    }

    const confirmDelete = () => {
        if (showDeleteConfirmation) {
            setCategories(categories.filter(c => c.id !== showDeleteConfirmation.id));
            setShowDeleteConfirmation(null);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="fixed inset-0 bg-background-primary z-50 flex flex-col"
                >
                    {/* Header */}
                    <header className="flex items-center justify-between p-4 border-b border-border-color shrink-0">
                        <h2 className="text-xl font-bold">Manage Categories</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-button-secondary-hover">
                            <X size={24} />
                        </button>
                    </header>

                    {/* Controls */}
                    <div className="p-4 border-b border-border-color bg-background-secondary">
                        <div className="flex flex-col md:flex-row gap-4">
                            <button onClick={handleAddNew} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                <Plus size={18} /> Add New Category
                            </button>
                            <div className="relative flex-grow">
                                <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                <input
                                    type="text"
                                    placeholder="Search categories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-input-background border-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex space-x-2 overflow-x-auto pb-1">
                            <SortOption label="Custom Order" value="custom" activeSort={sortKey} onClick={setSortKey} />
                            <SortOption label="Name (A-Z)" value="name" activeSort={sortKey} onClick={setSortKey} />
                            <SortOption label="Most Views" value="views" activeSort={sortKey} onClick={setSortKey} />
                            <SortOption label="Most Products" value="products" activeSort={sortKey} onClick={setSortKey} />
                        </div>
                    </div>

                    {/* Category List */}
                    <main className="flex-grow p-4 overflow-y-auto">
                        <> 
                            {isAdding && (
                                <CategoryListItem 
                                    category={{id: 'new-category', name: '', productCount: 0, totalViews: 0}}
                                    isEditing={true}
                                    onSave={(newName) => handleSave('new-category', newName)}
                                    onCancel={handleCancel}
                                    onEdit={() => {}}
                                    onDelete={() => {}}
                                />
                            )}
                            {sortedAndFilteredCategories.length > 0 ? (
                                sortedAndFilteredCategories.map(cat => <CategoryListItem 
                                    key={cat.id} 
                                    category={cat} 
                                    isEditing={editingCategoryId === cat.id}
                                    onEdit={() => setEditingCategoryId(cat.id)}
                                    onCancel={handleCancel}
                                    onSave={(newName) => handleSave(cat.id, newName)}
                                    onDelete={() => handleDelete(cat)}
                                />)
                            ) : !isAdding && (
                                <div className="text-center py-20">
                                    <h3 className="text-lg font-semibold">No Categories Found</h3>
                                    <p className="text-text-secondary mt-1">
                                        {searchQuery ? `No results for "${searchQuery}"` : "Tap '+ Add New Category' to get started."}
                                    </p>
                                </div>
                            )}
                        </>
                    </main>

                    <ConfirmationDialog
                        isOpen={!!showDeleteConfirmation}
                        onClose={() => setShowDeleteConfirmation(null)}
                        onConfirm={confirmDelete}
                        title="Delete Category"
                        description={`Are you sure you want to delete "${showDeleteConfirmation?.name}"? This action cannot be undone.`}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}
