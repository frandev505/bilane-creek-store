import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export default function ProductCard({ producto }) {
  const addToCart = useCartStore((state) => state.addToCart);
  
  const user = useAuthStore((state) => state.user);
  const userId = user ? user.id : 'guest';
  
  // Verificamos si el usuario actual es un administrador
  const isAdmin = user?.rol === 'admin';

  const imageUrl = producto.imagen_url 
    ? producto.imagen_url 
    : `https://ui-avatars.com/api/?name=${producto.nombre}&background=random&size=400`;

  return (
    <div className="flex flex-col gap-3 group cursor-pointer">
      <div className="aspect-[3/4] bg-gray-100 overflow-hidden relative">
        <img 
          src={imageUrl} 
          alt={producto.nombre}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="text-center">
        <h3 className="font-bold text-lg">{producto.nombre}</h3>
        <p className="text-sm text-gray-500">{producto.categoria}</p>
        <p className="text-gray-900 font-semibold">${Number(producto.precio_base).toFixed(2)}</p>
      </div>
      
      {/* NOVEDAD: Si NO es admin (!isAdmin), mostramos el botón. Si es admin, no renderiza nada. */}
      {!isAdmin && (
        <button 
          onClick={() => addToCart(producto, userId)}
          className="w-full bg-black text-white py-3 font-semibold hover:bg-gray-800 transition-colors"
        >
          Añadir al Carrito
        </button>
      )}
    </div>
  );
}