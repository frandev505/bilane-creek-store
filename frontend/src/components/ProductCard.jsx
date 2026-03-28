// 1. IMPORTAMOS Link de react-router-dom
import { Link } from 'react-router-dom'; 
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export default function ProductCard({ producto }) {
  const cart = useCartStore((state) => state.cart) || [];
  const addToCart = useCartStore((state) => state.addToCart);
  
  const user = useAuthStore((state) => state.user);
  const userId = user ? user.id : 'guest';
  const isAdmin = user?.rol === 'admin';

  const imageUrl = producto.imagen_url 
    ? producto.imagen_url 
    : `https://ui-avatars.com/api/?name=${producto.nombre}&background=random&size=400`;

  const isPrefabricado = producto.tipo_venta === 'prefabricado';
  const stockActual = Number(producto.stock || 0);
  
  const productoEnCarrito = cart.find?.(item => item.id_producto === producto.id_producto);
  const cantidadEnCarrito = productoEnCarrito ? productoEnCarrito.cantidad : 0;
  const stockDisponibleParaAgregar = isPrefabricado ? (stockActual - cantidadEnCarrito) : 999;

  const isAgotado = isPrefabricado && stockActual <= 0;
  const isLowStock = isPrefabricado && stockActual > 0 && stockActual < 10;

  const handleAdd = (e) => {
    e.preventDefault(); 
    if (isPrefabricado && stockDisponibleParaAgregar < 1) return;
    addToCart(producto, userId, 1);
  };

  return (
    <div className="flex flex-col gap-3 group relative">
      
      {/* ETIQUETAS INTELIGENTES (Quedan arriba flotando) */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
        {!isPrefabricado ? (
          <span className="bg-purple-900/90 dark:bg-purple-600/90 backdrop-blur-sm text-purple-100 border border-purple-500/50 dark:border-purple-300/30 text-xs font-bold px-2.5 py-1 rounded shadow-lg uppercase tracking-wider transition-colors">
            ♾️ Bajo Pedido
          </span>
        ) : isAgotado ? (
          <span className="bg-red-600/90 dark:bg-red-700/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded shadow-lg uppercase tracking-wider transition-colors">
            Agotado
          </span>
        ) : isLowStock ? (
          <span className="bg-orange-500/90 dark:bg-orange-600/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded shadow-lg uppercase tracking-wider animate-pulse transition-colors">
            ¡Solo quedan {stockActual}!
          </span>
        ) : null}
      </div>

      {/* 2. ENVOLVEMOS LA IMAGEN Y EL TEXTO EN EL LINK */}
      <Link 
        to={`/producto/${producto.id_producto}`} 
        className="block cursor-pointer focus:outline-none"
      >
        <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden relative rounded-md shadow-sm transition-colors">
          <img 
            src={imageUrl} 
            alt={producto.nombre}
            className={`w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105 ${isAgotado ? 'grayscale opacity-60 dark:opacity-40' : ''}`}
          />
        </div>
        
        <div className="text-center mt-1">
          {/* 🔥 Aquí está la magia: Cambiamos text-gray-900 por dark:text-gray-100 */}
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight group-hover:text-[#722F37] dark:group-hover:text-[#b08790] transition-colors">{producto.nombre}</h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 transition-colors">{producto.categoria}</p>
          
          {/* 🔥 Y aquí cambiamos text-black por dark:text-white */}
          <p className="text-black dark:text-white font-black mt-1 text-xl transition-colors">${Number(producto.precio_base).toFixed(2)}</p>
        </div>
      </Link>
      
      {/* BOTÓN ÚNICO ELEGANTE */}
      {!isAdmin && (
        <div className="mt-2">
          {isAgotado ? (
            <button disabled className="w-full bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 py-3 rounded-full font-bold cursor-not-allowed uppercase tracking-wider text-xs transition-colors">
              Sin Stock
            </button>
          ) : isPrefabricado && stockDisponibleParaAgregar <= 0 ? (
            <button disabled className="w-full bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 py-3 rounded-full font-bold cursor-not-allowed uppercase tracking-wider text-xs transition-colors">
              Límite en carrito
            </button>
          ) : (
            <button 
              onClick={handleAdd}
              // 🔥 El botón ahora usa un fondo contrastante en modo oscuro para verse más "premium"
              className="w-full bg-[#722F37] dark:bg-white text-white dark:text-[#722F37] py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#502126] dark:hover:bg-gray-200 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Agregar al carrito
            </button>
          )}
        </div>
      )}
    </div>
  );
}