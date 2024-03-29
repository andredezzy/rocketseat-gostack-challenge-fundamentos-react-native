import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storagedProducts) {
        setProducts(JSON.parse(storagedProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      setProducts(state => {
        const productIndex = state.findIndex(item => item.id === product.id);

        if (productIndex >= 0) {
          state[productIndex].quantity++;
        } else {
          state.push({ ...product, quantity: 1 });
        }

        return [...state];
      });

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async (id: string) => {
      setProducts(state => {
        const productIndex = state.findIndex(product => product.id === id);

        state[productIndex].quantity++;

        return [...state];
      });

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async (id: string) => {
      setProducts(state => {
        const productIndex = state.findIndex(product => product.id === id);

        state[productIndex].quantity--;

        if (state[productIndex].quantity <= 0) {
          delete state[productIndex];
        }

        return [...state.filter(Boolean)];
      });

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`'useCart' must be used within a 'CartProvider'`);
  }

  return context;
}

export { CartProvider, useCart };
