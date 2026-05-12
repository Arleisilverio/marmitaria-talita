import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  type?: 'dish' | 'drink';
  observation?: string;
  meats?: string[];
  size?: string;
};

interface CartContextData {
  items: CartItem[];
  addItem: (product: any) => void;
  removeItem: (id: string, size?: string) => void;
  updateQuantity: (id: string, size: string | undefined, delta: number) => void;
  clearCart: () => void;
  total: number;
  storeSlug: string;
  setStoreSlug: (slug: string) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storeSlug, setStoreSlugState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cart_store_slug') || '';
    }
    return '';
  });

  const setStoreSlug = (slug: string) => {
    setStoreSlugState(slug);
    localStorage.setItem('cart_store_slug', slug);
  };

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) setItems(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: any) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id && i.size === product.size);
      if (existing) {
        return prev.map(i => (i.id === product.id && i.size === product.size) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeItem = (id: string, size?: string) => {
    setItems(prev => prev.filter(i => !(i.id === id && i.size === size)));
  };

  const updateQuantity = (id: string, size: string | undefined, delta: number) => {
    setItems(prev => {
      return prev.map(item => {
        if (item.id === id && item.size === size) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((i): i is CartItem => i !== null);
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, storeSlug, setStoreSlug }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
