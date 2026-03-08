import { ShoppingCart, Menu, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const toggleCart = useCartStore((state) => state.toggleCart);
  const carritosPorUsuario = useCartStore((state) => state.carritosPorUsuario);
  
  // Identificamos al usuario activo
  const user = useAuthStore((state) => state.user);
  const userId = user ? user.id : 'guest';

  // NOVEDAD: Verificamos si el usuario actual es un administrador
  const isAdmin = user?.rol === 'admin';

  // Obtenemos solo el carrito del usuario actual
  const cartItems = carritosPorUsuario[userId] || [];
  const totalItems = cartItems.reduce((total, item) => total + item.cantidad, 0);

  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-50">
      <button className="md:hidden"><Menu /></button>
      
      <div className="hidden md:flex gap-6 font-semibold text-sm">
        <Link to="/" className="hover:text-gray-600">Home</Link>
        <a href="#" className="hover:text-gray-600">Shop</a>
      </div>
      
      <Link to="/" className="text-2xl font-black tracking-tighter">BILANE CREEK</Link>
      
      <div className="flex items-center gap-6">
        <Link to="/my-account" className="hover:text-gray-600">
          <User className="w-6 h-6" />
        </Link>
        
        {/* NOVEDAD: Si NO es admin (!isAdmin), dibuja el carrito. Si es admin, desaparece. */}
        {!isAdmin && (
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
  );
}