import { create } from 'zustand';

// Zustand crea un hook global que podemos usar en cualquier componente
export const useCartStore = create((set) => ({
  // Estado inicial
  isCartOpen: false,
  cartItems: [],

  // Acciones para modificar el estado
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  
  addToCart: (producto) => set((state) => {
    // Verificamos si el producto ya está en el carrito
    const existe = state.cartItems.find((item) => item.id_producto === producto.id_producto);
    
    if (existe) {
      // Si existe, le sumamos 1 a la cantidad
      return {
        cartItems: state.cartItems.map((item) =>
          item.id_producto === producto.id_producto
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        ),
      };
    }
    // Si no existe, lo agregamos con cantidad 1
    return { cartItems: [...state.cartItems, { ...producto, cantidad: 1 }] };
  }),

  removeFromCart: (id_producto) => set((state) => ({
    cartItems: state.cartItems.filter((item) => item.id_producto !== id_producto)
  })),

  clearCart: () => set({ cartItems: [] })
}));