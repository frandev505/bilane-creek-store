import { create } from 'zustand';

// Creamos la "bóveda" global para el carrito
export const useCartStore = create((set) => ({
  carrito: [], // Aquí se guardarán los productos
  
  agregarAlCarrito: (producto) => set((state) => {
    // Revisamos si el producto ya está en el carrito
    const productoExistente = state.carrito.find(item => item.id_producto === producto.id_producto);
    
    if (productoExistente) {
      // Si ya existe, solo le sumamos 1 a la cantidad
      return {
        carrito: state.carrito.map(item => 
          item.id_producto === producto.id_producto 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        )
      };
    }
    
    // Si no existe, lo agregamos con cantidad 1
    return { carrito: [...state.carrito, { ...producto, cantidad: 1 }] };
  }),

  limpiarCarrito: () => set({ carrito: [] })
}));