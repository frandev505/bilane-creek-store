import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useProducts } from '../hooks/useProducts'; 

export default function ProductDetail() {
  const { id } = useParams();

  const addToCart = useCartStore((state) => state.addToCart);
  const user = useAuthStore((state) => state.user);
  const userId = user ? user.id : 'guest';

  const { productos, cargando: cargandoProductos } = useProducts();

  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  const [cantidad, setCantidad] = useState(1);
  const [tallaSeleccionada, setTallaSeleccionada] = useState('');
  const [errorTalla, setErrorTalla] = useState(false);

  useEffect(() => {
    if (!cargandoProductos) {
      const prodEncontrado = productos.find(p => String(p.id_producto) === String(id));

      if (prodEncontrado) {
        setProducto(prodEncontrado);
      }
      setCargando(false);
    }
  }, [id, productos, cargandoProductos]);

  if (cargando || cargandoProductos) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin dark:border-white dark:border-t-transparent"></div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 gap-6">
        <h2 className="text-3xl font-black uppercase tracking-widest">Producto no encontrado</h2>
        <Link to="/shop" className="border-b-2 border-black dark:border-white pb-1 font-bold uppercase tracking-widest text-xs hover:text-gray-500 dark:hover:text-gray-400 transition-colors">Volver a la tienda</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!tallaSeleccionada) {
      setErrorTalla(true);
      return;
    }
    setErrorTalla(false);
    addToCart({ ...producto, talla: tallaSeleccionada }, userId, cantidad);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans pb-32 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 pt-12">
        
        {/* BREADCRUMBS */}
        <div className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-12 border-b border-gray-200 dark:border-gray-800 pb-6 transition-colors font-bold">
          <Link to="/" className="hover:text-black dark:hover:text-white transition-colors">Home</Link>
          <span className="mx-3">/</span> 
          <Link to="/shop" className="hover:text-black dark:hover:text-white transition-colors">Shop</Link>
          <span className="mx-3">/</span> 
          <span className="text-black dark:text-white">{producto.categoria || 'Camisas'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
          
          {/* ================= COLUMNA 1: IMAGEN PRINCIPAL (SIN GALERÍA) ================= */}
          <div className="bg-gray-100 dark:bg-gray-900 aspect-[4/5] relative rounded-sm overflow-hidden flex items-center justify-center transition-colors">
            <img 
              src={producto.imagen_url || `https://ui-avatars.com/api/?name=${producto.nombre}&background=random&size=400`} 
              alt={producto.nombre} 
              className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
            />
            {/* Etiqueta Bajo Pedido si aplica */}
            {producto.tipo_venta !== 'prefabricado' && (
               <span className="absolute top-4 left-4 bg-purple-900/90 dark:bg-purple-600/90 backdrop-blur-sm text-purple-100 border border-purple-500/50 dark:border-purple-300/30 text-[10px] font-bold px-3 py-1.5 rounded-sm shadow-lg uppercase tracking-widest transition-colors">
                 Bajo Pedido
               </span>
            )}
          </div>

          {/* ================= COLUMNA 2: DETALLES ================= */}
          <div className="flex flex-col pt-4 md:pt-10">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">{producto.nombre}</h1>
            <p className="text-2xl font-medium mb-12 text-gray-600 dark:text-gray-300">${Number(producto.precio_base).toFixed(2)}</p>

            {/* SELECTOR DE TALLA */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="font-bold text-xs uppercase tracking-widest text-gray-500">Select Size</label>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {['S', 'M', 'L', 'XL'].map((talla) => (
                  <button
                    key={talla}
                    onClick={() => {
                      setTallaSeleccionada(talla);
                      setErrorTalla(false);
                    }}
                    className={`py-3 text-sm font-bold border transition-colors rounded-sm ${
                      tallaSeleccionada === talla 
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black' 
                        : 'border-gray-200 text-black hover:border-black dark:border-gray-800 dark:text-white dark:hover:border-white'
                    }`}
                  >
                    {talla}
                  </button>
                ))}
              </div>
              {errorTalla && (
                <p className="text-red-500 text-xs font-bold uppercase tracking-widest mt-3 animate-pulse">
                  Please select a size before adding to cart.
                </p>
              )}
            </div>

            {/* CANTIDAD Y BOTÓN */}
            <div className="flex gap-4 mb-16 h-14">
              <input 
                type="number" 
                min="1" 
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 border border-black dark:border-white bg-transparent text-center focus:outline-none rounded-sm font-bold text-lg"
              />
              <button 
                onClick={handleAddToCart}
                disabled={producto.tipo_venta === 'prefabricado' && producto.stock <= 0}
                className={`flex-1 font-black tracking-[0.2em] uppercase transition-colors rounded-sm text-sm ${
                  producto.tipo_venta === 'prefabricado' && producto.stock <= 0
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-[#722F37] dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-gray-200'
                }`}
              >
                {producto.tipo_venta === 'prefabricado' && producto.stock <= 0 ? 'Out of Stock' : 'Add to cart'}
              </button>
            </div>

            {/* DESCRIPCIÓN */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
              <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500 mb-4">Product Details</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6 font-medium">
                {producto.descripcion || "Premium quality garment. Designed with attention to detail and crafted from high-grade materials for maximum comfort and durability."}
              </p>
              <ul className="space-y-3 text-xs uppercase tracking-widest text-gray-500 font-bold">
                <li className="flex justify-between border-b border-gray-100 dark:border-gray-900 pb-2">
                  <span>Category</span>
                  <span className="text-black dark:text-white">{producto.categoria}</span>
                </li>
                <li className="flex justify-between border-b border-gray-100 dark:border-gray-900 pb-2">
                  <span>Availability</span>
                  <span className="text-black dark:text-white">
                    {producto.tipo_venta === 'bajo_pedido' 
                      ? 'Bajo Pedido (♾️)' 
                      : (producto.stock > 0 ? `${producto.stock} Units Available` : 'Out of Stock')}
                  </span>
                </li>
              </ul>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}