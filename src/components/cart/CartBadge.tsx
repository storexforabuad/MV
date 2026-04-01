import { useState, useEffect } from 'react';
import { ClipboardListIcon } from 'lucide-react';
import { useCart } from '../../lib/cartContext';

export default function CartBadge() {
  const { state } = useCart();
  const [isBouncing, setIsBouncing] = useState(false);
  const [prevTotalItems, setPrevTotalItems] = useState(state.totalItems);

  useEffect(() => {
    if (state.totalItems > prevTotalItems) {
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 500);
    }
    setPrevTotalItems(state.totalItems);
  }, [state.totalItems, prevTotalItems]);

  return (
    <div className="relative">
      <ClipboardListIcon 
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
  );
}
