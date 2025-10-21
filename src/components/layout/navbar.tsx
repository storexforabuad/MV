'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingCart, Moon, Sun, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useTheme } from '@/lib/themeContext';
import { usePathname, useRouter } from 'next/navigation';

interface NavbarProps {
  storeName?: string;
  scrollDirection?: 'up' | 'down';
  backButtonHref?: string;
}

export default function Navbar({ storeName, scrollDirection = 'up', backButtonHref }: NavbarProps) {
  const { state } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [isBouncing, setIsBouncing] = useState(false);
  const [prevTotalItems, setPrevTotalItems] = useState(state.totalItems);
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isStorefront = !isAdminRoute && !!pathname && pathname.split('/').length > 1 && pathname.split('/')[1].length > 0;
  
  const pathSegments = pathname?.split('/').filter(Boolean) || [];
  const isStoreProductPage = pathSegments.length === 3 && pathSegments[1] === 'products';
  const isProductPage = pathname?.startsWith('/products/');
  const isCartPage = pathname === '/cart' || (pathSegments.length === 2 && pathSegments[1] === 'cart');
  const isDashboardPage = pathname?.startsWith('/dashboard/');
  const showBackButton = isProductPage || isStoreProductPage || isCartPage || isDashboardPage;

  useEffect(() => {
    if (state.totalItems > prevTotalItems) {
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 500);
    }
    setPrevTotalItems(state.totalItems);
  }, [state.totalItems, prevTotalItems]);
  
  const handleBack = () => {
    if (showBackButton) {
      router.back();
    }
  };

  if (isAdminRoute || (isStorefront && !storeName)) return null;

  return (
    <nav className={`fixed top-0 z-50 w-full transition-transform duration-300 ${scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'} glassmorphic`}>
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center gap-2">
            {showBackButton ? (
              <>
                {backButtonHref ? (
                  <Link
                    href={backButtonHref}
                    className="p-2 rounded-lg hover:bg-card-hover transition-colors"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-6 w-6 text-text-primary" />
                  </Link>
                ) : (
                  <button
                    onClick={handleBack}
                    className="p-2 rounded-lg hover:bg-card-hover transition-colors"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-6 w-6 text-text-primary" />
                  </button>
                )}
                <span className="text-xl font-semibold card-text-gradient flex items-center gap-2">
                  {storeName || 'Store'}
                </span>
              </>
            ) : storeName ? (
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-8 w-8 text-text-primary" />
                <span className="text-xl font-semibold flex items-center gap-2 premium-title-gradient">
                  {storeName}
                </span>
              </div>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <ShoppingBag className="h-8 w-8 text-text-primary" />
                <span className="text-xl font-semibold flex items-center gap-2 premium-title-gradient">
                  {storeName || 'Store'}
                </span>
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-3 rounded-lg hover:bg-card-hover transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-text-primary" />
              )}
            </button>
  
            {!isAdminRoute && (
              <Link 
                href="/cart"
                className="relative group p-2"
              >
                <div className="relative">
                  <ShoppingCart 
                    className="h-6 w-6 text-text-primary transition-colors"
                  />
                  <span 
                    className={`absolute -top-1 -right-1 
                      ${state.totalItems > 0 ? 'bg-red-500' : 'bg-[var(--badge-gray-bg)]'} 
                      ${state.totalItems > 0 ? 'text-white' : 'text-[var(--badge-gray-text)]'}
                      text-xs rounded-full h-5 w-5 flex items-center justify-center
                      transition-all duration-300
                      ${isBouncing ? 'animate-badge-bounce' : ''}`}
                    style={{
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    {state.totalItems}
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
