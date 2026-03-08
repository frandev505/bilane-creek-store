import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore'; // <-- Importamos el store del carrito
import AdminPanel from '../components/AdminPanel';

export default function MyAccount() {
  const user = useAuthStore(state => state.user);
  const login = useAuthStore(state => state.login);
  const logout = useAuthStore(state => state.logout);

  // Estados para Login
  const [logEmail, setLogEmail] = useState('');
  const [logPassword, setLogPassword] = useState('');
  const [logError, setLogError] = useState('');

  // Estados para Registro
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Función para Iniciar Sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    setLogError('');
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: logEmail, password: logPassword })
      });
      const data = await response.json();
      
      if (response.ok) {
        login(data.usuario);
        // NOVEDAD: Vaciamos el carrito de invitado al iniciar sesión
        useCartStore.getState().clearCart('guest');
      } else {
        setLogError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setLogError('Error al conectar con el servidor');
    }
  };

  // Función para Registrarse
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: regNombre, email: regEmail, password: regPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setRegSuccess('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
        setRegNombre('');
        setRegEmail('');
        setRegPassword('');
      } else {
        setRegError(data.error || 'Error al crear la cuenta');
      }
    } catch (err) {
      setRegError('Error al conectar con el servidor');
    }
  };

  if (user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 min-h-[60vh]">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-black uppercase tracking-tighter">My Account</h1>
          <button onClick={logout} className="text-gray-500 hover:text-black font-semibold">Cerrar Sesión</button>
        </div>
        
        <p className="text-lg">Hola, <span className="font-bold">{user.nombre}</span>.</p>
        
        {user.rol === 'admin' ? (
          <AdminPanel />
        ) : (
          <div className="mt-8 p-6 bg-gray-50 rounded border">
            <h2 className="font-bold text-xl mb-4">Historial de Pedidos</h2>
            <p className="text-gray-500">Aún no has realizado ningún pedido. (Próximamente guardaremos tu carrito aquí).</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-24 min-h-[70vh]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        
        {/* COLUMNA IZQUIERDA: LOGIN */}
        <div>
          <h2 className="text-3xl font-black uppercase mb-8 tracking-tighter">Log In</h2>
          {logError && <p className="bg-red-100 text-red-700 p-3 mb-4 rounded text-sm font-semibold">{logError}</p>}
          
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Email address <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                value={logEmail}
                onChange={(e) => setLogEmail(e.target.value)}
                className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Password <span className="text-red-500">*</span></label>
              <input 
                type="password" 
                value={logPassword}
                onChange={(e) => setLogPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black"
                required
              />
            </div>
            <button type="submit" className="w-full bg-black text-white font-bold uppercase tracking-widest py-4 hover:bg-gray-800 transition-colors">
              Log In
            </button>
          </form>
        </div>

        {/* COLUMNA DERECHA: REGISTRO */}
        <div>
          <h2 className="text-3xl font-black uppercase mb-8 tracking-tighter">Register</h2>
          {regError && <p className="bg-red-100 text-red-700 p-3 mb-4 rounded text-sm font-semibold">{regError}</p>}
          {regSuccess && <p className="bg-green-100 text-green-800 p-3 mb-4 rounded text-sm font-semibold">{regSuccess}</p>}
          
          <form onSubmit={handleRegister} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Full Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={regNombre}
                onChange={(e) => setRegNombre(e.target.value)}
                className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Email address <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Password <span className="text-red-500">*</span></label>
              <input 
                type="password" 
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black"
                required
                minLength="6"
              />
            </div>
            <p className="text-sm text-gray-500">
              Your personal data will be used to support your experience throughout this website.
            </p>
            <button type="submit" className="w-full bg-white text-black border-2 border-black font-bold uppercase tracking-widest py-4 hover:bg-black hover:text-white transition-colors">
              Register
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}