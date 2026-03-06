import { useState, useEffect } from 'react';

function AdminPanel() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // HOOK useEffect: Se ejecuta una sola vez cuando el componente se monta
  useEffect(() => {
    obtenerProductos();
  }, []);

  const obtenerProductos = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/productos');
      const datos = await respuesta.json();
      setProductos(datos);
      setCargando(false);
    } catch (error) {
      console.error("Error:", error);
      setCargando(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Gestión de Inventario (Altas, Bajas y Cambios)</h3>
      <button style={{ marginBottom: '20px', backgroundColor: '#28a745', color: 'white', padding: '10px' }}>
        + Agregar Nuevo Producto (Alta)
      </button>

      {cargando ? <p>Cargando productos...</p> : (
        <table border="1" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f4' }}>
              <th style={{ padding: '10px' }}>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((prod) => (
              <tr key={prod.id_producto}>
                <td style={{ padding: '10px' }}>{prod.nombre}</td>
                <td>{prod.categoria}</td>
                <td>${prod.precio_base}</td>
                <td>
                  <button style={{ color: 'blue', marginRight: '10px' }}>Editar</button>
                  <button style={{ color: 'red' }}>Eliminar (Baja)</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminPanel;