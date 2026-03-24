import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore'; 
import AdminPanel from '../components/AdminPanel';

export default function MyAccount() {
  const user = useAuthStore(state => state.user);
  const login = useAuthStore(state => state.login);
  const logout = useAuthStore(state => state.logout);

  // ==========================================
  // ESTADOS UNIFICADOS (LOGIN Y REGISTRO)
  // ==========================================
  const [isLoginMode, setIsLoginMode] = useState(true); // true = Login, false = Registro
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false); // 👁️ Ocultar/Mostrar
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ==========================================
  // EXPRESIONES REGULARES (REGEX)
  // ==========================================
  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const regexNombre = /^[a-zA-ZÀ-ÿ\s'-]+$/;

  // Evaluaciones en tiempo real
  const isEmailValido = email.length === 0 || regexEmail.test(email);
  const isNombreValido = nombre.length === 0 || regexNombre.test(nombre);

  // ==========================================
  // LÓGICA DE VALIDACIÓN DE CONTRASEÑA
  // ==========================================
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[\W_]/.test(password);
  const isValidLength = password.length >= 6 && password.length <= 32;

  let strengthScore = 0;
  if (hasLower) strengthScore++;
  if (hasUpper) strengthScore++;
  if (hasNumber) strengthScore++;
  if (hasSpecial) strengthScore++;
  if (isValidLength) strengthScore++;

  const getStrengthData = () => {
    if (password.length === 0) return { width: '0%', color: 'bg-gray-200', text: '' };
    if (strengthScore <= 2) return { width: '25%', color: 'bg-red-500', text: 'Muy Débil' };
    if (strengthScore === 3) return { width: '50%', color: 'bg-orange-500', text: 'Regular' };
    if (strengthScore === 4) return { width: '75%', color: 'bg-yellow-500', text: 'Buena' };
    return { width: '100%', color: 'bg-green-500', text: 'Fuerte y Segura' };
  };

  const { width, color, text } = getStrengthData();
  const isPasswordValid = strengthScore === 5;

  const isFormularioRegistroValido = isPasswordValid && regexNombre.test(nombre) && regexEmail.test(email);

  // ==========================================
  // CAMBIAR ENTRE MODOS Y LIMPIAR ESTADOS
  // ==========================================
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setErrorMsg('');
    setSuccessMsg('');
    setPassword(''); // Limpiamos la contraseña por seguridad al cambiar
    setMostrarPassword(false);
  };

  // ==========================================
  // MANEJO DEL SUBMIT (LOGIN O REGISTRO)
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isLoginMode) {
      // 🔓 LÓGICA DE INICIO DE SESIÓN
      try {
        const response = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (response.ok) {
          login(data.usuario);
          useCartStore.getState().clearCart('guest');
        } else {
          setErrorMsg(data.error || 'Credenciales inválidas');
        }
      } catch (err) {
        setErrorMsg('Error al conectar con el servidor');
      }
    } else {
      // 📝 LÓGICA DE REGISTRO
      if (!isFormularioRegistroValido) {
        setErrorMsg('Por favor, revisa que todos los campos sean correctos.');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, email, password })
        });
        const data = await response.json();
        
        if (response.ok) {
          setSuccessMsg('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
          setNombre('');
          setPassword('');
          setIsLoginMode(true); // Cambiar a login automáticamente
        } else {
          setErrorMsg(data.error || 'Error al crear la cuenta');
        }
      } catch (err) {
        setErrorMsg('No se pudo conectar con el servidor');
      }
    }
  };

  // ==========================================
  // VISTA: USUARIO LOGUEADO (SIN CAMBIOS ESTÉTICOS)
  // ==========================================
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
            <p className="text-gray-500">Aún no has realizado ningún pedido.</p>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VISTA: FORMULARIO ÚNICO CON ESTÉTICA GLASSMorphism 👁️✨
  // ==========================================
  return (
    // CONTENEDOR PRINCIPAL CON FONDO DEGRADADO VERDE
    <div className="min-h-screen flex items-center justify-center py-24 px-4 bg-fixed bg-no-repeat" style={{ background: "radial-gradient(circle at 10% 20%, rgb(40, 60, 45) 0%, rgb(10, 20, 15) 100%)" }}>
      
      {/* TARJETA DE CRISTAL RELATIVA */}
      <div className="max-w-md w-full relative bg-white/10 backdrop-blur-xl border border-white/20 p-12 pt-16 shadow-lg rounded-xl">
        
        {/* ICONO DE PERFIL CIRCULAR SUPERIOR */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1a2d21] rounded-full p-4 border-2 border-white/40 shadow-md">
          <svg className="w-12 h-12 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        {/* TÍTULO PRINCIPAL (Texto claro) */}
        <h2 className="text-4xl font-black uppercase mb-8 tracking-tighter text-center text-white/95">
          {isLoginMode ? 'Log In' : 'Register'}
        </h2>
        
        {/* MENSAJES DE ERROR Y ÉXITO */}
        {errorMsg && <p className="bg-red-100/10 text-red-200 p-3 mb-4 rounded text-sm font-semibold text-center border border-red-500/20">{errorMsg}</p>}
        {successMsg && <p className="bg-green-100/10 text-green-200 p-3 mb-4 rounded text-sm font-semibold text-center border border-green-500/20">{successMsg}</p>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* CAMPO NOMBRE (Solo Registro) */}
          {!isLoginMode && (
            <div>
              <input 
                type="text" 
                placeholder="Full Name *" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={`w-full bg-[#ccc] text-black/80 font-medium placeholder-black/40 p-3 px-5 rounded-md focus:outline-none focus:ring-1 transition-colors ${!isNombreValido ? 'ring-red-500' : 'focus:ring-white/40'}`}
                required={!isLoginMode}
              />
              {!isNombreValido && (
                <p className="text-red-200 text-xs mt-1.5 font-semibold px-2">
                  Solo letras, acentos y espacios son permitidos.
                </p>
              )}
            </div>
          )}

          {/* CAMPO EMAIL CON ICONO PERSONA */}
          <div>
            <div className={`w-full flex items-center bg-[#ccc] rounded-md transition-colors ${!isEmailValido && !isLoginMode ? 'ring-1 ring-red-500' : ''}`}>
              {/* Icono persona */}
              <div className="w-12 flex justify-center border-r border-black/10 py-3 text-black/40">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input 
                type="email" 
                placeholder="Email Address *" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-black/80 font-medium placeholder-black/40 p-3 px-5 focus:outline-none"
                required
              />
            </div>
            {!isEmailValido && !isLoginMode && (
              <p className="text-red-200 text-xs mt-1.5 font-semibold px-2">
                Ingresa un formato de correo válido (ej. tu@correo.com).
              </p>
            )}
          </div>
          
          {/* CAMPO CONTRASEÑA CON ICONO CANDADO Y MOSTRAR */}
          <div>
            <div className="w-full flex items-center bg-[#ccc] rounded-md relative">
              {/* Icono candado */}
              <div className="w-12 flex justify-center border-r border-black/10 py-3 text-black/40">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input 
                type={mostrarPassword ? "text" : "password"} 
                placeholder="Password *" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-black/80 font-medium placeholder-black/40 p-3 px-5 pr-20 focus:outline-none"
                required
                maxLength={isLoginMode ? undefined : 32}
              />
              <button 
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-4 text-xs text-black/60 hover:text-black font-semibold uppercase tracking-wider transition-colors"
              >
                {mostrarPassword ? "Hide" : "Show"}
              </button>
            </div>
            
            {/* BARRA DE FUERZA Y REQUISITOS (Solo en Registro) */}
            {!isLoginMode && password.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50/10 border border-white/10 text-white/80 text-sm rounded-md">
                <div className="h-2 w-full bg-gray-200/20 rounded-full overflow-hidden mb-1">
                  <div className={`h-full transition-all duration-300 ease-in-out ${color}`} style={{ width: width }}></div>
                </div>
                <p className={`text-xs font-bold text-right mb-3 ${color.replace('bg-', 'text-')}`}>
                  {text}
                </p>

                <p className="font-bold mb-2">La contraseña debe contener:</p>
                <ul className="grid grid-cols-1 gap-1 text-xs">
                  <li className={isValidLength ? 'text-green-300 font-semibold' : 'text-white/60'}>{isValidLength ? '✓' : '○'} Entre 6 y 32 caracteres</li>
                  <li className={hasUpper ? 'text-green-300 font-semibold' : 'text-white/60'}>{hasUpper ? '✓' : '○'} Una mayúscula</li>
                  <li className={hasLower ? 'text-green-300 font-semibold' : 'text-white/60'}>{hasLower ? '✓' : '○'} Una minúscula</li>
                  <li className={hasNumber ? 'text-green-300 font-semibold' : 'text-white/60'}>{hasNumber ? '✓' : '○'} Un número</li>
                  <li className={hasSpecial ? 'text-green-300 font-semibold' : 'text-white/60'}>{hasSpecial ? '✓' : '○'} Un carácter especial</li>
                </ul>
              </div>
            )}
          </div>

          {!isLoginMode && (
            <p className="text-xs text-white/60 mt-1">
              Your personal data will be used to support your experience throughout this website.
            </p>
          )}
          
          {/* BOTÓN SUBMIT OSCURO */}
          <button 
            type="submit" 
            disabled={!isLoginMode && !isFormularioRegistroValido}
            className={`w-full bg-[#1a2d21] text-white/90 border border-white/20 font-bold uppercase tracking-widest py-4 mt-2 transition-colors rounded-md shadow focus:ring-1 focus:ring-white/40 focus:outline-none ${
              !isLoginMode && !isFormularioRegistroValido 
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:bg-green-900'
            }`}
          >
            {isLoginMode ? 'Log In' : 'Register'}
          </button>
        </form>

        {/* BOTÓN PARA ALTERNAR (Texto claro) */}
        <div className="mt-8 text-center">
          <button 
            type="button" 
            onClick={toggleMode}
            className="text-sm font-semibold text-white/70 hover:text-white transition-colors underline underline-offset-4 tracking-tight"
          >
            {isLoginMode ? "¿No tienes cuenta? Crea una aquí" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>

      </div>
    </div>
  );
}