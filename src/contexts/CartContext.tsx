import React, { createContext, useContext, useState, ReactNode } from 'react';

export type CartItem = {
  id: string;
  name: string;
  size?: 'P' | 'M' | 'G';
  price: number | string;
  quantity: number;
  type: 'dish' | 'drink';
  observation?: string;
  meats?: string[];
};

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size?: string) => void;
  updateQuantity: (id: string, size: string | undefined, delta: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (newItem: CartItem) => {
    setItems(current => {
      // Find if same item with same size exists
      const existingKey = current.findIndex(
        i => i.id === newItem.id && i.size === newItem.size
      );
      if (existingKey > -1) {
        const updated = [...current];
        updated[existingKey].quantity += newItem.quantity;
        return updated;
      }
      return [...current, newItem];
    });
  };

  const removeItem = (id: string, size?: string) => {
    setItems(current => current.filter(i => !(i.id === id && i.size === size)));
  };

  const updateQuantity = (id: string, size: string | undefined, delta: number) => {
    setItems(current => current.map(item => {
      if (item.id === id && item.size === size) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const clearCart = () => setItems([]);

  // Forçando que o preço seja tratado como NÚMERO e não texto
  const total = items.reduce((acc, item) => {
    const itemPrice = Number(item.price) || 0;
    return acc + (itemPrice * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within CartProvider');
  return context;
};