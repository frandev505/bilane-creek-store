import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Marquee from './components/Marquee';
import ProductCard from './components/ProductCard';
import MyAccount from './pages/MyAccount';
import { useProducts } from './hooks/useProducts'; 
import { useCartStore } from './store/cartStore'; 
import { useAuthStore } from './store/authStore';

function Home() {
  const { productos, cargando, error } = useProducts();
  
  return (
    <>
      {/* 1. HERO SECTION CON IMAGEN DE FONDO */}
      <header className="relative w-full h-[70vh] flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: "url('/src/assets/sweter-think-less-copia-scaled-2560x1188.jpg')" }}
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

      {/* 2. CINTA ANIMADA (MARQUEE) */}
      <Marquee text="COLLECTIONS" bgColor="bg-black" textColor="text-white" />

      {/* 3. CATÁLOGO */}
      <main className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black uppercase mb-2 tracking-tight">Latest Drops</h2>
          <p className="text-gray-500 text-lg">Quality Crafted T-Shirts for Every Style.</p>
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

      {/* 4. CTA BOTTOM */}
      <section className="bg-gray-100 py-24 text-center px-4 border-t border-gray-200">
        <h2 className="text-4xl font-black uppercase mb-6 tracking-tight">Elevate Your Style</h2>
        <button className="bg-black text-white px-10 py-4 font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors">
          Discover Now
        </button>
      </section>

      {/* FOOTER */}
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
  
  const user = useAuthStore((state) => state.user);
  const userId = user ? user.id : 'guest';

  const cartItems = carritosPorUsuario[userId] || [];
  const cartTotal = cartItems.reduce((total, item) => total + (item.precio_base * item.cantidad), 0);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-black font-sans relative">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/my-account" element={<MyAccount />} />
        </Routes>

        {/* CARRITO LATERAL */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={toggleCart} />
            <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h2 className="font-bold text-lg">Your cart</h2>
                <button onClick={toggleCart} className="font-bold text-xl">✕</button>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center">
                    <h3 className="text-xl font-bold mb-4">Your cart is empty!</h3>
                    <p className="text-sm text-gray-500">{user ? 'Agrega productos a tu cuenta' : 'Inicia sesión para guardar tus productos'}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {cartItems.map(item => (
                      <div key={item.id_producto} className="flex justify-between items-center border-b pb-4">
                        <div>
                          <p className="font-bold">{item.nombre}</p>
                          <p className="text-sm text-gray-500">Cant: {item.cantidad} x ${Number(item.precio_base).toFixed(2)}</p>
                          <button 
                            onClick={() => removeFromCart(item.id_producto, userId)} 
                            className="text-red-500 text-xs font-bold mt-2 hover:underline uppercase tracking-widest"
                          >
                            Eliminar
                          </button>
                        </div>
                        <p className="font-bold">${(item.precio_base * item.cantidad).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex justify-between font-bold text-lg mb-4">
                    <span>Total:</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button className="w-full bg-black text-white py-4 font-bold tracking-widest uppercase hover:bg-gray-800">
                    Ir al Pago
                  </button>
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