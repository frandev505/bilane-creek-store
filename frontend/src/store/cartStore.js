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

      // --- NUEVA FUNCIÓN: DISMINUIR CANTIDAD ---
      decreaseQuantity: (id_producto, userId = 'guest') => set((state) => {
        const carritoActual = state.carritosPorUsuario[userId] || [];
        
        const nuevoCarrito = carritoActual.map((item) => {
          if (item.id_producto === id_producto) {
            // Si tiene más de 1, le restamos 1. Si tiene 1, se queda en 1.
            return { ...item, cantidad: Math.max(1, item.cantidad - 1) };
          }
          return item;
        });

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
      partialize: (state) => ({
        ...state,
        carritosPorUsuario: Object.fromEntries(
          Object.entries(state.carritosPorUsuario).filter(([key]) => key !== 'guest')
        )
      }),
    }
  )
);