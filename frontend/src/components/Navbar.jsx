import { useState } from 'react';
import { ShoppingCart, Menu, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import CambiarPassword from './CambiarPassword';

export default function Navbar() {
  const toggleCart = useCartStore((state) => state.toggleCart);
  const carritosPorUsuario = useCartStore((state) => state.carritosPorUsuario);
  
  // Identificamos al usuario activo
  const user = useAuthStore((state) => state.user);
  const userId = user ? user.id : 'guest';
  
  // Traemos la función de cerrar sesión
  const logout = useAuthStore((state) => state.logout);

  // Verificamos los roles del usuario actual
  const isAdmin = user?.rol === 'admin' || user?.rol === 'gerente';
  const isAuditor = user?.rol === 'auditor'; // <-- NUEVO: Identificamos al auditor

  // Obtenemos solo el carrito del usuario actual
  const cartItems = carritosPorUsuario[userId] || [];
  const totalItems = cartItems.reduce((total, item) => total + item.cantidad, 0);

  // ================= ESTADOS PARA EL MENÚ Y MODAL =================
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);

  return (
    <>
      <nav className="flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-40">
        <button className="md:hidden"><Menu /></button>
        
        <div className="hidden md:flex gap-6 font-semibold text-sm">
          <Link to="/" className="hover:text-gray-600">Home</Link>
          <a href="#" className="hover:text-gray-600">Shop</a>
        </div>
        
        <Link to="/" className="text-2xl font-black tracking-tighter">BILANE CREEK</Link>
        
        <div className="flex items-center gap-6">
          
          {/* ================= ZONA DEL USUARIO ================= */}
          <div className="relative">
            {user ? (
              // Si HAY usuario: Botón que abre el menú
              <button 
                onClick={() => setMenuAbierto(!menuAbierto)} 
                className="hover:text-gray-600 flex items-center gap-1 focus:outline-none"
              >
                <User className="w-6 h-6" />
              </button>
            ) : (
              // Si NO HAY usuario: Link normal para ir a login/registro
              <Link to="/my-account" className="hover:text-gray-600">
                <User className="w-6 h-6" />
              </Link>
            )}

            {/* MENÚ DESPLEGABLE */}
            {user && menuAbierto && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-md shadow-xl text-black border overflow-hidden z-50">
                <div className="p-4 border-b bg-gray-50">
                  <p className="font-bold text-sm truncate">{user.nombre}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
                </div>
                
                <div className="py-1">
                  {/* Opción Cambiar Contraseña */}
                  <button 
                    onClick={() => {
                      setModalPasswordAbierto(true);
                      setMenuAbierto(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition"
                  >
                    Cambiar Contraseña
                  </button>

                  {/* Acceso rápido al Panel (solo Admin/Gerente) */}
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      onClick={() => setMenuAbierto(false)}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 transition text-blue-600 font-semibold"
                    >
                      Panel de Administración
                    </Link>
                  )}

                  {/* NUEVO: Acceso rápido al Panel de Auditoría (solo Auditor) */}
                  {isAuditor && (
                    <Link 
                      to="/auditor" 
                      onClick={() => setMenuAbierto(false)}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 transition text-indigo-900 font-semibold"
                    >
                      Panel de Auditoría
                    </Link>
                  )}
                  
                  {/* Cerrar Sesión */}
                  <button 
                    onClick={() => {
                      if(logout) logout();
                      setMenuAbierto(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition border-t mt-1"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* ================= ZONA DEL CARRITO ================= */}
          {/* Ocultamos el carrito tanto para admin, gerente COMO PARA AUDITOR */}
          {!isAdmin && !isAuditor && (
            <button onClick={toggleCart} className="relative flex items-center gap-1">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center absolute -top-2 -right-2">
                  {totalItems}
                </span>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* ================= MODAL DE CONTRASEÑA FLOTANTE ================= */}
      {modalPasswordAbierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setModalPasswordAbierto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition text-2xl font-bold z-10 leading-none"
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