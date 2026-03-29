import { useState } from 'react';
// 🔥 1. IMPORTAMOS 'X' PARA PODER CERRAR EL MENÚ MÓVIL
import { ShoppingCart, Menu, User, Sun, Moon, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import CambiarPassword from './CambiarPassword';

export default function Navbar() {
  const toggleCart = useCartStore((state) => state.toggleCart);
  const carritosPorUsuario = useCartStore((state) => state.carritosPorUsuario);
  
  const user = useAuthStore((state) => state.user);
  const userId = user ? user.id : 'guest';
  const logout = useAuthStore((state) => state.logout);

  const isAdmin = user?.rol === 'admin' || user?.rol === 'gerente';
  const isAuditor = user?.rol === 'auditor'; 

  const cartItems = carritosPorUsuario[userId] || [];
  const totalItems = cartItems.reduce((total, item) => total + item.cantidad, 0);

  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const toggleDarkMode = useThemeStore((state) => state.toggleDarkMode);

  const [menuAbierto, setMenuAbierto] = useState(false); // Menú del usuario
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  
  // 🔥 2. NUEVO ESTADO PARA EL MENÚ DE NAVEGACIÓN EN MÓVILES
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  return (
    <>
      <nav className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-40 transition-colors duration-300 relative">
        
        {/* 🔥 3. BOTÓN HAMBURGUESA CON FUNCIONALIDAD */}
        <button 
          className="md:hidden dark:text-white transition-colors"
          onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
        >
          {menuMovilAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        
        {/* LINKS ESCRITORIO */}
        <div className="hidden md:flex gap-6 font-semibold text-sm">
          <Link to="/" className="hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400 transition-colors">Home</Link>
          <Link to="/shop" className="hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400 transition-colors">Shop</Link>
        </div>
        
        <Link to="/" className="text-2xl font-black tracking-tighter dark:text-white transition-colors">BILANE CREEK</Link>
        
        <div className="flex items-center gap-6">
          
          <button 
            onClick={toggleDarkMode} 
            className="hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400 transition-colors focus:outline-none"
            title="Cambiar tema"
          >
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>

          {/* ================= ZONA DEL USUARIO ================= */}
          <div className="relative">
            {user ? (
              <button 
                onClick={() => setMenuAbierto(!menuAbierto)} 
                className="hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400 flex items-center gap-1 focus:outline-none transition-colors"
              >
                <User className="w-6 h-6" />
              </button>
            ) : (
              <Link to="/my-account" className="hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400 transition-colors">
                <User className="w-6 h-6" />
              </Link>
            )}

            {/* MENÚ DESPLEGABLE DEL USUARIO */}
            {user && menuAbierto && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-md shadow-xl text-black dark:text-white border dark:border-gray-700 overflow-hidden z-50 transition-colors">
                <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <p className="font-bold text-sm truncate">{user.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.rol}</p>
                </div>
                
                <div className="py-1">
                  <button 
                    onClick={() => {
                      setModalPasswordAbierto(true);
                      setMenuAbierto(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    Cambiar Contraseña
                  </button>

                  {!isAdmin && !isAuditor && (
                    <Link 
                      to="/mis-compras" 
                      onClick={() => setMenuAbierto(false)}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white font-medium"
                    >
                      Mis Compras
                    </Link>
                  )}

                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      onClick={() => setMenuAbierto(false)}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition text-blue-600 dark:text-blue-400 font-semibold"
                    >
                      Panel de Administración
                    </Link>
                  )}

                  {isAuditor && (
                    <Link 
                      to="/auditor" 
                      onClick={() => setMenuAbierto(false)}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition text-indigo-900 dark:text-indigo-400 font-semibold"
                    >
                      Panel de Auditoría
                    </Link>
                  )}
                  
                  <button 
                    onClick={() => {
                      if(logout) logout();
                      setMenuAbierto(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition border-t dark:border-gray-700 mt-1"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* ================= ZONA DEL CARRITO ================= */}
          {!isAdmin && !isAuditor && (
            <button onClick={toggleCart} className="relative flex items-center gap-1 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="bg-black dark:bg-white text-white dark:text-black font-bold text-xs rounded-full h-5 w-5 flex items-center justify-center absolute -top-2 -right-2 shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          )}
        </div>

        {/* 🔥 4. MENÚ DESPLEGABLE MÓVIL (NUEVO) */}
        {menuMovilAbierto && (
          <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-xl md:hidden flex flex-col px-6 py-6 gap-6 z-50 transition-colors duration-300">
            <Link 
              to="/" 
              onClick={() => setMenuMovilAbierto(false)} 
              className="text-xl font-bold uppercase tracking-widest text-black dark:text-white"
            >
              Home
            </Link>
            <Link 
              to="/shop" 
              onClick={() => setMenuMovilAbierto(false)} 
              className="text-xl font-bold uppercase tracking-widest text-black dark:text-white"
            >
              Shop
            </Link>
          </div>
        )}
      </nav>

      {/* ================= MODAL DE CONTRASEÑA FLOTANTE ================= */}
      {modalPasswordAbierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200 transition-colors">
            <button 
              onClick={() => setModalPasswordAbierto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white transition text-2xl font-bold z-10 leading-none"
            >
              &times;
            </button>
            <div className="p-2">
              <CambiarPassword />
            </div>
          </div>
        </div>
      )}
    </>
  );
}