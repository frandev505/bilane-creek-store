import { useCartStore } from '../store/cartStore'; // Importamos Zustand

export default function ProductCard({ producto }) {
  // Extraemos la acción de agregar al carrito
  const addToCart = useCartStore((state) => state.addToCart);

  return (
    <div className="flex flex-col gap-3 group cursor-pointer">
      <div className="aspect-[3/4] bg-gray-100 overflow-hidden relative">
        <img 
          src={`https://ui-avatars.com/api/?name=${producto.nombre}&background=random&size=400`} 
          alt={producto.nombre}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="text-center">
        <h3 className="font-bold text-lg">{producto.nombre}</h3>
        <p className="text-sm text-gray-500">{producto.categoria}</p>
        <p className="text-gray-900 font-semibold">${Number(producto.precio_base).toFixed(2)}</p>
      </div>
      <button 
        onClick={() => addToCart(producto)} // Disparamos la acción de Zustand
        className="w-full bg-black text-white py-3 font-semibold hover:bg-gray-800 transition-colors"
      >
        Añadir al Carrito
      </button>
    </div>
  );
}