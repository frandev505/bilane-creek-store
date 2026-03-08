import { ShoppingCart, Menu } from 'lucide-react';
import { useCartStore } from '../store/cartStore'; // Importamos Zustand

export default function Navbar() {
  // Extraemos lo que necesitamos del store global
  const toggleCart = useCartStore((state) => state.toggleCart);
  const cartItems = useCartStore((state) => state.cartItems);

  // Calculamos la cantidad total de artículos
  const totalItems = cartItems.reduce((total, item) => total + item.cantidad, 0);

  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-50">
      <button className="md:hidden"><Menu /></button>
      
      <div className="hidden md:flex gap-6 font-semibold text-sm">
        <a href="#" className="hover:text-gray-600">About Us</a>
        <a href="#" className="hover:text-gray-600">Features</a>
        <a href="#" className="hover:text-gray-600">Shop</a>
        <a href="#" className="hover:text-gray-600">Contact</a>
      </div>
      
      <div className="text-2xl font-black tracking-tighter">BILANE CREEK</div>
      
      <div className="flex items-center gap-4">
        <button onClick={toggleCart} className="relative flex items-center gap-1">
          <ShoppingCart />
          <span className="bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center absolute -top-2 -right-2">
            {totalItems}
          </span>
        </button>
      </div>
    </nav>
  );
}