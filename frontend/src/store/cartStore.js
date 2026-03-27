import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      isCartOpen: false,
      carritosPorUsuario: {},

      // 1. SELECTOR DE CARRITO (Básico)
      getCart: (userId = 'guest') => get().carritosPorUsuario[userId] || [],

      // 2. CEREBRO DE DESCUENTOS Y TOTALES 🧠
      // Esta función calcula todo lo que el frontend necesita mostrar
      getCartTotals: (userId = 'guest') => {
        const items = get().carritosPorUsuario[userId] || [];
        
        // Sumamos todas las piezas (unidades)
        const totalItems = items.reduce((acc, item) => acc + Number(item.cantidad), 0);
        
        // Sumamos el subtotal sin descuentos
        const subtotal = items.reduce((acc, item) => acc + (Number(item.cantidad) * Number(item.precio_base)), 0);

        // Lógica de Tiers de Descuento (Espejo de tu Backend)
        let discountPercent = 0;
        let nextTier = null;
        let itemsNeeded = 0;

        if (totalItems >= 100) {
          discountPercent = 0.15;
        } else if (totalItems >= 50) {
          discountPercent = 0.10;
          nextTier = 100;
        } else if (totalItems >= 10) {
          discountPercent = 0.05;
          nextTier = 50;
        } else {
          discountPercent = 0;
          nextTier = 10;
        }

        itemsNeeded = nextTier ? nextTier - totalItems : 0;
        
        // Generador de mensajes dinámicos
        let promoMessage = "";
        if (discountPercent === 0.15) {
          promoMessage = "¡Felicidades! Has alcanzado el descuento máximo (15%)";
        } else if (nextTier) {
          const nextDcto = nextTier === 10 ? "5%" : (nextTier === 50 ? "10%" : "15%");
          promoMessage = `¡Añade ${itemsNeeded} piezas más para desbloquear un ${nextDcto} de descuento total!`;
        }

        const totalDiscount = subtotal * discountPercent;
        const finalTotal = subtotal - totalDiscount;

        return {
          totalItems,
          subtotal,
          discountPercent: discountPercent * 100, // En formato 0, 5, 10, 15
          totalDiscount,
          finalTotal,
          promoMessage,
          itemsNeeded
        };
      },

      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      addToCart: (producto, userId = 'guest', cantidadToAdd = 1) => set((state) => {
        const carritoActual = state.carritosPorUsuario[userId] || [];
        const existe = carritoActual.find((item) => item.id_producto === producto.id_producto);
        
        const stockDisponible = Number(producto.stock || 0);
        const esPrefabricado = producto.tipo_venta === 'prefabricado';

        let nuevoCarrito;
        if (existe) {
          const nuevaCantidad = existe.cantidad + cantidadToAdd;

          if (esPrefabricado && nuevaCantidad > stockDisponible) {
            alert(`Stock insuficiente. Solo quedan ${stockDisponible} unidades.`);
            return state; 
          }

          nuevoCarrito = carritoActual.map((item) =>
            item.id_producto === producto.id_producto
              ? { ...item, cantidad: nuevaCantidad }
              : item
          );
        } else {
          if (esPrefabricado && cantidadToAdd > stockDisponible) {
            alert(`Solo puedes agregar hasta ${stockDisponible} unidades.`);
            return state;
          }

          nuevoCarrito = [...carritoActual, { ...producto, cantidad: cantidadToAdd }];
        }

        return {
          carritosPorUsuario: {
            ...state.carritosPorUsuario,
            [userId]: nuevoCarrito
          }
        };
      }),

      decreaseQuantity: (id_producto, userId = 'guest') => set((state) => {
        const carritoActual = state.carritosPorUsuario[userId] || [];
        const nuevoCarrito = carritoActual.map((item) => {
          if (item.id_producto === id_producto) {
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
      // No persistimos el carrito de invitados para evitar basura en el localstorage
      partialize: (state) => ({
        carritosPorUsuario: Object.fromEntries(
          Object.entries(state.carritosPorUsuario).filter(([key]) => key !== 'guest')
        )
      }),
    }
  )
);