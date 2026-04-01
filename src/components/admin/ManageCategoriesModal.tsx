'use client';
import React, { useState, useMemo, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from 'lucide-react';
import { XMarkIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, EyeIcon, PlusIcon, CubeIcon } from '@heroicons/react/24/solid';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import ConfirmationDialog from '../common/ConfirmationDialog';

// --- TYPES ---
interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  storeId: string;
  onAddCategory: (name: string) => Promise<void>;
  onUpdateCategory: (id: string, name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

type SortType = 'name' | 'most_views' | 'most_products';

interface EnrichedCategory extends Category {
  productCount: number;
  totalViews: number;
}

// --- SUB-COMPONENTS ---

const EditableCategoryRow = ({ onSave, onCancel, categoryName = '' }: { onSave: (name: string) => void, onCancel: () => void, categoryName?: string }) => {
  const [name, setName] = useState(categoryName);

  return (
    <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter category name"
        className="flex-1 bg-transparent border-b border-orange-500 focus:ring-0 focus:outline-none text-gray-900 dark:text-zinc-100" />
      <button onClick={() => onSave(name)} className="px-3 py-1 text-sm font-semibold text-white bg-orange-600 rounded-md hover:bg-orange-700">Save</button>
      <button onClick={onCancel} className="px-3 py-1 text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:-zinc-800 rounded-md">Cancel</button>
    </div>
  );
};

const CategoryRow = ({
  category,
  onEdit,
  onDeleteRequest
}: {
  category: EnrichedCategory,
  onEdit: (category: EnrichedCategory) => void,
  onDeleteRequest: (category: EnrichedCategory) => void
}) => {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-gray-100 dark:-zinc-800`}>
      <div className="flex-1 overflow-hidden">
        <p className="font-semibold text-gray-900 dark:text-zinc-100 truncate">{category.name}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-zinc-400">
          <div className="flex items-center gap-1">
            <CubeIcon className="w-4 h-4" />
            <span>{category.productCount} products</span>
          </div>
          <div className="flex items-center gap-1">
            <EyeIcon className="w-4 h-4" />
            <span>{category.totalViews} views</span>
          </div>
        </div>
      </div>
      <Menu as="div" className="relative flex-shrink-0">
        <Menu.Button className="p-2 rounded-full hover:bg-gray-200 dark:-zinc-700">
          <EllipsisVerticalIcon className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
        </Menu.Button>
        <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
          <Menu.Items className="absolute right-0 w-48 mt-2 origin-top-right bg-white dark:bg-zinc-800 divide-y divide-gray-100 dark:divide-zinc-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
            <div className="px-1 py-1 "><Menu.Item>{({ active }) => (<button onClick={() => onEdit(category)} className={`${active ? 'bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-zinc-100' : 'text-gray-700 dark:text-zinc-300'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Edit</button>)}</Menu.Item></div>
            <div className="px-1 py-1"><Menu.Item>{({ active }) => (<button onClick={() => onDeleteRequest(category)} className={`${active ? 'bg-red-500 text-white' : 'text-red-500'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Delete</button>)}</Menu.Item></div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
};

const SortButton = ({ label, value, activeSort, onClick }: { label: string, value: SortType, activeSort: SortType, onClick: (sort: SortType) => void }) => (
  <button onClick={() => onClick(value)} className={`flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${activeSort === value ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 hover:bg-gray-200 dark:-zinc-700'}`}>
    {label}
  </button>
)


// --- MAIN COMPONENT ---

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({ isOpen, onClose, products, categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState<SortType>('name');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<EnrichedCategory | null>(null);

  const enrichedCategories = useMemo<EnrichedCategory[]>(() => {
    return categories.map(category => {
      const categoryProducts = products.filter(p => p.categoryId === category.id);
      const totalViews = categoryProducts.reduce((sum, p) => sum + (p.views || 0), 0);
      return {
        ...category,
        productCount: categoryProducts.length,
        totalViews,
      };
    });
  }, [categories, products]);

  const sortedAndFilteredCategories = useMemo(() => {
    return enrichedCategories
      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (activeSort === 'most_views') {
          return b.totalViews - a.totalViews;
        }
        if (activeSort === 'most_products') {
          return b.productCount - a.productCount;
        }
        return a.name.localeCompare(b.name);
      });
  }, [enrichedCategories, searchQuery, activeSort]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSearchQuery('');
      setActiveSort('name');
      setEditingCategoryId(null);
      setIsAddingCategory(false);
      setCategoryToDelete(null);
    }, 300);
  }

  const handleSaveAdd = async (name: string) => {
    if (name.trim()) {
      await onAddCategory(name.trim());
    }
    setIsAddingCategory(false);
  };

  const handleSaveEdit = async (name: string) => {
    if (name.trim() && editingCategoryId) {
      await onUpdateCategory(editingCategoryId, name.trim());
    }
    setEditingCategoryId(null);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      await onDeleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  };

  const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-900 text-slate-900 dark:text-white"
            initial="hidden" animate="visible" exit="exit"
            variants={modalVariants}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          >
            {/* Header */}
            <header className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-zinc-700 flex-shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Manage Categories</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Organize your products</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <Tag className="w-6 h-6 text-white" />
              </div>
            </header>

            {/* Sticky Search & Sort */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-4 border-b border-gray-200 dark:border-zinc-700">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-400 dark:text-zinc-500" />
                  <input type="text" placeholder="Search categories..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="block w-full rounded-lg border-2 border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 py-3 pl-11 pr-4 text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:-zinc-400 focus:border-blue-500 focus:ring-0 sm:text-sm" />
                </div>
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 hover:bg-gray-200 dark:-zinc-700">
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                <SortButton label="Name (A-Z)" value="name" activeSort={activeSort} onClick={setActiveSort} />
                <SortButton label="Most Views" value="most_views" activeSort={activeSort} onClick={setActiveSort} />
                <SortButton label="Most Products" value="most_products" activeSort={activeSort} onClick={setActiveSort} />
              </div>
            </div>

            {/* Category List */}
            <main className="flex-1 overflow-y-auto p-4 pb-24">
              {isAddingCategory && <EditableCategoryRow onSave={handleSaveAdd} onCancel={() => setIsAddingCategory(false)} />}
              <div className="grid grid-cols-1 gap-1">
                {sortedAndFilteredCategories.map(c => (
                  editingCategoryId === c.id ?
                    <EditableCategoryRow key={c.id} categoryName={c.name} onSave={handleSaveEdit} onCancel={() => setEditingCategoryId(null)} /> :
                    <CategoryRow key={c.id} category={c} onEdit={() => setEditingCategoryId(c.id)} onDeleteRequest={setCategoryToDelete} />
                ))}
                {sortedAndFilteredCategories.length === 0 && !isAddingCategory && (
                  <div className="text-center py-16"><p className="font-semibold text-gray-900 dark:text-zinc-100">No categories found</p><p className="text-gray-500 dark:text-zinc-400 mt-1">Try adjusting your search or filters.</p></div>
                )}
              </div>
            </main>

            {/* Footer */}
            <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
              <motion.button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                whileTap={{ scale: 0.98 }}
              >
                Done
              </motion.button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
      >
        Are you sure you want to delete this category? Products in this category will become uncategorized. This action cannot be undone.
      </ConfirmationDialog>
    </>
  );
};

export default ManageCategoriesModal;
