import { useState, useEffect } from 'react';

function AdminPanel() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para el formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null); // NULL = Creando, ID = Editando
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: '',
    precio_base: '',
    id_categoria: ''
  });

  useEffect(() => {
    obtenerProductos();
    obtenerCategorias();
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

  const obtenerCategorias = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/categorias');
      const datos = await respuesta.json();
      setCategorias(datos);
    } catch (error) {
      console.error("Error categorías:", error);
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este producto?")) return;
    try {
      const respuesta = await fetch(`http://localhost:3000/api/productos/${id}`, { method: 'DELETE' });
      const datos = await respuesta.json();
      if (datos.success) {
        setProductos(productos.filter(prod => prod.id_producto !== id));
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  // NUEVO: Función para preparar el formulario en modo "Edición"
  const iniciarEdicion = (producto) => {
    setDatosFormulario({
      nombre: producto.nombre,
      precio_base: producto.precio_base,
      // Buscamos el ID de la categoría basado en el nombre que viene en la tabla
      id_categoria: categorias.find(c => c.nombre === producto.categoria)?.id_categoria || ''
    });
    setProductoEditando(producto.id_producto);
    setMostrarFormulario(true);
  };

  // Función combinada: Sirve para Crear o Actualizar según el estado
  const guardarProducto = async (e) => {
    e.preventDefault();
    
    const url = productoEditando 
      ? `http://localhost:3000/api/productos/${productoEditando}` // Si hay ID, actualizamos (PUT)
      : 'http://localhost:3000/api/productos';                    // Si no, creamos (POST)
      
    const metodo = productoEditando ? 'PUT' : 'POST';

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosFormulario)
      });
      const datos = await respuesta.json();

      if (datos.success) {
        alert(productoEditando ? "Producto actualizado" : "Producto creado");
        cancelarFormulario();
        obtenerProductos(); // Recargamos la tabla
      }
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setProductoEditando(null);
    setDatosFormulario({ nombre: '', precio_base: '', id_categoria: '' });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Gestión de Inventario (Altas, Bajas y Cambios)</h3>
      
      <button 
        onClick={mostrarFormulario ? cancelarFormulario : () => setMostrarFormulario(true)}
        style={{ marginBottom: '20px', backgroundColor: mostrarFormulario ? '#6c757d' : '#28a745', color: 'white', padding: '10px', cursor: 'pointer', border: 'none', borderRadius: '5px' }}
      >
        {mostrarFormulario ? "Cancelar / Cerrar Formulario" : "+ Agregar Nuevo Producto (Alta)"}
      </button>

      {/* FORMULARIO ÚNICO PARA ALTA Y CAMBIOS */}
      {mostrarFormulario && (
        <form onSubmit={guardarProducto} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="text" placeholder="Nombre del producto" required
            value={datosFormulario.nombre}
            onChange={(e) => setDatosFormulario({...datosFormulario, nombre: e.target.value})}
            style={{ padding: '8px', flex: 1 }}
          />
          <input 
            type="number" step="0.01" placeholder="Precio ($)" required
            value={datosFormulario.precio_base}
            onChange={(e) => setDatosFormulario({...datosFormulario, precio_base: e.target.value})}
            style={{ padding: '8px', width: '100px' }}
          />
          <select 
            required
            value={datosFormulario.id_categoria}
            onChange={(e) => setDatosFormulario({...datosFormulario, id_categoria: e.target.value})}
            style={{ padding: '8px' }}
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map(cat => (
              <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>
            ))}
          </select>
          <button type="submit" style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
            {productoEditando ? "Guardar Cambios" : "Crear Producto"}
          </button>
        </form>
      )}

      {cargando ? <p>Cargando productos...</p> : (
        <table border="1" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f4', color: '#333' }}>
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
                  <button 
                    style={{ color: 'white', backgroundColor: '#ffc107', marginRight: '10px', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer', color: 'black' }}
                    onClick={() => iniciarEdicion(prod)}
                  >
                    Editar
                  </button>
                  <button 
                    style={{ color: 'white', backgroundColor: '#dc3545', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                    onClick={() => eliminarProducto(prod.id_producto)}
                  >
                    Eliminar
                  </button>
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