import { create } from 'zustand';
import type { Cart, CartItem, Customer, Inventory } from '../types';

interface CartStore {
  cart: Cart;
  addItem: (inventory: Inventory, unitPrice: number) => void;
  removeItem: (inventoryId: string) => void;
  updateItemQuantity: (inventoryId: string, quantity: number) => void;
  setDiscount: (discount: number) => void;
  setCustomer: (customer: Customer | undefined) => void;
  clearCart: () => void;
  calculateTotals: () => void;
}

const initialCart: Cart = {
  items: [],
  subtotal: 0,
  discount: 0,
  total: 0,
  customer: undefined,
};

export const useCartStore = create<CartStore>((set, get) => ({
  cart: initialCart,

  addItem: (inventory: Inventory, unitPrice: number) => {
    const { cart } = get();
    const existingItem = cart.items.find((item) => item.inventory.id === inventory.id);

    if (existingItem) {
      // Item already in cart - don't add duplicate for unique inventory items
      return;
    }

    const newItem: CartItem = {
      inventory,
      quantity: 1,
      unit_price: unitPrice,
      subtotal: unitPrice,
    };

    set({
      cart: {
        ...cart,
        items: [...cart.items, newItem],
      },
    });
    get().calculateTotals();
  },

  removeItem: (inventoryId: string) => {
    const { cart } = get();
    set({
      cart: {
        ...cart,
        items: cart.items.filter((item) => item.inventory.id !== inventoryId),
      },
    });
    get().calculateTotals();
  },

  updateItemQuantity: (inventoryId: string, quantity: number) => {
    const { cart } = get();
    set({
      cart: {
        ...cart,
        items: cart.items.map((item) =>
          item.inventory.id === inventoryId
            ? { ...item, quantity, subtotal: item.unit_price * quantity }
            : item
        ),
      },
    });
    get().calculateTotals();
  },

  setDiscount: (discount: number) => {
    const { cart } = get();
    set({
      cart: {
        ...cart,
        discount,
      },
    });
    get().calculateTotals();
  },

  setCustomer: (customer: Customer | undefined) => {
    const { cart } = get();
    set({
      cart: {
        ...cart,
        customer,
      },
    });
  },

  clearCart: () => {
    set({ cart: initialCart });
  },

  calculateTotals: () => {
    const { cart } = get();
    const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    const total = Math.max(0, subtotal - cart.discount);
    set({
      cart: {
        ...cart,
        subtotal,
        total,
      },
    });
  },
}));
