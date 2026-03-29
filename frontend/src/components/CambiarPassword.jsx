import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function CambiarPassword() {
  const currentUser = useAuthStore(state => state.user);
  
  // 🔥 Agregamos el estado para la contraseña actual
  const [passwordActual, setPasswordActual] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });
    
    // VALIDACIÓN: Mínimo 6 chars, al menos 1 letra, 1 número y 1 carácter especial
    const regexSeguridad = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    
    if (!regexSeguridad.test(password)) {
      setMensaje({ 
        texto: 'La contraseña debe tener al menos 6 caracteres, incluir letras, números y un carácter especial.', 
        tipo: 'error' 
      });
      return;
    }

    if (password !== confirmPassword) {
      setMensaje({ texto: 'Las contraseñas no coinciden.', tipo: 'error' });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${currentUser.id}/cambiar-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // 🔥 Enviamos la contraseña actual y la nueva con los nombres que espera el backend
        body: JSON.stringify({ 
          passwordActual: passwordActual,
          nuevoPassword: password 
        })
      });

      if (response.ok) {
        setMensaje({ texto: '¡Contraseña actualizada con éxito!', tipo: 'exito' });
        // Limpiamos todos los campos tras el éxito
        setPasswordActual('');
        setPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        setMensaje({ texto: data.error || 'Hubo un error al actualizar la contraseña.', tipo: 'error' });
      }
    } catch (error) {
      console.error("Error al cambiar contraseña", error);
      setMensaje({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    }
  };

  // Si no hay usuario logueado, no mostramos nada
  if (!currentUser) return null;

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded-lg border shadow-sm">
      <h2 className="text-xl font-bold mb-4 border-b pb-2">Cambiar mi Contraseña</h2>
      
      {mensaje.texto && (
        <div className={`p-3 mb-4 rounded text-sm ${mensaje.tipo === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* 🔥 NUEVO CAMPO: Contraseña Actual */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
          <input 
            type="password" 
            value={passwordActual} 
            onChange={(e) => setPasswordActual(e.target.value)} 
            required 
            placeholder="Tu contraseña actual"
            className="w-full border p-2 rounded focus:ring-black focus:border-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="Ej: MiClave123!"
            className="w-full border p-2 rounded focus:ring-black focus:border-black"
          />
          <p className="text-xs text-gray-500 mt-1">Mín. 6 caracteres, con letras, números y un símbolo.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            placeholder="Repite tu nueva contraseña"
            className="w-full border p-2 rounded focus:ring-black focus:border-black"
          />
        </div>

        <button 
          type="submit" 
          className="bg-black text-white font-bold py-2 px-4 rounded hover:bg-gray-800 transition mt-2"
        >
          Actualizar Contraseña
        </button>
      </form>
    </div>
  );
}