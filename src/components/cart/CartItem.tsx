import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { CartItem as CartItemType } from '../../lib/cartContext';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const [imageLoading, setImageLoading] = useState(true);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  return (
    <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 
      bg-[var(--card-background)] hover:bg-[var(--card-hover)] active:bg-[var(--card-hover)]
      transition-colors rounded-lg touch-manipulation border border-[var(--border-color)]">
      <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-lg 
        bg-[var(--card-background)]">
        {imageLoading && (
          <div className="absolute inset-0 bg-[var(--skeleton-background)] animate-pulse" />
        )}
        <Image
          src={item.images[0]}
          alt={item.name}
          fill
          className={`object-cover object-center transition-opacity duration-300
            ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          sizes="(max-width: 640px) 80px, 96px"
          priority={false}
          loading="lazy"
          onLoad={() => setImageLoading(false)}
          placeholder="blur"
          blurDataURL={item.images[0]}
        />
      </div>
      
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-sm sm:text-base font-medium text-[var(--text-primary)] truncate">
            {item.name}
          </h3>
          <p className="flex-shrink-0 text-sm sm:text-base font-medium text-[var(--text-primary)]">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-2 sm:mt-3">
          <div className="flex items-center bg-[var(--input-background)] rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="p-2 rounded-lg hover:bg-[var(--card-hover)] active:bg-[var(--card-hover)] 
                disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-primary)]
                touch-manipulation transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <span className="text-[var(--text-primary)] min-w-[32px] text-center text-base sm:text-lg">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="p-2 rounded-lg hover:bg-[var(--card-hover)] active:bg-[var(--card-hover)]
                text-[var(--text-primary)] touch-manipulation transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
          
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 rounded-lg text-[var(--button-danger)] hover:text-[var(--button-danger-hover)]
              hover:bg-[var(--card-hover)] active:bg-[var(--card-hover)] touch-manipulation 
              transition-colors active:scale-95"
            aria-label="Remove item"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
