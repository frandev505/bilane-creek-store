import { useState, useEffect } from 'react';
import { useCartStore } from './store/cartStore';

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Extraemos la función de Zustand para agregar al carrito
  const agregarAlCarrito = useCartStore((state) => state.agregarAlCarrito);

  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        const respuesta = await fetch('http://localhost:3000/api/productos');
        const datos = await respuesta.json();
        setProductos(datos);
        setCargando(false);
      } catch (error) {
        console.error("Error al obtener productos:", error);
        setCargando(false);
      }
    };
    obtenerProductos();
  }, []);

  if (cargando) return <p>Cargando catálogo...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>🛍️ Catálogo de Bilane Creek</h2>
      <p>Estilo que fluye contigo.</p>

      {/* Grid de productos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {productos.map((prod) => (
          <div key={prod.id_producto} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            {/* Placeholder de imagen */}
            <div style={{ height: '150px', backgroundColor: '#f4f4f4', marginBottom: '15px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
              Imagen de {prod.nombre}
            </div>
            
            <h4 style={{ margin: '10px 0' }}>{prod.nombre}</h4>
            <p style={{ color: '#666', fontSize: '14px' }}>{prod.categoria}</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>${prod.precio_base}</p>
            
            <button 
              onClick={() => agregarAlCarrito(prod)}
              style={{ width: '100%', padding: '10px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
            >
              Agregar al Carrito
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Catalogo;