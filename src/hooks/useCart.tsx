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
      const productResponse = await api.get(`products/${productId}`);
      const product = productResponse.data;
      
      const stockResponse = await api.get(`stock/${productId}`);
      const stock = stockResponse.data;

      const productExists = cart.find(product => product.id === productId);

      if(productExists) {
        const adjustedCart = cart.map(product => {
          if(product.id === productId) {
            if((product.amount+1) > stock.amount) {
              throw toast.error('Quantidade solicitada fora de estoque');
            }
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
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(product => product.id !== productId);
      if(newCart.length === cart.length) {
        throw new Error();
      }
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockResponse = await api.get(`stock/${productId}`);
      const stock = stockResponse.data;

      const adjustedCart = cart.map(product => {
        if(product.id === productId) {
          if(amount <= 0) {
            throw new Error();
          }
          if(amount > stock.amount) {
            throw toast.error('Quantidade solicitada fora de estoque');
          }
          product.amount = amount;
          return product;
        } else {
          return product;
        }
      });
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(adjustedCart));
      setCart(adjustedCart);
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
