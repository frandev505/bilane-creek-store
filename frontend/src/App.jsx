import { useEffect } from 'react';
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
import Shop from './pages/Shop';
import { useProducts } from './hooks/useProducts'; 
import { useCartStore } from './store/cartStore'; 
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// 🔥 1. IMPORTAMOS LA IMAGEN DIRECTAMENTE PARA QUE NO SE ROMPA EN VERCEL
import heroBg from './assets/sweter-think-less-copia-scaled-2560x1188.jpg';

function Home() {
  const { productos, cargando, error } = useProducts();
  
  return (
    <>
      {/* ========================================================= */}
      {/* HERO SECTION - ESTILO PREMIUM BILANE CREEK                  */}
      {/* ========================================================= */}
      <header className="relative w-full h-[85vh] md:h-[90vh] flex items-center justify-center text-center overflow-hidden">
        {/* Overlay un poco más suave para que la ropa resalte */}
        <div className="absolute inset-0 bg-black/30 z-10 transition-colors duration-500"></div>
        
        {/* Imagen de fondo importada correctamente */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transform hover:scale-105 transition-transform duration-[20s] ease-out"
          style={{ backgroundImage: `url(${heroBg})` }}
        ></div>

        <div className="relative z-20 px-6 text-white flex flex-col items-center mt-10">
          <p className="uppercase tracking-[0.3em] text-xs md:text-sm font-semibold mb-4 drop-shadow-md">
            New Collection 2026
          </p>
          {/* Tipografía gigante, ajustada y con tracking negativo para un look más moderno */}
          <h1 className="text-6xl md:text-9xl font-black uppercase mb-6 tracking-tighter drop-shadow-xl leading-none">
            Favourite <br/> Threads
          </h1>
          <p className="text-base md:text-lg max-w-xl mx-auto font-medium drop-shadow-md text-white/90 mb-10">
            Premium quality graphic t-shirts crafted for the modern individual. Elevate your everyday style.
          </p>
          {/* Botón más elegante, estilo streetwear de lujo */}
          <button className="bg-white text-black px-12 py-4 text-sm font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300 shadow-xl">
            Shop New Arrivals
          </button>
        </div>
      </header>

      {/* MARQUEE más delgado y elegante */}
      <div className="border-y border-white/10">
        <Marquee text="COLLECTIONS" bgColor="bg-black" textColor="text-white" />
      </div>

      {/* ========================================================= */}
      {/* LATEST DROPS - CON MÁS AIRE (WHITESPACE)                    */}
      {/* ========================================================= */}
      <main className="max-w-[1400px] mx-auto px-6 py-24 md:py-32 dark:text-white transition-colors duration-300">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="text-left">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2">Latest Drops</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl font-medium">Curated selection of our best pieces.</p>
          </div>
          <Link to="/" className="text-sm font-bold uppercase tracking-widest border-b-2 border-black dark:border-white pb-1 hover:text-gray-500 hover:border-gray-500 transition-all">
            View All Products
          </Link>
        </div>

        {error && <p className="text-center text-red-500 font-bold p-4 bg-red-50 rounded">Error: {error}</p>}
        {cargando ? (
          <div className="flex justify-center items-center h-60">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin dark:border-white dark:border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {productos.length > 0 ? (
              productos.map((prod) => <ProductCard key={prod.id_producto} producto={prod} />)
            ) : (
              <p className="col-span-full text-center text-gray-500 py-20 text-xl font-medium">Nuevos productos llegarán pronto.</p>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* SECCIÓN INTERMEDIA INMERSIVA                                */}
      {/* ========================================================= */}
      <section className="relative w-full h-[60vh] flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gray-900 z-0"></div>
        {/* Aquí puedes poner otra imagen de fondo si quieres */}
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        
        <div className="relative z-20 px-4 text-white">
          <h2 className="text-5xl md:text-7xl font-black uppercase mb-6 tracking-tighter">Elevate Your Style</h2>
          <p className="text-lg text-white/70 max-w-lg mx-auto mb-10 font-medium">
            Designed in Nicaragua. Worn globally. Join the movement.
          </p>
          <button className="border-2 border-white text-white px-10 py-4 font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all duration-300">
            Discover The Brand
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FOOTER MINIMALISTA ESTILO LUXURY                            */}
      {/* ========================================================= */}
      <footer className="bg-white dark:bg-black text-black dark:text-white border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Bilane Creek</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              Redefining graphic apparel with a focus on quality, comfort, and bold aesthetics.
            </p>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-sm mb-6">Shop</h4>
            <ul className="space-y-4 text-gray-500 dark:text-gray-400 font-medium">
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">All Products</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">New Arrivals</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Best Sellers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-sm mb-6">Social</h4>
            <ul className="space-y-4 text-gray-500 dark:text-gray-400 font-medium">
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">TikTok</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Twitter (X)</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 py-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs font-semibold uppercase tracking-widest text-gray-400">
          <p>© 2026 Bilane Creek. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Privacy</a>
          </div>
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

  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white font-sans relative transition-colors duration-300">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/auditor" element={<AuditorPanel />} />
          <Route path="/checkout" element={<Checkout />} /> 
          <Route path="/mis-compras" element={<HistorialCompras />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/shop" element={<Shop />} />
        </Routes>

        {/* ================================================== */}
        {/* CARRITO LATERAL - ESTILO LUXURY MINIMALISTA        */}
        {/* ================================================== */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={toggleCart} />
            
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col transition-transform duration-300 transform translate-x-0">
              
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
                <h2 className="font-black uppercase tracking-widest text-xl dark:text-white">Cart</h2>
                <button onClick={toggleCart} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  {/* Icono de cerrar más estilizado */}
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center">
                    <p className="text-sm uppercase tracking-widest text-gray-400 font-bold mb-4">Your cart is empty</p>
                    <button onClick={toggleCart} className="border-b-2 border-black dark:border-white pb-1 font-bold text-sm hover:text-gray-500 hover:border-gray-500 transition-colors uppercase tracking-widest">
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {cartItems.map(item => (
                      <div key={item.id_producto} className="flex gap-4 items-center border-b border-gray-100 dark:border-gray-800 pb-6">
                        {/* Si tuvieras imagen en el carrito, iría aquí */}
                        <div className="flex-1">
                          <p className="font-black text-sm uppercase tracking-tight dark:text-white mb-2">{item.nombre}</p>
                          <p className="font-medium text-gray-500 dark:text-gray-400 mb-3">${Number(item.precio_base).toFixed(2)}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-gray-200 dark:border-gray-700 w-fit">
                              <button onClick={() => decreaseQuantity(item.id_producto, userId)} className="px-3 py-1 text-gray-500 hover:text-black dark:hover:text-white transition">-</button>
                              <span className="px-3 py-1 text-xs font-bold border-x border-gray-200 dark:border-gray-700 dark:text-white">{item.cantidad}</span>
                              <button onClick={() => addToCart(item, userId)} className="px-3 py-1 text-gray-500 hover:text-black dark:hover:text-white transition">+</button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id_producto, userId)} 
                              className="text-gray-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col gap-4">
                  
                  {promoMessage && (
                    <div className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white text-xs p-3 text-center font-bold uppercase tracking-widest">
                      {promoMessage}
                    </div>
                  )}

                  <div className="space-y-2 mt-2">
                    {discountPercent > 0 && (
                      <>
                        <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm font-medium">
                          <span>Subtotal</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600 dark:text-green-400 text-sm font-medium">
                          <span>Discount ({discountPercent}%)</span>
                          <span>-${totalDiscount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-black text-xl pt-4 border-t border-gray-100 dark:border-gray-800 dark:text-white">
                      <span className="uppercase tracking-widest text-sm self-center">Total</span>
                      <span>${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Link 
                    to="/checkout"
                    onClick={toggleCart}
                    className="mt-4 block w-full text-center bg-black dark:bg-white text-white dark:text-black py-5 text-sm font-black tracking-[0.2em] uppercase hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg"
                  >
                    Proceed to Checkout
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