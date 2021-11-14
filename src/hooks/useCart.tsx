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

    return storagedCart ? JSON.parse(storagedCart) : [];
  });

  const setCartAndSetLocalStorage = (newCart: Product[]) => {
    setCart(newCart);
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
  };

  const addProduct = async (productId: number) => {
    try {
      api
        .get('products/' + productId)
        .then((result) => result.data)
        .then((product: Product) => {
          const indexCart = cart.findIndex(({ id }) => id === productId);
          if (indexCart === -1) {
            product.amount = 1;
            const newCart = [...cart, product];
            setCartAndSetLocalStorage(newCart);
          } else {
            updateProductAmount({
              productId,
              amount: cart[indexCart].amount + 1,
            });
          }
        })
        .catch((error) => {
          toast.error('Erro na adição do produto');
        });
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(({ id }) => id !== productId);
      if (newCart.length === cart.length) {
        throw new Error();
      } else {
        setCartAndSetLocalStorage(newCart);
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      api
        .get('stock/' + productId)
        .then((result) => result.data)
        .then((result: Stock) => {
          if (result.amount >= amount) {
            const newCart = cart.map((product) => {
              if (product.id === productId) {
                product.amount = amount;
              }
              return product;
            });
            setCartAndSetLocalStorage(newCart);
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        })
        .catch(() => {
          toast.error('Erro na alteração de quantidade do produto');
        });
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
