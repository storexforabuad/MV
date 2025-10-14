'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Product } from '../types/product';
import { CartCache } from './cartCache';

// The core of the fix: Omit 'storeId' from Product and add it back as an optional property.
export interface CartItem extends Omit<Product, 'size' | 'storeId'> {
  quantity: number;
  storeId?: string;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

// The payload for 'ADD_ITEM' must also have an optional 'storeId'.
type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<Product, 'storeId'> & { quantity: number; storeId?: string | null } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        item => item.id === action.payload.id
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          totalItems: state.totalItems + 1,
          totalAmount: state.totalAmount + action.payload.price,
        };
      }

      const { storeId, ...restOfPayload } = action.payload;
      const newItem: CartItem = {
        ...restOfPayload,
        quantity: 1,
        storeId: storeId ?? undefined, // Convert null to undefined to match optional property
      };

      return {
        ...state,
        items: [...state.items, newItem],
        totalItems: state.totalItems + 1,
        totalAmount: state.totalAmount + action.payload.price,
      };
    }

    case 'REMOVE_ITEM': {
      const itemToRemove = state.items.find(item => item.id === action.payload);
      if (!itemToRemove) return state;

      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        totalItems: state.totalItems - itemToRemove.quantity,
        totalAmount: state.totalAmount - (itemToRemove.price * itemToRemove.quantity),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity < 1) return state;

      const item = state.items.find(item => item.id === id);
      if (!item) return state;

      const quantityDiff = quantity - item.quantity;

      return {
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, quantity } : item
        ),
        totalItems: state.totalItems + quantityDiff,
        totalAmount: state.totalAmount + (item.price * quantityDiff),
      };
    }

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState, (initial) => {
    try {
      const cachedCart = CartCache.get();
      if (cachedCart && cachedCart.length > 0) {
        return {
          items: cachedCart as CartItem[],
          totalItems: cachedCart.reduce((sum, item) => sum + item.quantity, 0),
          totalAmount: cachedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        } as CartState;
      }
    } catch (error) {
      console.error('Error loading cart from cache:', error);
    }
    return initial;
  });

  useEffect(() => {
    CartCache.save(state.items);
  }, [state.items]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
