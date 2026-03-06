import { useState } from 'react';
import Login from './Login';
import AdminPanel from './AdminPanel';
import './App.css';

function App() {
  const [usuario, setUsuario] = useState(null);

  if (!usuario) {
    return <Login onLoginSuccess={(user) => setUsuario(user)} />;
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Bilane Creek - {usuario.rol === 'admin' ? 'Panel de Administración' : 'Tienda Online'}</h1>
      <p>Bienvenido, <strong>{usuario.nombre}</strong></p>

      <div style={{ marginTop: '50px', padding: '30px', border: '2px dashed #666' }}>
        {usuario.rol === 'admin' ? (
          <div>
            <h2>🔧 Panel de Control de Bilane Creek</h2>
            <AdminPanel /> {/* Aquí insertamos nuestro nuevo componente con Hooks */}
          </div>
        ) : (
          <div>
            <h2>🛍️ Catálogo para Clientes</h2>
            <p>Mira nuestras últimas tendencias en moda.</p>
            <button>Ir al Carrito</button>
          </div>
        )}
      </div>

      <button onClick={() => setUsuario(null)} style={{ marginTop: '20px' }}>Cerrar Sesión</button>
    </div>
  );
}

export default App;