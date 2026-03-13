import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      isCartOpen: false,
      carritosPorUsuario: {}, 

      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      addToCart: (producto, userId = 'guest') => set((state) => {
        const carritoActual = state.carritosPorUsuario[userId] || [];
        const existe = carritoActual.find((item) => item.id_producto === producto.id_producto);
        
        let nuevoCarrito;
        if (existe) {
          nuevoCarrito = carritoActual.map((item) =>
            item.id_producto === producto.id_producto
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          );
        } else {
          nuevoCarrito = [...carritoActual, { ...producto, cantidad: 1 }];
        }

        return {
          carritosPorUsuario: {
            ...state.carritosPorUsuario,
            [userId]: nuevoCarrito
          }
        };
      }),

      removeFromCart: (id_producto, userId = 'guest') => set((state) => {
        const carritoActual = state.carritosPorUsuario[userId] || [];
        return {
          carritosPorUsuario: {
            ...state.carritosPorUsuario,
            [userId]: carritoActual.filter((item) => item.id_producto !== id_producto)
          }
        };
      }),

      clearCart: (userId = 'guest') => set((state) => ({
         carritosPorUsuario: {
           ...state.carritosPorUsuario,
           [userId]: []
         }
      }))
    }),
    {
      name: 'bilane-cart-storage',
      // AQUÍ ESTÁ LA CLAVE: partialize decide qué va al LocalStorage permanentemente
      partialize: (state) => ({
        ...state,
        // Filtramos para guardar TODOS los carritos MENOS el de 'guest'
        carritosPorUsuario: Object.fromEntries(
          Object.entries(state.carritosPorUsuario).filter(([key]) => key !== 'guest')
        )
      }),
    }
  )
);