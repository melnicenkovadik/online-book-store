"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CartItem = {
  productId: string;
  slug?: string;
  title: string;
  price: number;
  image?: string;
  qty: number;
};

export type CartState = {
  items: Record<string, CartItem>; // key by productId
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: () => number; // total items (sum of qty)
  subtotal: () => number; // sum(price * qty)
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: {},
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items[item.productId];
          const nextQty = (existing?.qty ?? 0) + qty;
          return {
            items: {
              ...state.items,
              [item.productId]: { ...item, qty: nextQty < 1 ? 1 : nextQty },
            },
          };
        }),
      remove: (productId) =>
        set((state) => {
          const { [productId]: _omit, ...rest } = state.items;
          return { items: rest };
        }),
      setQty: (productId, qty) =>
        set((state) => {
          if (!state.items[productId]) return state;
          const next = Math.max(0, Math.floor(qty || 0));
          if (next === 0) {
            const { [productId]: _omit, ...rest } = state.items;
            return { items: rest };
          }
          return {
            items: { ...state.items, [productId]: { ...state.items[productId], qty: next } },
          };
        }),
      clear: () => set({ items: {} }),
      count: () => Object.values(get().items).reduce((acc, it) => acc + it.qty, 0),
      subtotal: () => Object.values(get().items).reduce((acc, it) => acc + it.price * it.qty, 0),
    }),
    {
      name: 'cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      version: 1,
    },
  ),
);
