'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Product } from '../types/product';
import { CartCache } from './cartCache';

export interface CartItem extends Omit<Product, 'size' | 'storeId'> {
  quantity: number;
  storeId?: string;
  selectedSize?: string;
  selectedColor?: string;
  selectedImage?: string;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<Product, 'storeId'> & { quantity: number; storeId?: string | null; selectedSize?: string; selectedColor?: string; selectedImage?: string } }
  | { type: 'REMOVE_ITEM'; payload: { id: string; selectedSize?: string; selectedColor?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number; selectedSize?: string; selectedColor?: string } }
  | { type: 'UPDATE_SIZE'; payload: { id: string; oldSize?: string; newSize: string; selectedColor?: string } }
  | { type: 'UPDATE_COLOR'; payload: { id: string; oldColor?: string; newColor: string; selectedSize?: string } }
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
      const { id, selectedSize, selectedColor } = action.payload;
      const existingItem = state.items.find(
        item => item.id === id && item.selectedSize === selectedSize && item.selectedColor === selectedColor
      );

      if (existingItem) {
        const items = state.items.map(item =>
          (item.id === id && item.selectedSize === selectedSize && item.selectedColor === selectedColor)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return {
          ...state,
          items,
          totalItems: state.totalItems + 1,
          totalAmount: state.totalAmount + action.payload.price,
        };
      }

      const { storeId, ...restOfPayload } = action.payload;
      const newItem: CartItem = {
        ...restOfPayload,
        quantity: 1,
        storeId: storeId ?? undefined,
      };

      return {
        ...state,
        items: [...state.items, newItem],
        totalItems: state.totalItems + 1,
        totalAmount: state.totalAmount + action.payload.price,
      };
    }

    case 'REMOVE_ITEM': {
      const { id, selectedSize, selectedColor } = action.payload;
      const itemToRemove = state.items.find(item => item.id === id && item.selectedSize === selectedSize && item.selectedColor === selectedColor);
      if (!itemToRemove) return state;

      return {
        ...state,
        items: state.items.filter(item => !(item.id === id && item.selectedSize === selectedSize && item.selectedColor === selectedColor)),
        totalItems: state.totalItems - itemToRemove.quantity,
        totalAmount: state.totalAmount - (itemToRemove.price * itemToRemove.quantity),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity, selectedSize, selectedColor } = action.payload;
      if (quantity < 1) return state;

      const itemToUpdate = state.items.find(item => item.id === id && item.selectedSize === selectedSize && item.selectedColor === selectedColor);
      if (!itemToUpdate) return state;

      const quantityDiff = quantity - itemToUpdate.quantity;

      return {
        ...state,
        items: state.items.map(item =>
          (item.id === id && item.selectedSize === selectedSize && item.selectedColor === selectedColor) ? { ...item, quantity } : item
        ),
        totalItems: state.totalItems + quantityDiff,
        totalAmount: state.totalAmount + (itemToUpdate.price * quantityDiff),
      };
    }

    case 'UPDATE_SIZE': {
      const { id, oldSize, newSize, selectedColor } = action.payload;
      const itemToUpdate = state.items.find(item => item.id === id && item.selectedSize === oldSize && item.selectedColor === selectedColor);
      if (!itemToUpdate) return state;

      // Check if an item with the NEW size already exists
      const existingItemWithNewSize = state.items.find(
        item => item.id === id && item.selectedSize === newSize && item.selectedColor === selectedColor
      );

      if (existingItemWithNewSize && newSize !== oldSize) {
        // Merge them
        return {
          ...state,
          items: state.items
            .filter(item => !(item.id === id && item.selectedSize === oldSize && item.selectedColor === selectedColor))
            .map(item =>
              (item.id === id && item.selectedSize === newSize && item.selectedColor === selectedColor)
                ? { ...item, quantity: item.quantity + itemToUpdate.quantity }
                : item
            )
        };
      }

      // Just update the size
      return {
        ...state,
        items: state.items.map(item =>
          (item.id === id && item.selectedSize === oldSize && item.selectedColor === selectedColor)
            ? { ...item, selectedSize: newSize }
            : item
        )
      };
    }

    case 'UPDATE_COLOR': {
      const { id, oldColor, newColor, selectedSize } = action.payload;
      const itemToUpdate = state.items.find(item => item.id === id && item.selectedColor === oldColor && item.selectedSize === selectedSize);
      if (!itemToUpdate) return state;

      // Check if an item with the NEW color already exists
      const existingItemWithNewColor = state.items.find(
        item => item.id === id && item.selectedColor === newColor && item.selectedSize === selectedSize
      );

      if (existingItemWithNewColor && newColor !== oldColor) {
        // Merge them
        return {
          ...state,
          items: state.items
            .filter(item => !(item.id === id && item.selectedColor === oldColor && item.selectedSize === selectedSize))
            .map(item =>
              (item.id === id && item.selectedColor === newColor && item.selectedSize === selectedSize)
                ? { ...item, quantity: item.quantity + itemToUpdate.quantity }
                : item
            )
        };
      }

      // Just update the color
      return {
        ...state,
        items: state.items.map(item =>
          (item.id === id && item.selectedColor === oldColor && item.selectedSize === selectedSize)
            ? { ...item, selectedColor: newColor }
            : item
        )
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
