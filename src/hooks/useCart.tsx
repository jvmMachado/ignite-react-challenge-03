import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`products/${productId}`);
      const product = response.data;

      const productExists = cart.find(product => product.id === productId);

      if(productExists) {
        const adjustedCart = cart.map(product => {
          if(product.id === productId) {
            product.amount+=1;
            return product;
          } else {
            return product;
          }
        });
        
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(adjustedCart));
        setCart(adjustedCart);
      } else {
        const newCart = [...cart, {...product, amount: 1}];
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart)
        return;
      }

      // const newCart = [...cart, {...product, amount: 1}];
      // localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      // setCart(newCart)
      
    } catch {
      // TODO
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(product => product.id !== productId);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
      
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const adjustedCart = cart.map(product => {
        if(product.id === productId) {
          product.amount = amount;
          return product;
        } else {
          return product;
        }
      });
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(adjustedCart));
      setCart(adjustedCart);
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
