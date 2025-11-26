'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Product } from '../types/product';
import { CartCache } from './cartCache';

// The core of the fix: Omit 'storeId' from Product and add it back as an optional property.
export interface CartItem extends Omit<Product, 'size' | 'storeId'> {
  quantity: number;
  storeId?: string;
  selectedSize?: string; // Added for size support
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

// The payload for 'ADD_ITEM' must also have an optional 'storeId'.
type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<Product, 'storeId'> & { quantity: number; storeId?: string | null; selectedSize?: string } }
  | { type: 'REMOVE_ITEM'; payload: string } // Note: We might need to change this to { id: string; selectedSize?: string } later if we want to remove specific sizes, but for now ID might be enough if we generate unique IDs or handle it differently.
  // actually, if we have multiple items with same ID but different sizes, removing by ID will remove ALL of them or just the first one found.
  // We should probably update REMOVE_ITEM to take a composite key or just the index, or filter by both ID and size.
  // For this step, let's stick to the plan: "Modify ADD_ITEM".
  // But wait, if I have Shirt (M) and Shirt (L), and I click "remove" on Shirt (M), I don't want to remove Shirt (L).
  // The current REMOVE_ITEM implementation:
  // const itemToRemove = state.items.find(item => item.id === action.payload);
  // items: state.items.filter(item => item.id !== action.payload),
  // This WILL remove both.
  // I should update REMOVE_ITEM payload too.
  | { type: 'REMOVE_ITEM'; payload: { id: string; selectedSize?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number; selectedSize?: string } }
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
        item => item.id === action.payload.id && item.selectedSize === action.payload.selectedSize
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id && item.selectedSize === action.payload.selectedSize
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          totalItems: state.totalItems + 1,
          totalAmount: state.totalAmount + action.payload.price,
        };
      }

      const { storeId, selectedSize, ...restOfPayload } = action.payload;
      const newItem: CartItem = {
        ...restOfPayload,
        quantity: 1,
        storeId: storeId ?? undefined,
        selectedSize: selectedSize,
      };

      return {
        ...state,
        items: [...state.items, newItem],
        totalItems: state.totalItems + 1,
        totalAmount: state.totalAmount + action.payload.price,
      };
    }

    case 'REMOVE_ITEM': {
      // Payload is now { id: string; selectedSize?: string }
      // We need to handle legacy calls (string) just in case, or update all calls.
      // Since I'm updating the type definition above, I should assume payload is the object.
      // But to be safe and backward compatible during refactor:
      const itemId = typeof action.payload === 'string' ? action.payload : action.payload.id;
      const itemSize = typeof action.payload === 'string' ? undefined : action.payload.selectedSize;

      const itemToRemove = state.items.find(item => item.id === itemId && item.selectedSize === itemSize);
      if (!itemToRemove) return state;

      return {
        ...state,
        items: state.items.filter(item => !(item.id === itemId && item.selectedSize === itemSize)),
        totalItems: state.totalItems - itemToRemove.quantity,
        totalAmount: state.totalAmount - (itemToRemove.price * itemToRemove.quantity),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity, selectedSize } = action.payload;
      if (quantity < 1) return state;

      const item = state.items.find(item => item.id === id && item.selectedSize === selectedSize);
      if (!item) return state;

      const quantityDiff = quantity - item.quantity;

      return {
        ...state,
        items: state.items.map(item =>
          item.id === id && item.selectedSize === selectedSize ? { ...item, quantity } : item
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
