import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';

export default function Shop() {
  const { productos, cargando, error } = useProducts();
  const [orden, setOrden] = useState('recientes');

  // Lógica para ordenar los productos dinámicamente
  const productosOrdenados = [...productos].sort((a, b) => {
    if (orden === 'precio-asc') return a.precio_base - b.precio_base;
    if (orden === 'precio-desc') return b.precio_base - a.precio_base;
    // Si tuvieras fecha de creación podrías ordenar por recientes, 
    // por ahora lo dejamos en su orden original de la base de datos
    return 0;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 pt-10 pb-24">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* ================= HEADER DE LA TIENDA ================= */}
        <div className="mb-12 border-b border-gray-200 dark:border-gray-800 pb-10 mt-8">
          <p className="uppercase tracking-[0.3em] text-xs font-bold text-gray-400 mb-3">
            Official Store
          </p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black dark:text-white leading-none">
            All Products
          </h1>
          <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium max-w-2xl text-lg">
            Explora nuestra colección completa. Diseños exclusivos, calidad premium y el ajuste perfecto para tu día a día.
          </p>
        </div>

        {/* ================= BARRA DE HERRAMIENTAS (Filtros) ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-sm border border-gray-100 dark:border-gray-800">
            {productos.length} Productos
          </span>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 hidden sm:block">
              Sort By:
            </label>
            <div className="relative w-full md:w-64">
              <select 
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="w-full bg-transparent border-b-2 border-black dark:border-white text-black dark:text-white text-sm py-3 pr-8 focus:outline-none transition-colors cursor-pointer appearance-none uppercase tracking-widest font-bold rounded-none"
              >
                <option value="recientes" className="text-black bg-white">Latest Drops</option>
                <option value="precio-asc" className="text-black bg-white">Price: Low to High</option>
                <option value="precio-desc" className="text-black bg-white">Price: High to Low</option>
              </select>
              {/* Flechita personalizada para el select */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-black dark:text-white">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ================= GRILLA DE PRODUCTOS ================= */}
        {error && (
          <div className="text-center text-red-500 font-bold p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-sm">
            Error al cargar el catálogo: {error}
          </div>
        )}
        
        {cargando ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin dark:border-white dark:border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {productosOrdenados.length > 0 ? (
              productosOrdenados.map((prod) => (
                <ProductCard key={prod.id_producto} producto={prod} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 py-20 text-xl font-medium">
                No hay productos disponibles en este momento.
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}