import { useState } from 'react';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const manejarLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const respuesta = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const datos = await respuesta.json();

      if (datos.success) {
        onLoginSuccess(datos.usuario); // Pasamos el usuario al componente principal
      } else {
        setError(datos.error);
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor');
    }
  };

  return (
    <div className="login-container" style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
      <img src="https://i.imgur.com/vHqY7pT.png" alt="Bilane Logo" style={{ width: '150px', display: 'block', margin: '0 auto 20px' }} />
      <h2 style={{ textAlign: 'center' }}>Iniciar Sesión</h2>
      <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" placeholder="Correo electrónico" 
          value={email} onChange={(e) => setEmail(e.target.value)} required 
          style={{ padding: '10px' }}
        />
        <input 
          type="password" placeholder="Contraseña" 
          value={password} onChange={(e) => setPassword(e.target.value)} required 
          style={{ padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#000', color: '#fff', cursor: 'pointer' }}>
          Entrar
        </button>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      </form>
    </div>
  );
}

export default Login;