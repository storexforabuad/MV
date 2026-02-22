'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useVendor } from '@/context/VendorContext';
import { Heart, Moon, Sun, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useTheme } from '@/lib/themeContext';
import { usePathname, useRouter } from 'next/navigation';
import PinEntryModal from '../modals/PinEntryModal';
import { getAdminSession } from '@/lib/adminSession';
import NavigationStore from '@/lib/navigationStore';

interface NavbarProps {
  storeId?: string;
  storeName?: string;
  scrollDirection?: 'up' | 'down';
  backButtonHref?: string;
  activeCategoryId?: string;
}

export default function Navbar({ storeId, storeName, scrollDirection = 'up', backButtonHref, activeCategoryId }: NavbarProps) {
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

  // Triple-tap detection for vendor shortcut to admin
  const { promptLogin } = useVendor();

  // Visual tap state for color feedback
  const [tapCount, setTapCount] = useState(0); // 0..3
  const idleResetRef = useRef<number | null>(null);
  const lastTapTsRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const TAP_MIN_INTERVAL = 40; // ms, ignore faster taps
  const TAP_IDLE_TIMEOUT = 1500; // ms to reset
  const SUCCESS_HOLD = 250; // ms to hold green before triggering
  const COLOR_TRANSITION_MS = 180; // ms
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      } catch (e) {
        setReducedMotion(false);
      }
    }
  }, []);

  // Prefetch admin route as soon as navbar mounts on a storefront page
  useEffect(() => {
    if (storeId && !isAdminRoute) {
      router.prefetch(`/admin/${storeId}`);
      router.prefetch(`/${storeId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const resetTaps = () => {
    setTapCount(0);
    if (idleResetRef.current) {
      clearTimeout(idleResetRef.current);
      idleResetRef.current = null;
    }
  };

  const tapCountRef = useRef(0);

  const doTrigger = () => {
    if (!storeId) return;

    // Save state before leaving for admin - ONLY from storefront root
    const pathSegments = pathname?.split('/').filter(Boolean) || [];
    const isStorefrontRoot = pathSegments.length === 1;

    if (!isAdminRoute && isStorefrontRoot && activeCategoryId) {
      console.log(`[Navbar] Saving Storefront State: category="${activeCategoryId}", scroll=${window.scrollY}`);
      NavigationStore.saveState(activeCategoryId, window.scrollY);
    }

    const session = getAdminSession(storeId);
    if (session) {
      router.push(`/admin/${storeId}`);
    } else {
      setIsPinModalOpen(true);
    }
  };

  const resetTapState = () => {
    tapCountRef.current = 0;
    setTapCount(0);
    if (idleResetRef.current) {
      clearTimeout(idleResetRef.current);
      idleResetRef.current = null;
    }
  };

  const handleTitleTap = () => {
    const now = Date.now();
    if (now - lastTapTsRef.current < TAP_MIN_INTERVAL) return;
    lastTapTsRef.current = now;

    // Cancel any pending idle reset
    if (idleResetRef.current) {
      clearTimeout(idleResetRef.current);
      idleResetRef.current = null;
    }

    tapCountRef.current += 1;
    // Clamp visual state to 1–3 for colour feedback
    setTapCount(Math.min(tapCountRef.current, 3));

    // Subtle haptic
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        (navigator as any).vibrate(12);
      }
    } catch (e) { }

    if (tapCountRef.current >= 3) {
      // ✅ Triple-tap reached — final haptic, brief green flash, then trigger
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          (navigator as any).vibrate([30, 40, 30]);
        }
      } catch (e) { }

      const delay = reducedMotion ? 100 : 350; // Increased delay slightly to ensure green state is seen
      setTimeout(() => {
        doTrigger();
        resetTapState();
      }, delay);

    } else {
      // Schedule idle reset if vendor stops tapping
      idleResetRef.current = window.setTimeout(() => {
        resetTapState();
      }, TAP_IDLE_TIMEOUT) as unknown as number;
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
                <button
                  onClick={handleTitleTap}
                  aria-label="Store title"
                  className="text-xl font-semibold flex items-center gap-2 premium-title-gradient hover:opacity-80 transition-opacity text-left"
                  style={{
                    // only set an explicit text color when tapped for feedback
                    ...(tapCount > 0
                      ? (() => {
                        const light = theme === 'light';
                        const tapColor = tapCount === 1 ? (light ? '#ef4444' : '#fca5a5') : tapCount === 2 ? (light ? '#d97706' : '#fbbf24') : (light ? '#10b981' : '#34d399');
                        const glow = tapCount === 1 ? (light ? 'rgba(239,68,68,0.18)' : 'rgba(252,165,165,0.18)') : tapCount === 2 ? (light ? 'rgba(217,119,6,0.16)' : 'rgba(251,191,36,0.16)') : (light ? 'rgba(16,185,129,0.16)' : 'rgba(52,211,153,0.16)');
                        return {
                          color: tapColor,
                          transition: reducedMotion ? 'none' : `color ${COLOR_TRANSITION_MS}ms ease-out, transform ${COLOR_TRANSITION_MS}ms ease-out, text-shadow ${COLOR_TRANSITION_MS}ms ease-out`,
                          transform: reducedMotion ? 'none' : 'scale(1.03)',
                          textShadow: `0 8px 20px ${glow}`,
                        } as any;
                      })()
                      : { transition: reducedMotion ? 'none' : `color ${COLOR_TRANSITION_MS}ms ease-out, transform ${COLOR_TRANSITION_MS}ms ease-out, text-shadow ${COLOR_TRANSITION_MS}ms ease-out` }),
                  }}
                >
                  {storeName}
                </button>
                <span className="sr-only" aria-live="polite">{tapCount > 0 ? `Access activation: ${tapCount} of 3` : ''}</span>
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
                  <Heart
                    className={`h-7 w-7 text-text-primary transition-colors ${state.totalItems > 0 ? 'fill-current text-red-500' : ''}`}
                  />
                  <span
                    className={`absolute -top-1 -right-1 
                      text-xs rounded-full h-5 w-5 flex items-center justify-center
                      transition-all duration-300
                      ${isBouncing ? 'animate-badge-bounce' : ''}
                      ${state.totalItems > 0
                        ? 'bg-red-500/80 text-white'
                        : 'bg-gray-500/80 text-white'
                      }`}
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

      {storeId && (
        <PinEntryModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          storeId={storeId}
        />
      )}
    </nav>
  );
}
