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
      <header className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-black uppercase mb-4 tracking-tighter">Favourite Threads</h1>
        <p className="text-gray-600 max-w-xl mx-auto">Premium quality graphic t-shirts with modern, unique designs.</p>
      </header>

      <Marquee text="COLLECTIONS" />

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Quality Crafted T-Shirts for Every Style</h2>
        </div>

        {error && <p className="text-center text-red-500">Error: {error}</p>}
        {cargando ? (
          <p className="text-center text-gray-500 font-bold">Cargando productos...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {productos.length > 0 ? (
              productos.map((prod) => <ProductCard key={prod.id_producto} producto={prod} />)
            ) : (
              <p className="col-span-full text-center text-gray-500">No hay productos disponibles.</p>
            )}
          </div>
        )}
      </main>

      <footer className="p-8 border-t text-center text-sm font-semibold flex flex-col md:flex-row justify-between items-center">
        <p>© 2026 Bilane Creek. All rights reserved.</p>
      </footer>
    </>
  );
}

function App() {
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const carritosPorUsuario = useCartStore((state) => state.carritosPorUsuario);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  
  // Obtenemos el usuario activo
  const user = useAuthStore((state) => state.user);
  const userId = user ? user.id : 'guest';

  // Filtramos los items solo de ESTE usuario
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