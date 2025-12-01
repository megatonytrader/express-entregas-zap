import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "deliveryapp_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    loadCartFromLocalStorage();
  }, []);

  const loadCartFromLocalStorage = () => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed);
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  };

  const saveToLocalStorage = (cartItems: CartItem[]) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  };

  const addItem = (
    item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }
  ) => {
    const quantity = item.quantity || 1;
    const existingItem = items.find((i) => i.productId === item.productId);

    if (existingItem) {
      updateQuantity(item.productId, existingItem.quantity + quantity);
      return;
    }

    const newItem: CartItem = {
      id: crypto.randomUUID(),
      productId: item.productId,
      productName: item.productName,
      productPrice: item.productPrice,
      productImage: item.productImage,
      quantity,
    };

    const newItems = [...items, newItem];
    setItems(newItems);
    saveToLocalStorage(newItems);
    
    toast({
      title: "Produto adicionado",
      description: `${item.productName} foi adicionado ao carrinho`,
    });
  };

  const removeItem = (productId: string) => {
    const newItems = items.filter((item) => item.productId !== productId);
    setItems(newItems);
    saveToLocalStorage(newItems);
    
    toast({
      title: "Produto removido",
      description: "O produto foi removido do carrinho",
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }

    const newItems = items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );
    
    setItems(newItems);
    saveToLocalStorage(newItems);
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos do carrinho",
    });
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + item.productPrice * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
