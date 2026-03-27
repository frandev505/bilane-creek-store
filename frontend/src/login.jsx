import { useState } from 'react';

function Login({ onLoginSuccess }) {
  // Estados para Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para Registro
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // MANEJAR INICIO DE SESIÓN
  const manejarLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const respuesta = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const datos = await respuesta.json();
      if (datos.success) {
        onLoginSuccess(datos.usuario);
      } else {
        setError(datos.error);
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // MANEJAR REGISTRO
  const manejarRegistro = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const respuesta = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: regNombre, email: regEmail, password: regPassword })
      });

      const datos = await respuesta.json();
      if (datos.success) {
        alert("¡Cuenta creada! Ahora puedes iniciar sesión a la izquierda.");
        // Limpiamos los campos de registro
        setRegNombre(''); setRegEmail(''); setRegPassword('');
        // Opcional: pasar el email al campo de login
        setEmail(regEmail);
      } else {
        setError(datos.error);
      }
    } catch (err) {
      setError('Error al intentar registrar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '60px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* LOGO CENTRAL */}
      <img src="https://i.imgur.com/vHqY7pT.png" alt="Bilane Logo" style={{ width: '180px', display: 'block', margin: '0 auto 40px' }} />

      {error && (
        <p style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '5px', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold', fontSize: '14px' }}>
          {error}
        </p>
      )}

      {/* CONTENEDOR LADO A LADO */}
      <div style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
        
        {/* COLUMNA 1: LOGIN */}
        <div style={{ flex: '1', minWidth: '300px', padding: '20px', borderRight: '1px solid #eee' }}>
          <h2 style={{ textTransform: 'uppercase', fontSize: '1.2rem', marginBottom: '20px', letterSpacing: '1px' }}>Ya soy cliente</h2>
          <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>CORREO ELECTRÓNICO *</label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
              style={{ padding: '12px', border: '1px solid #ddd' }}
            />
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>CONTRASEÑA *</label>
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required 
              style={{ padding: '12px', border: '1px solid #ddd' }}
            />
            <button type="submit" disabled={loading} style={{ padding: '15px', backgroundColor: '#000', color: '#fff', cursor: 'pointer', border: 'none', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '10px' }}>
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        {/* COLUMNA 2: REGISTRO */}
        <div style={{ flex: '1', minWidth: '300px', padding: '20px' }}>
          <h2 style={{ textTransform: 'uppercase', fontSize: '1.2rem', marginBottom: '20px', letterSpacing: '1px' }}>Crear una cuenta</h2>
          <form onSubmit={manejarRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>NOMBRE COMPLETO *</label>
            <input 
              type="text" value={regNombre} onChange={(e) => setRegNombre(e.target.value)} required 
              style={{ padding: '12px', border: '1px solid #ddd' }}
            />
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>CORREO ELECTRÓNICO *</label>
            <input 
              type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required 
              style={{ padding: '12px', border: '1px solid #ddd' }}
            />
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>CONTRASEÑA *</label>
            <input 
              type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required 
              style={{ padding: '12px', border: '1px solid #ddd' }}
            />
            <p style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
              Sus datos personales se utilizarán para respaldar su experiencia en este sitio web y para otros fines descritos en nuestra política de privacidad.
            </p>
            <button type="submit" disabled={loading} style={{ padding: '15px', backgroundColor: '#fff', color: '#000', cursor: 'pointer', border: '2px solid #000', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '10px' }}>
              {loading ? 'Creando...' : 'Registrarse'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Login;