import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export default function ProductCard({ producto }) {
  // CORRECCIÓN: Extraemos por separado para evitar errores de renderizado infinito y pantalla en blanco
  const cart = useCartStore((state) => state.cart) || [];
  const addToCart = useCartStore((state) => state.addToCart);
  
  const user = useAuthStore((state) => state.user);
  const userId = user ? user.id : 'guest';
  const isAdmin = user?.rol === 'admin';

  const imageUrl = producto.imagen_url 
    ? producto.imagen_url 
    : `https://ui-avatars.com/api/?name=${producto.nombre}&background=random&size=400`;

  // ==========================================
  // LÓGICA DE STOCK VS CARRITO
  // ==========================================
  const isPrefabricado = producto.tipo_venta === 'prefabricado';
  const stockActual = Number(producto.stock || 0);
  
  // CORRECCIÓN: Buscamos de forma segura (con ?.) para evitar "Cannot read properties of undefined"
  const productoEnCarrito = cart.find?.(item => item.id_producto === producto.id_producto);
  const cantidadEnCarrito = productoEnCarrito ? productoEnCarrito.cantidad : 0;

  // El verdadero stock que el cliente aún puede agarrar
  const stockDisponibleParaAgregar = isPrefabricado ? (stockActual - cantidadEnCarrito) : 999;

  const isAgotado = isPrefabricado && stockActual <= 0;
  const isLowStock = isPrefabricado && stockActual > 0 && stockActual < 10;

  const handleAdd = (cantidad) => {
    // Verificamos que no agregue más de lo disponible antes de llamar a la función
    if (isPrefabricado && cantidad > stockDisponibleParaAgregar) return;
    addToCart(producto, userId, cantidad);
  };

  return (
    <div className="flex flex-col gap-3 group cursor-pointer relative">
      
      {/* ETIQUETAS INTELIGENTES */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
        {!isPrefabricado ? (
          <span className="bg-purple-900/90 backdrop-blur-sm text-purple-100 border border-purple-500/50 text-xs font-bold px-2.5 py-1 rounded shadow-lg uppercase tracking-wider">
            ♾️ Bajo Pedido
          </span>
        ) : isAgotado ? (
          <span className="bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded shadow-lg uppercase tracking-wider">
            Agotado
          </span>
        ) : isLowStock ? (
          <span className="bg-orange-500/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded shadow-lg uppercase tracking-wider animate-pulse">
            ¡Solo quedan {stockActual}!
          </span>
        ) : null}
      </div>

      <div className="aspect-[3/4] bg-gray-100 overflow-hidden relative rounded-md shadow-sm">
        <img 
          src={imageUrl} 
          alt={producto.nombre}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isAgotado ? 'grayscale opacity-60' : ''}`}
        />
      </div>
      
      <div className="text-center mt-1">
        <h3 className="font-bold text-lg text-gray-900 leading-tight">{producto.nombre}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{producto.categoria}</p>
        <p className="text-black font-black mt-1 text-xl">${Number(producto.precio_base).toFixed(2)}</p>
      </div>
      
      {/* BOTONES INTELIGENTES QUE SE BLOQUEAN AL LLEGAR AL LÍMITE */}
      {!isAdmin && (
        <div className="flex gap-1.5 mt-2">
          {isAgotado ? (
            <button disabled className="w-full bg-gray-200 text-gray-400 py-2.5 rounded font-bold cursor-not-allowed uppercase tracking-wider text-sm">
              Sin Stock
            </button>
          ) : isPrefabricado && stockDisponibleParaAgregar <= 0 ? (
            <button disabled className="w-full bg-orange-100 text-orange-600 border border-orange-300 py-2.5 rounded font-bold cursor-not-allowed uppercase tracking-wider text-sm">
              Límite en carrito
            </button>
          ) : (
            <>
              <button 
                onClick={() => handleAdd(1)}
                disabled={isPrefabricado && stockDisponibleParaAgregar < 1}
                className="flex-1 bg-black text-white py-2.5 rounded font-black text-sm hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                +1
              </button>
              <button 
                onClick={() => handleAdd(5)}
                disabled={isPrefabricado && stockDisponibleParaAgregar < 5}
                className="flex-1 bg-black text-white py-2.5 rounded font-black text-sm hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                +5
              </button>
              <button 
                onClick={() => handleAdd(10)}
                disabled={isPrefabricado && stockDisponibleParaAgregar < 10}
                className="flex-1 bg-black text-white py-2.5 rounded font-black text-sm hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                +10
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}