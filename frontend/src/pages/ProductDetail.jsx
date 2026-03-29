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
  const [imagenPrincipal, setImagenPrincipal] = useState('');
  const [imagenes, setImagenes] = useState([]);
  
  // 🔥 Nuevo estado para manejar el error de la talla sin usar alert()
  const [errorTalla, setErrorTalla] = useState(false);

  useEffect(() => {
    if (!cargandoProductos) {
      const prodEncontrado = productos.find(p => String(p.id_producto) === String(id));

      if (prodEncontrado) {
        setProducto(prodEncontrado);
        const galeria = prodEncontrado.galeria || [
          prodEncontrado.imagen_url, 
          prodEncontrado.imagen_url, 
          prodEncontrado.imagen_url
        ];
        
        setImagenes(galeria);
        setImagenPrincipal(galeria[0]);
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
    // 🔥 Verificación visual sin alert()
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

        {/* 🔥 Corregimos la estructura del grid para que quede lado a lado en PC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
          
          {/* ================= COLUMNA 1: GALERÍA ================= */}
          <div className="flex flex-col gap-4">
            <div className="bg-gray-100 dark:bg-gray-900 aspect-[4/5] relative rounded-sm overflow-hidden flex items-center justify-center transition-colors">
              <img 
                src={imagenPrincipal} 
                alt={producto.nombre} 
                className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {imagenes.map((img, index) => (
                <button 
                  key={index}
                  onClick={() => setImagenPrincipal(img)}
                  className={`aspect-[4/5] bg-gray-100 dark:bg-gray-900 rounded-sm overflow-hidden border transition-all ${imagenPrincipal === img ? 'border-black dark:border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                </button>
              ))}
            </div>
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
              {/* 🔥 Mensaje de error visual en lugar del alert() */}
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
                className="flex-1 bg-[#722F37] dark:bg-white text-white dark:text-black font-black tracking-[0.2em] uppercase hover:bg-black dark:hover:bg-gray-200 transition-colors rounded-sm text-sm"
              >
                Add to cart
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
                  <span className="text-black dark:text-white">{producto.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                </li>
              </ul>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}