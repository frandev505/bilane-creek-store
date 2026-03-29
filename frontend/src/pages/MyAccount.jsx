import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore'; 
import AdminPanel from '../components/AdminPanel';

// ==========================================
// COMPONENTE: LOGO SVG VECTORIAL
// ==========================================
const BilaneCreekLogo = ({ className }) => (
  <svg 
    viewBox="0 0 300 100" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M50 80C20 80 10 50 40 20C70 -10 100 20 130 10C160 0 190 30 220 20C250 10 280 40 250 70C220 100 190 70 160 80C130 90 100 60 70 70C40 80 80 80 50 80Z" fill="white" fillOpacity="0.03"/>
    <text x="50%" y="55%" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="38" letterSpacing="-0.05em" className="tracking-tighter">BILANE CREEK</text>
    <text x="50%" y="80%" textAnchor="middle" fill="white" fillOpacity="0.6" fontFamily="Inter, sans-serif" fontWeight="500" fontSize="12" letterSpacing="0.4em">FAVOURITE THREADS</text>
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

  // EXPRESIONES REGULARES BÁSICAS
  const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/;
  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // 🔥 LÓGICA PARA EVALUAR LA CONTRASEÑA EN TIEMPO REAL
  const evaluatePassword = (pass) => {
    let score = 0;
    const reqs = {
      length: pass.length >= 6 && pass.length <= 32,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /\d/.test(pass),
      special: /[\W_]/.test(pass)
    };
    if (reqs.length) score += 1;
    if (reqs.upper) score += 1;
    if (reqs.lower) score += 1;
    if (reqs.number) score += 1;
    if (reqs.special) score += 1;
    return { score, reqs };
  };

  const passEvaluation = evaluatePassword(regPass);
  const isFormValid = regexNombre.test(regNombre.trim()) && regexEmail.test(regEmail) && passEvaluation.score === 5;

  // ESTILOS DE LA BARRA DE FUERZA
  let barColor = 'bg-red-500';
  if (passEvaluation.score >= 3) barColor = 'bg-yellow-400';
  if (passEvaluation.score === 5) barColor = 'bg-green-500';

  // MANEJADOR LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass })
      });
      const data = await response.json();
      if (response.ok) {
        login(data.usuario);
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

    if (!isFormValid) return; // Por seguridad, evitamos el envío si no es válido

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: regNombre.trim(), email: regEmail, password: regPass })
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

  // VISTA DE ACCESO
  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4" style={{ background: "radial-gradient(circle at 10% 20%, rgb(40, 60, 45) 0%, rgb(10, 20, 15) 100%)" }}>
      
      <div className="max-w-6xl w-full bg-white/10 backdrop-blur-xl border border-white/20 p-8 md:p-14 shadow-2xl rounded-3xl overflow-hidden relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>

        <div className="text-center mb-16 relative z-10">
          <BilaneCreekLogo className="w-64 mx-auto mb-2" />
          <h2 className="text-2xl font-black text-white uppercase tracking-[0.3em] mt-4 opacity-90">Acceso Clientes</h2>
          <p className="text-white/60 text-sm mt-1">Favourite Threads - Tienda Oficial</p>
        </div>

        {errorMsg && <div className="bg-red-500/15 text-red-100 p-4 mb-8 rounded-lg text-center text-sm border border-red-500/40 relative z-10">⚠️ {errorMsg}</div>}
        {successMsg && <div className="bg-green-500/15 text-green-100 p-4 mb-8 rounded-lg text-center text-sm border border-green-500/40 relative z-10">✅ {successMsg}</div>}

        <div className="flex flex-col md:flex-row gap-12 md:gap-20 relative z-10">
          
          {/* LOGIN */}
          <div className="flex-1">
            <h3 className="text-white font-black uppercase tracking-widest text-lg mb-10 border-b border-white/10 pb-3">Ya soy cliente</h3>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="email" placeholder="Email Address" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-lg focus:outline-none focus:bg-white/10 focus:border-white/30 transition placeholder-white/30" required />
              <input type="password" placeholder="Password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-lg focus:outline-none focus:bg-white/10 focus:border-white/30 transition placeholder-white/30" required />
              <button type="submit" disabled={loading} className="w-full bg-white text-black font-black uppercase text-sm tracking-widest py-5 rounded-lg hover:bg-gray-200 transition-all shadow-md disabled:opacity-50 mt-4">
                {loading ? 'Procesando...' : 'Log In'}
              </button>
            </form>
          </div>

          <div className="hidden md:block w-px bg-white/10 self-stretch"></div>

          {/* REGISTRO */}
          <div className="flex-1">
            <h3 className="text-white font-black uppercase tracking-widest text-lg mb-10 border-b border-white/10 pb-3">Crear Cuenta</h3>
            <form onSubmit={handleRegister} className="space-y-5">
              
              {/* INPUT NOMBRE */}
              <div>
                <input 
                  type="text" 
                  placeholder="Nombre Completo" 
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
                  className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-lg focus:outline-none focus:bg-white/10 focus:border-white/30 transition placeholder-white/30"
                  required
                />
                {/* Mensaje de error en tiempo real */}
                {regNombre.length > 0 && regNombre.trim().length < 3 && (
                  <p className="text-red-400 text-xs mt-2 ml-1">El nombre debe tener al menos 3 caracteres.</p>
                )}
              </div>
              
              {/* INPUT CORREO */}
              <div>
                <input 
                  type="email" 
                  placeholder="Correo Electrónico" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-lg focus:outline-none focus:bg-white/10 focus:border-white/30 transition placeholder-white/30"
                  required
                />
                {/* Mensaje de error en tiempo real */}
                {regEmail.length > 0 && !regexEmail.test(regEmail) && (
                  <p className="text-red-400 text-xs mt-2 ml-1">Ingresa un formato de correo válido (ej: nombre@dominio.com).</p>
                )}
              </div>
              
              {/* INPUT CONTRASEÑA Y BARRA DE FUERZA */}
              <div>
                <input 
                  type="password" 
                  placeholder="Contraseña" 
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-lg focus:outline-none focus:bg-white/10 focus:border-white/30 transition placeholder-white/30"
                  required
                />
                
                {/* Visualizador de Requisitos de Contraseña */}
                {regPass.length > 0 && (
                  <div className="mt-3 bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-white/60 uppercase tracking-wider font-bold">Seguridad</span>
                      <span className="text-xs font-bold text-white/90">
                        {passEvaluation.score <= 2 && 'Débil'}
                        {passEvaluation.score === 3 || passEvaluation.score === 4 ? 'Media' : ''}
                        {passEvaluation.score === 5 && 'Fuerte'}
                      </span>
                    </div>
                    {/* Barra de progreso */}
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-3">
                      <div 
                        className={`h-full transition-all duration-500 ease-out ${barColor}`} 
                        style={{ width: `${(passEvaluation.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    {/* Lista de checks (verde si cumple, rojo/gris si no) */}
                    <div className="flex flex-wrap gap-2 text-[11px] font-medium">
                      <span className={`px-2 py-1 rounded-md ${passEvaluation.reqs.length ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>6-32 Chars</span>
                      <span className={`px-2 py-1 rounded-md ${passEvaluation.reqs.upper ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>Mayúscula</span>
                      <span className={`px-2 py-1 rounded-md ${passEvaluation.reqs.lower ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>Minúscula</span>
                      <span className={`px-2 py-1 rounded-md ${passEvaluation.reqs.number ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>Número</span>
                      <span className={`px-2 py-1 rounded-md ${passEvaluation.reqs.special ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>Símbolo</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input type="checkbox" id="terms" required className="mt-1 accent-white"/>
                <label htmlFor="terms" className="text-xs text-white/50 uppercase tracking-tight leading-snug cursor-pointer">
                  Acepto recibir actualizaciones exclusivas y los términos de servicio de Bilane Creek.
                </label>
              </div>
              
              <button 
                type="submit"
                // 🔥 Ahora el botón se desactiva hasta que TODO esté perfecto
                disabled={loading || !isFormValid}
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