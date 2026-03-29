import { Link, useNavigate } from 'react-router-dom'; // 🔥 Agregamos useNavigate
import { useAuthStore } from '../store/authStore';

export default function ProductCard({ producto }) {
  // Ya no necesitamos el cartStore aquí, porque no agregaremos desde la tarjeta
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.rol === 'admin';
  const navigate = useNavigate(); // Hook para redireccionar

  const imageUrl = producto.imagen_url 
    ? producto.imagen_url 
    : `https://ui-avatars.com/api/?name=${producto.nombre}&background=random&size=400`;

  const isPrefabricado = producto.tipo_venta === 'prefabricado';
  const stockActual = Number(producto.stock || 0);
  
  const isAgotado = isPrefabricado && stockActual <= 0;
  const isLowStock = isPrefabricado && stockActual > 0 && stockActual < 10;

  // 🔥 Nueva función: En lugar de agregar al carrito, lleva al detalle del producto
  const handleSelectOptions = (e) => {
    e.preventDefault(); 
    navigate(`/producto/${producto.id_producto}`);
  };

  return (
    <div className="flex flex-col gap-3 group relative">
      
      {/* ETIQUETAS INTELIGENTES */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
        {!isPrefabricado ? (
          <span className="bg-purple-900/90 dark:bg-purple-600/90 backdrop-blur-sm text-purple-100 border border-purple-500/50 dark:border-purple-300/30 text-[10px] font-bold px-2 py-1 rounded-sm shadow-lg uppercase tracking-widest transition-colors">
            Bajo Pedido
          </span>
        ) : isAgotado ? (
          <span className="bg-red-600/90 dark:bg-red-700/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-lg uppercase tracking-widest transition-colors">
            Agotado
          </span>
        ) : isLowStock ? (
          <span className="bg-orange-500/90 dark:bg-orange-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-lg uppercase tracking-widest animate-pulse transition-colors">
            Solo {stockActual} left
          </span>
        ) : null}
      </div>

      {/* ENVOLVEMOS LA IMAGEN Y EL TEXTO EN EL LINK */}
      <Link 
        to={`/producto/${producto.id_producto}`} 
        className="block cursor-pointer focus:outline-none"
      >
        <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden relative rounded-sm shadow-sm transition-colors">
          <img 
            src={imageUrl} 
            alt={producto.nombre}
            className={`w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-[10s] group-hover:scale-110 ${isAgotado ? 'grayscale opacity-60 dark:opacity-40' : ''}`}
          />
        </div>
        
        <div className="text-left mt-4">
          <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-gray-500 transition-colors">
            {producto.nombre}
          </h3>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest transition-colors">
            {producto.categoria}
          </p>
          
          <p className="text-black dark:text-white font-medium mt-2 text-sm transition-colors">
            ${Number(producto.precio_base).toFixed(2)}
          </p>
        </div>
      </Link>
      
      {/* BOTÓN ESTILO LUXURY */}
      {!isAdmin && (
        <div className="mt-2">
          {isAgotado ? (
            <button disabled className="w-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 py-3 font-bold cursor-not-allowed uppercase tracking-widest text-[10px] transition-colors rounded-sm">
              Out of Stock
            </button>
          ) : (
            <button 
              onClick={handleSelectOptions}
              className="w-full border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black py-3 font-bold text-[10px] uppercase tracking-widest transition-all rounded-sm"
            >
              Select Size
            </button>
          )}
        </div>
      )}
    </div>
  );
}