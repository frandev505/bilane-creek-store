import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore'; 
import AdminPanel from '../components/AdminPanel';

// ==========================================
// COMPONENTE: LOGO SVG VECTORIAL (Arreglo del logo roto)
// Hecho con vectores para que cargue instantáneo, sea nítido y no dependa de enlaces externos.
// ==========================================
const BilaneCreekLogo = ({ className }) => (
  <svg 
    viewBox="0 0 300 100" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Fondo o forma abstracta sutil detrás del texto */}
    <path d="M50 80C20 80 10 50 40 20C70 -10 100 20 130 10C160 0 190 30 220 20C250 10 280 40 250 70C220 100 190 70 160 80C130 90 100 60 70 70C40 80 80 80 50 80Z" fill="white" fillOpacity="0.03"/>
    
    {/* Texto Principal "BILANE CREEK" */}
    <text 
      x="50%" 
      y="55%" 
      textAnchor="middle" 
      fill="white" 
      fontFamily="Inter, sans-serif" 
      fontWeight="900" 
      fontSize="38" 
      letterSpacing="-0.05em"
      className="tracking-tighter"
    >
      BILANE CREEK
    </text>
    
    {/* Subtítulo o lema sutil */}
    <text 
      x="50%" 
      y="80%" 
      textAnchor="middle" 
      fill="white" 
      fillOpacity="0.6"
      fontFamily="Inter, sans-serif" 
      fontWeight="500" 
      fontSize="12" 
      letterSpacing="0.4em"
    >
      FAVOURITE THREADS
    </text>
    
    {/* Líneas decorativas */}
    <line x1="60" y1="68" x2="240" y2="68" stroke="white" strokeOpacity="0.1" strokeWidth="1"/>
  </svg>
);

export default function MyAccount() {
  const user = useAuthStore(state => state.user);
  const login = useAuthStore(state => state.login);
  const logout = useAuthStore(state => state.logout);

  // ESTADOS LOGIN
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // ESTADOS REGISTRO
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // VALIDACIONES BÁSICAS
  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isRegValido = regNombre.length > 2 && regexEmail.test(regEmail) && regPass.length >= 6;

  // MANEJADOR LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass })
      });
      const data = await response.json();
      if (response.ok) {
        login(data.usuario);
        // useCartStore.getState().clearCart('guest'); // Opcional, dependiendo de tu lógica de carrito
      } else {
        setErrorMsg(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setErrorMsg('Error de conexión con el servidor');
    } finally { setLoading(false); }
  };

  // MANEJADOR REGISTRO
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if(!isRegValido) return setErrorMsg('Por favor, revisa los datos del registro.');

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: regNombre, email: regEmail, password: regPass })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('¡Cuenta creada! Ya puedes iniciar sesión a la izquierda.');
        setLoginEmail(regEmail);
        setRegNombre(''); setRegEmail(''); setRegPass('');
      } else {
        setErrorMsg(data.error || 'Error al crear cuenta. Es posible que el email ya exista.');
      }
    } catch (err) {
      setErrorMsg('Error de conexión con el servidor');
    } finally { setLoading(false); }
  };

  // VISTA DE USUARIO AUTENTICADO
  if (user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 min-h-[60vh]">
        <div className="flex justify-between items-center mb-12 border-b pb-4 border-gray-200">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">My Account</h1>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-black font-semibold transition">Cerrar Sesión</button>
        </div>
        <p className="text-xl">Hola, <span className="font-bold">{user.nombre}</span>.</p>
        {user.rol === 'admin' ? <AdminPanel /> : (
          <div className="mt-12 p-8 bg-gray-50 rounded-xl border border-gray-100 shadow-inner">
            <h2 className="font-bold text-2xl mb-5 text-gray-900">Historial de Pedidos</h2>
            <p className="text-gray-500">Consulta tus compras en la sección de historial de la tienda.</p>
          </div>
        )}
      </div>
    );
  }

  // VISTA DE ACCESO (LADO A LADO CON ESTILO GLASSMorphism)
  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4" style={{ background: "radial-gradient(circle at 10% 20%, rgb(40, 60, 45) 0%, rgb(10, 20, 15) 100%)" }}>
      
      <div className="max-w-6xl w-full bg-white/10 backdrop-blur-xl border border-white/20 p-8 md:p-14 shadow-2xl rounded-3xl overflow-hidden relative">
        
        {/* Adorno visual de fondo */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>

        {/* CABECERA UNIFICADA CON EL NUEVO LOGO SVG */}
        <div className="text-center mb-16 relative z-10">
          <BilaneCreekLogo className="w-64 mx-auto mb-2" />
          <h2 className="text-2xl font-black text-white uppercase tracking-[0.3em] mt-4 opacity-90">Acceso Clientes</h2>
          <p className="text-white/60 text-sm mt-1">Favourite Threads - Tienda Oficial</p>
        </div>

        {/* MENSAJES DE ESTADO */}
        {errorMsg && (
          <div className="bg-red-500/15 text-red-100 p-4 mb-8 rounded-lg text-center text-sm border border-red-500/40 font-medium animate-pulse relative z-10">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-500/15 text-green-100 p-4 mb-8 rounded-lg text-center text-sm border border-green-500/40 font-medium relative z-10">
            ✅ {successMsg}
          </div>
        )}

        {/* CONTENEDOR FLEXIBLE LADO A LADO */}
        <div className="flex flex-col md:flex-row gap-12 md:gap-20 relative z-10">
          
          {/* COLUMNA 1: LOGIN (Estilo Minimalista Oscuro) */}
          <div className="flex-1">
            <h3 className="text-white font-black uppercase tracking-widest text-lg mb-10 border-b border-white/10 pb-3">Ya soy cliente</h3>
            <form onSubmit={handleLogin} className="space-y-6">
              <input 
                type="email" 
                placeholder="Email Address" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-lg focus:outline-none focus:bg-white/10 focus:border-white/30 transition placeholder-white/30"
                required
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-lg focus:outline-none focus:bg-white/10 focus:border-white/30 transition placeholder-white/30"
                required
              />
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-black uppercase text-sm tracking-widest py-5 rounded-lg hover:bg-gray-200 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? 'Procesando...' : 'Log In'}
              </button>
            </form>
          </div>

          {/* SEPARADOR VISUAL (Solo en desktop) */}
          <div className="hidden md:block w-px bg-white/10 self-stretch"></div>

          {/* COLUMNA 2: REGISTRO (Estilo Bordeado Claro) */}
          <div className="flex-1">
            <h3 className="text-white font-black uppercase tracking-widest text-lg mb-10 border-b border-white/10 pb-3">Crear Cuenta</h3>
            <form onSubmit={handleRegister} className="space-y-6">
              <input 
                type="text" 
                placeholder="Full Name" 
                value={regNombre}
                onChange={(e) => setRegNombre(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-lg focus:outline-none focus:bg-white/10 focus:border-white/30 transition placeholder-white/30"
                required
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-lg focus:outline-none focus:bg-white/10 focus:border-white/30 transition placeholder-white/30"
                required
              />
              <input 
                type="password" 
                placeholder="Password (min. 6 chars)" 
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-lg focus:outline-none focus:bg-white/10 focus:border-white/30 transition placeholder-white/30"
                required
              />
              <div className="flex items-start gap-2 pt-2">
                <input type="checkbox" id="terms" required className="mt-1 accent-white"/>
                <label htmlFor="terms" className="text-xs text-white/50 uppercase tracking-tight leading-snug cursor-pointer">
                  Acepto recibir actualizaciones exclusivas y los términos de servicio de Bilane Creek.
                </label>
              </div>
              <button 
                type="submit"
                disabled={loading || !isRegValido}
                className="w-full border-2 border-white text-white font-black uppercase text-sm tracking-widest py-5 rounded-lg hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed mt-3"
              >
                {loading ? 'Creando...' : 'Registrarse'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}