import { useState } from 'react';
import Login from './Login';
import AdminPanel from './AdminPanel';
import Catalogo from './Catalogo';
import Carrito from './Carrito'; // Importamos el nuevo componente
import { useCartStore } from './store/cartStore';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [vistaCliente, setVistaCliente] = useState('catalogo'); // Estado para controlar qué ve el cliente
  
  const carrito = useCartStore((state) => state.carrito);
  const totalItemsCarrito = carrito.reduce((total, item) => total + item.cantidad, 0);

  if (!usuario) {
    return <Login onLoginSuccess={(user) => setUsuario(user)} />;
  }

  return (
    <>
      {/* NAVBAR RESPONSIVE */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#000', color: '#fff', flexWrap: 'wrap', gap: '10px' }}>
        <h1 
          style={{ margin: 0, fontSize: '22px', cursor: 'pointer' }}
          onClick={() => setVistaCliente('catalogo')} // Al hacer clic en el logo, vuelve al inicio
        >
          Bilane Creek
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <span>Hola, {usuario.nombre}</span>
          
          {usuario.rol === 'cliente' && (
            <button 
              onClick={() => setVistaCliente('carrito')}
              style={{ backgroundColor: '#fff', color: '#000', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              🛒 Carrito ({totalItemsCarrito})
            </button>
          )}
          
          <button 
            onClick={() => setUsuario(null)} 
            style={{ padding: '8px 15px', backgroundColor: 'transparent', color: '#fff', border: '1px solid #fff', borderRadius: '5px', cursor: 'pointer' }}
          >
            Salir
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ padding: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {usuario.rol === 'admin' ? (
          <AdminPanel />
        ) : (
          /* Lógica para alternar entre catálogo y carrito */
          vistaCliente === 'catalogo' ? 
            <Catalogo /> : 
            <Carrito volverAlCatalogo={() => setVistaCliente('catalogo')} />
        )}
      </main>
    </>
  );
}

export default App;