import { useEffect } from 'react'; // 🔥 IMPORTANTE: Agregamos useEffect
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Marquee from './components/Marquee';
import ProductCard from './components/ProductCard';
import MyAccount from './pages/MyAccount';
import AdminPanel from './components/AdminPanel'; 
import AuditorPanel from './components/AuditorPanel';
import Checkout from './pages/Checkout'; 
import HistorialCompras from './pages/HistorialCompras';
import ProductDetail from './pages/ProductDetail'; 
import { useProducts } from './hooks/useProducts'; 
import { useCartStore } from './store/cartStore'; 
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore'; // 🔥 1. IMPORTAMOS TU STORE DEL TEMA

function Home() {
  const { productos, cargando, error } = useProducts();
  
  return (
    <>
      <header className="relative w-full h-[70vh] flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          //style={{ backgroundImage: "url('/src/assets/sweter-think-less-copia-scaled-2560x1188.jpg')" }}
          style={{ backgroundImage: "url('../src/assets/sweter-think-less-copia-scaled-2560x1188.jpg')" }}
        ></div>

        <div className="relative z-20 px-4 text-white">
          <h1 className="text-5xl md:text-8xl font-black uppercase mb-4 tracking-tighter drop-shadow-lg">
            Favourite Threads
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto font-medium drop-shadow-md">
            Premium quality graphic t-shirts with modern, unique designs.
          </p>
          <button className="mt-8 bg-white text-black px-8 py-3 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
            Shop New Arrivals
          </button>
        </div>
      </header>

      <Marquee text="COLLECTIONS" bgColor="bg-black" textColor="text-white" />

      {/* 🔥 Agregamos dark:text-white para que los textos cambien */}
      <main className="max-w-7xl mx-auto px-4 py-20 dark:text-white transition-colors duration-300">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black uppercase mb-2 tracking-tight">Latest Drops</h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Quality Crafted T-Shirts for Every Style.</p>
        </div>

        {error && <p className="text-center text-red-500 font-bold p-4 bg-red-50 rounded">Error: {error}</p>}
        {cargando ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-xl font-bold animate-pulse">Cargando productos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {productos.length > 0 ? (
              productos.map((prod) => <ProductCard key={prod.id_producto} producto={prod} />)
            ) : (
              <p className="col-span-full text-center text-gray-500">No hay productos disponibles.</p>
            )}
          </div>
        )}
      </main>

      {/* 🔥 Ajustes de modo oscuro para la sección Elevate Your Style */}
      <section className="bg-gray-100 dark:bg-gray-800 py-24 text-center px-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <h2 className="text-4xl font-black uppercase mb-6 tracking-tight dark:text-white">Elevate Your Style</h2>
        <button className="bg-black dark:bg-white text-white dark:text-black px-10 py-4 font-bold tracking-widest uppercase hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
          Discover Now
        </button>
      </section>

      <footer className="bg-black text-white p-10 flex flex-col md:flex-row justify-between items-center text-sm font-semibold">
        <p className="mb-4 md:mb-0">© 2026 Bilane Creek. All rights reserved.</p>
        <div className="flex gap-6 uppercase tracking-wider">
          <a href="#" className="hover:text-gray-400 transition-colors">Instagram</a>
          <a href="#" className="hover:text-gray-400 transition-colors">Facebook</a>
          <a href="#" className="hover:text-gray-400 transition-colors">X</a>
        </div>
      </footer>
    </>
  );
}

function App() {
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const carritosPorUsuario = useCartStore((state) => state.carritosPorUsuario);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  
  const addToCart = useCartStore((state) => state.addToCart);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const getCartTotals = useCartStore((state) => state.getCartTotals); 
  
  const user = useAuthStore((state) => state.user);
  const userId = user ? user.id : 'guest';

  const cartItems = carritosPorUsuario[userId] || [];
  
  const { subtotal, discountPercent, totalDiscount, finalTotal, promoMessage } = getCartTotals(userId);

  // 🔥 2. TRAEMOS EL ESTADO DEL MODO OSCURO
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  // 🔥 3. EFECTO QUE CAMBIA LA CLASE DEL HTML CUANDO TOCAS EL BOTÓN
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      {/* 🔥 4. AGREGAMOS dark:bg-gray-900 y dark:text-white AL CONTENEDOR PRINCIPAL */}
      <div className="min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white font-sans relative transition-colors duration-300">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/auditor" element={<AuditorPanel />} />
          <Route path="/checkout" element={<Checkout />} /> 
          <Route path="/mis-compras" element={<HistorialCompras />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
        </Routes>

        {/* ================================================== */}
        {/* CARRITO LATERAL (AHORA CON CLASES PARA MODO OSCURO)  */}
        {/* ================================================== */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={toggleCart} />
            
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 h-full shadow-xl flex flex-col transition-colors duration-300">
              
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 transition-colors">
                <h2 className="font-bold text-lg dark:text-white">Your cart</h2>
                <button onClick={toggleCart} className="font-bold text-xl hover:text-red-500 dark:text-white dark:hover:text-red-400 transition">✕</button>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center">
                    <h3 className="text-xl font-bold mb-4 dark:text-white">Your cart is empty!</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user ? 'Agrega productos a tu cuenta' : 'Inicia sesión para guardar tus productos'}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {cartItems.map(item => (
                      <div key={item.id_producto} className="flex justify-between items-center border-b dark:border-gray-700 pb-4">
                        <div>
                          <p className="font-bold dark:text-white">{item.nombre}</p>
                          
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center border dark:border-gray-600 rounded">
                              <button onClick={() => decreaseQuantity(item.id_producto, userId)} className="px-2 py-0.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">-</button>
                              <span className="px-2 text-sm font-bold border-x dark:border-gray-600 dark:text-white">{item.cantidad}</span>
                              <button onClick={() => addToCart(item, userId)} className="px-2 py-0.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">+</button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id_producto, userId)} 
                              className="text-red-500 dark:text-red-400 text-xs font-bold hover:underline uppercase tracking-widest"
                            >
                              Eliminar
                            </button>
                          </div>

                        </div>
                        <p className="font-bold dark:text-white">${(item.precio_base * item.cantidad).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col gap-3 transition-colors">
                  
                  {promoMessage && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm p-3 rounded-md text-center font-bold shadow-sm">
                      ✨ {promoMessage}
                    </div>
                  )}

                  {discountPercent > 0 && (
                    <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                  )}

                  {discountPercent > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400 text-sm font-bold">
                      <span>Descuento por volumen ({discountPercent}%):</span>
                      <span>-${totalDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-xl mb-2 mt-1 dark:text-white">
                    <span>Total:</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                  
                  <Link 
                    to="/checkout"
                    onClick={toggleCart}
                    className="block w-full text-center bg-black dark:bg-white text-white dark:text-black py-4 font-bold tracking-widest uppercase hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-sm"
                  >
                    Ir al Pago
                  </Link>
                  
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;