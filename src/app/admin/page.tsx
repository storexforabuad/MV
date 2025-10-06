'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { getProducts, updateProduct, deleteProduct, getCategories, getContacts } from '../../lib/db';
import { Product } from '../../types/product';
// import ProtectedRoute from '../../components/ProtectedRoute';
import dynamic from 'next/dynamic';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminSkeleton from '../../components/admin/AdminSkeleton';
import MobileNav from '../../components/admin/MobileNav';
import FloatingActionButton from '../../components/admin/FloatingActionButton';
import { toast } from 'react-hot-toast';
import { ProductCache } from '../../lib/productCache';
import AdminHomeCards from '../../components/admin/AdminHomeCards';
import AddProductSection from '../../components/AddProductSection';
import PopularProductsSection from '../../components/PopularProductsSection'; // Import the new component
import { ManageCategoriesModal } from '@/components/admin/modals/ManageCategoriesModal';

// Lazy load components
const ManageProductsSection = dynamic(() => import('../../components/ManageProductsSection'));

// Define types for the mock data
interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
  specialization: string;
}

interface WholesaleData {
  id: string;
  name: string;
  contacts: Contact[];
}

const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isManageProductsOpen, setIsManageProductsOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isPopularProductsOpen, setIsPopularProductsOpen] = useState(false); // Add state for popular products section
  const [batchTemplate, setBatchTemplate] = useState<Partial<Product> | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [contacts, setContacts] = useState<WholesaleData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'popular' | 'limited' | 'soldout'>('all');
  const [storeId, setStoreId] = useState<string | null>(null);

  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    // const unsubscribe = onAuthStateChanged(auth, (user) => {
    //   if (user) {
    //     setStoreId(user.uid);
    //   } else {
    //     console.log('no store id');
    //     router.push('/signin');
    //   }
    // });
    // return () => unsubscribe();
    setStoreId("default");
  }, [auth, router]);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (!storeId) return;
    if (showRefresh) setIsRefreshing(true);
    try {
      const [fetchedProducts, fetchedCategories, fetchedContacts] = await Promise.all([
        getProducts(storeId),
        getCategories(storeId),
        getContacts(storeId)
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      setContacts(fetchedContacts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      if (showRefresh) setIsRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchData();
    }
  }, [storeId, fetchData]);

  const handleUpdateProduct = async (id: string, updatedProduct: Partial<Product>) => {
    if (!storeId) return;
    try {
      await updateProduct(storeId, id, updatedProduct);
      ProductCache.clear();
      await fetchData(true);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } 
  };

  const handleDeleteProduct = async (id: string) => {
    if (!storeId) return;
    try {
      await deleteProduct(storeId, id);
      ProductCache.clear();
      await fetchData(true);
      toast.success('Product deleted');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleDuplicateProduct = (product: Product) => {
    const duplicatedProduct: Partial<Product> = {
      ...product,
      name: `${product.name} - Copy`,
      images: [],
    };
    delete duplicatedProduct.id;
    setBatchTemplate(null);
    setActiveSection('add');
    setIsAddProductOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyToBatch = (product: Product) => {
    const template: Partial<Product> = {
      ...product,
      name: product.name,
      images: [],
    };
    delete template.id;

    setBatchTemplate(template);
    setActiveSection('add');
    setIsAddProductOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const totalContacts = contacts.reduce((sum, region) => sum + region.contacts.length, 0);

  if (loading && !isRefreshing) {
    return <AdminSkeleton screen="home" />;
  }

  return (
    // <ProtectedRoute>
      <div className="min-h-screen bg-background pb-16 md:pb-0 transition-colors">
        <AdminHeader onLogout={handleLogout} isRefreshing={isRefreshing} />
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          <Suspense fallback={<AdminSkeleton isNavigation={true} />}>
            {activeSection === 'home' && storeId && (
              <div className="mb-8">
                <AdminHomeCards
                  totalProducts={products.length}
                  totalCategories={categories.length}
                  popularProducts={products.filter(p => p.views && p.views > 10).length}
                  limitedStock={products.filter(p => p.limitedStock).length}
                  totalViews={products.reduce((sum, p) => sum + (p.views || 0), 0)}
                  soldOut={products.filter(p => (typeof p.inStock === 'number' && p.inStock === 0) || p.soldOut === true).length}
                  setActiveSection={setActiveSection}
                  setIsManageProductsOpen={setIsManageProductsOpen}
                  setManageTab={setViewMode}
                  products={products}
                  categories={categories}
                  contacts={contacts}
                  debtors={0}
                  subscriptionStatus={"Active"}
                  storeLink={'http://https://tinyurl.com/alaniqint'}
                  referrals={0}
                  setIsModalOpen={setIsModalOpen}
                  onRefresh={() => fetchData(true)}
                  isRefreshing={isRefreshing}
                  totalContacts={totalContacts}
                  storeId={storeId}
                  openManageCategories={() => setIsManageCategoriesOpen(true)}
                />
                <PopularProductsSection 
                  isPopularProductsOpen={isPopularProductsOpen} 
                  setIsPopularProductsOpen={setIsPopularProductsOpen} 
                  storeId={storeId} 
                />
              </div>
            )}

            {activeSection === 'manage' && storeId && (
              <div className="mb-8">
                <ManageProductsSection
                  storeId={storeId}
                  products={products}
                  handleUpdateProduct={handleUpdateProduct}
                  handleDeleteProduct={handleDeleteProduct}
                  handleDuplicateProduct={handleDuplicateProduct}
                  handleCopyToBatch={handleCopyToBatch}
                  isManageProductsOpen={isManageProductsOpen}
                  setIsManageProductsOpen={setIsManageProductsOpen}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  categories={categories}
                />
              </div>
            )}

            {activeSection === 'add' && storeId &&(
              <div className="mb-8">
                <AddProductSection
                  storeId={storeId}
                  batchTemplate={batchTemplate}
                  isAddProductOpen={isAddProductOpen}
                  setIsAddProductOpen={setIsAddProductOpen}
                  categories={categories}
                  onProductAdded={() => {
                    ProductCache.clear();
                    fetchData(true);
                  }}
                />
              </div>
            )}
          </Suspense>
        </main>
        <FloatingActionButton />
        <MobileNav 
          activeSection={activeSection} 
          setActiveSection={setActiveSection} 
          isModalOpen={isModalOpen} 
        />
        <ManageCategoriesModal 
          isOpen={isManageCategoriesOpen}
          onClose={() => setIsManageCategoriesOpen(false)}
        />
      </div>
    // </ProtectedRoute>
  );
};

export default AdminDashboard;
