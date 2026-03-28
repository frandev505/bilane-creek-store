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
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f8] dark:bg-gray-900 transition-colors duration-300">
        <div className="text-xl font-bold animate-pulse text-[#722F37] dark:text-[#b08790]">Cargando detalles de tu producto...</div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f8] dark:bg-gray-900 dark:text-white transition-colors duration-300 gap-4">
        <h2 className="text-2xl font-bold">Producto no encontrado</h2>
        <Link to="/" className="text-[#722F37] dark:text-[#b08790] underline hover:text-black dark:hover:text-gray-300">Volver a la tienda</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!tallaSeleccionada) {
      alert("Por favor selecciona una talla");
      return;
    }
    addToCart({ ...producto, talla: tallaSeleccionada }, userId, cantidad);
  };

  return (
    <div className="min-h-screen bg-[#faf9f8] dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans pb-20 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 transition-colors">
          <Link to="/" className="hover:text-black dark:hover:text-white cursor-pointer underline decoration-gray-300 dark:decoration-gray-600 underline-offset-4">Home</Link> / 
          <span className="mx-2">{producto.categoria || 'Camisas'}</span> / 
          <span className="text-black dark:text-white font-medium">{producto.nombre}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* GALERÍA */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#e9e9e9] dark:bg-gray-800 aspect-[4/5] relative rounded-md overflow-hidden flex items-center justify-center transition-colors">
              <img 
                src={imagenPrincipal} 
                alt={producto.nombre} 
                className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
              />
            </div>
            
            <div className="flex gap-4">
              {imagenes.map((img, index) => (
                <button 
                  key={index}
                  onClick={() => setImagenPrincipal(img)}
                  className={`w-24 aspect-[4/5] bg-[#e9e9e9] dark:bg-gray-800 rounded-md overflow-hidden border-2 transition-all ${imagenPrincipal === img ? 'border-[#722F37] dark:border-gray-300' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                </button>
              ))}
            </div>
          </div>

          {/* DETALLES */}
          <div className="flex flex-col pt-4">
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-4 dark:text-white">{producto.nombre}</h1>
            <p className="text-xl font-bold mb-8 dark:text-gray-200">${Number(producto.precio_base).toFixed(2)}</p>

            <div className="mb-8 flex items-center gap-4">
              <label className="font-bold text-sm">Size</label>
              <select 
                value={tallaSeleccionada}
                onChange={(e) => setTallaSeleccionada(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-800 rounded-sm px-4 py-2 text-sm focus:outline-none focus:border-[#722F37] dark:focus:border-gray-300 cursor-pointer transition-colors"
              >
                <option value="" disabled className="dark:bg-gray-800">Choose an option</option>
                <option value="S" className="dark:bg-gray-800">S</option>
                <option value="M" className="dark:bg-gray-800">M</option>
                <option value="L" className="dark:bg-gray-800">L</option>
                <option value="XL" className="dark:bg-gray-800">XL</option>
              </select>
            </div>

            <div className="flex gap-4 mb-12 h-12">
              <input 
                type="number" 
                min="1" 
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-800 text-center focus:outline-none focus:border-[#722F37] dark:focus:border-gray-300 rounded-sm font-bold transition-colors"
              />
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-black dark:bg-white text-white dark:text-black font-bold tracking-widest uppercase hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-sm"
              >
                Add to cart
              </button>
            </div>

            <div className="prose prose-sm dark:prose-invert text-gray-600 dark:text-gray-300">
              <p>{producto.descripcion}</p>
              <ul className="mt-4 space-y-2">
                <li>Categoría: {producto.categoria}</li>
                <li>Stock disponible: {producto.stock} unidades</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}