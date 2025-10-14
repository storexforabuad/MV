'use client';
import React, { useState, useMemo, Fragment } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
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
  storeId: string; // Add this line
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
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name"
                className="flex-1 bg-transparent border-b border-blue-500 focus:ring-0 focus:outline-none text-text-primary" />
            <button onClick={() => onSave(name)} className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Save</button>
            <button onClick={onCancel} className="px-3 py-1 text-sm font-semibold text-text-secondary hover:bg-input-background rounded-md">Cancel</button>
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
    <div className={`flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-input-background`}>
        <div className="flex-1 overflow-hidden">
            <p className="font-semibold text-text-primary truncate">{category.name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
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
            <Menu.Button className="p-2 rounded-full hover:bg-button-secondary-hover">
                <EllipsisVerticalIcon className="w-5 h-5 text-text-secondary" />
            </Menu.Button>
            <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                <Menu.Items className="absolute right-0 w-48 mt-2 origin-top-right bg-card-background divide-y divide-border-color rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                    <div className="px-1 py-1 "><Menu.Item>{({ active }) => (<button onClick={() => onEdit(category)} className={`${active ? 'bg-button-secondary-hover text-text-primary' : 'text-text-secondary'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Edit</button>)}</Menu.Item></div>
                    <div className="px-1 py-1"><Menu.Item>{({ active }) => (<button onClick={() => onDeleteRequest(category)} className={`${active ? 'bg-red-500 text-white' : 'text-red-500'} group flex rounded-md items-center w-full px-2 py-2 text-sm`}>Delete</button>)}</Menu.Item></div>
                </Menu.Items>
            </Transition>
        </Menu>
    </div>
    )
};

const SortButton = ({ label, value, activeSort, onClick }: { label: string, value: SortType, activeSort: SortType, onClick: (sort: SortType) => void }) => (
    <button onClick={() => onClick(value)} className={`flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${activeSort === value ? 'bg-gray-900 text-white' : 'bg-input-background text-text-primary hover:bg-button-secondary-hover'}`}>
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

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete.id);
      setCategoryToDelete(null); 
    }
  };
  
  return (
    <>
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity" /></Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-stretch justify-center text-center md:items-center md:px-2 lg:px-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full md:translate-y-0 md:scale-95" enterTo="opacity-100 translate-y-0 md:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 md:scale-100" leaveTo="opacity-0 translate-y-full md:translate-y-0 md:scale-95">
              <Dialog.Panel className="relative flex w-full max-w-2xl transform text-left text-base transition md:my-8">
                 <div className="relative flex w-full flex-col overflow-hidden bg-card-background shadow-2xl h-screen md:h-[90vh] md:rounded-2xl">

                  {/* Header */}
                  <div className="p-4 flex justify-between items-center border-b border-border-color">
                    <Dialog.Title as="h3" className="text-xl font-bold text-text-primary">Manage Categories</Dialog.Title>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-button-secondary-hover transition"><XMarkIcon className="h-6 w-6 text-text-secondary" /></button>
                  </div>

                  {/* Sticky Search & Sort */}
                  <div className="sticky top-0 z-10 bg-card-background/80 backdrop-blur-sm p-4 border-b border-border-color">
                      <div className="flex gap-2">
                         <div className="relative flex-1">
                             <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-text-secondary" />
                             <input type="text" placeholder="Search categories..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="block w-full rounded-lg border-2 border-input-border bg-input-background py-3 pl-11 pr-4 text-text-primary placeholder:text-text-secondary focus:border-blue-500 focus:ring-0 sm:text-sm" />
                         </div>
                         <button 
                            onClick={() => setIsAddingCategory(true)}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-input-background text-text-primary hover:bg-button-secondary-hover`}>
                             <PlusIcon className="h-5 w-5"/>
                          </button>
                      </div>
                      <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                          <SortButton label="Name (A-Z)" value="name" activeSort={activeSort} onClick={setActiveSort} />
                          <SortButton label="Most Views" value="most_views" activeSort={activeSort} onClick={setActiveSort} />
                          <SortButton label="Most Products" value="most_products" activeSort={activeSort} onClick={setActiveSort} />
                      </div>
                  </div>

                  {/* Category List */}
                   <div className="flex-1 overflow-y-auto p-2 pb-24"> 
                     {isAddingCategory && <EditableCategoryRow onSave={handleSaveAdd} onCancel={() => setIsAddingCategory(false)} />}
                    <div className="grid grid-cols-1 gap-1">
                        {sortedAndFilteredCategories.map(c => (
                            editingCategoryId === c.id ? 
                            <EditableCategoryRow key={c.id} categoryName={c.name} onSave={handleSaveEdit} onCancel={() => setEditingCategoryId(null)} /> :
                            <CategoryRow key={c.id} category={c} onEdit={() => setEditingCategoryId(c.id)} onDeleteRequest={setCategoryToDelete} />
                        ))}
                        {sortedAndFilteredCategories.length === 0 && !isAddingCategory && (
                            <div className="text-center py-16"><p className="font-semibold text-text-primary">No categories found</p><p className="text-text-secondary mt-1">Try adjusting your search or filters.</p></div>
                        )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="absolute bottom-0 left-0 right-0 z-20">
                    <div className="bg-card-background p-4 border-t border-border-color">
                          <button onClick={handleClose} className="w-full bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 transition">
                            Done
                          </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>

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