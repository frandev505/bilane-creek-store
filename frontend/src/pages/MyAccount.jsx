import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import AdminPanel from '../components/AdminPanel';

export default function MyAccount() {
  const user = useAuthStore(state => state.user);
  const login = useAuthStore(state => state.login);
  const logout = useAuthStore(state => state.logout);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        login(data.usuario); // Guardamos el usuario globalmente
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    }
  };

  // Si ya inició sesión
  if (user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 min-h-[60vh]">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-black uppercase tracking-tighter">My Account</h1>
          <button onClick={logout} className="text-gray-500 hover:text-black font-semibold">Cerrar Sesión</button>
        </div>
        
        <p className="text-lg">Hola, <span className="font-bold">{user.nombre}</span>.</p>
        
        {/* Si es Admin, mostramos el Panel, si no, un mensaje genérico */}
        {user.rol === 'admin' ? (
          <AdminPanel />
        ) : (
          <div className="mt-8 p-6 bg-gray-50 rounded border">
            <h2 className="font-bold text-xl mb-4">Historial de Pedidos</h2>
            <p className="text-gray-500">Aún no has realizado ningún pedido.</p>
          </div>
        )}
      </div>
    );
  }

  // Si no ha iniciado sesión (Formulario estilo Bilane Creek)
  return (
    <div className="max-w-md mx-auto px-4 py-24 min-h-[70vh]">
      <h1 className="text-4xl font-black uppercase mb-8 tracking-tighter text-center">Login</h1>
      
      {error && <p className="bg-red-100 text-red-700 p-3 mb-4 rounded text-sm font-semibold">{error}</p>}

      <form onSubmit={handleLogin} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-bold mb-2">Username or email address <span className="text-red-500">*</span></label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Password <span className="text-red-500">*</span></label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black"
            required
          />
        </div>
        <button type="submit" className="w-full bg-black text-white font-bold uppercase tracking-widest py-4 hover:bg-gray-800 transition-colors">
          Log In
        </button>
      </form>
    </div>
  );
}