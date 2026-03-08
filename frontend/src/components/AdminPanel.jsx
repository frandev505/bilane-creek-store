import { useState, useEffect } from 'react';

export default function AdminPanel() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({ id_producto: null, nombre: '', precio_base: '', id_categoria: '' });
  const [isEditing, setIsEditing] = useState(false);

  // Cargar productos y categorías al iniciar
  useEffect(() => {
    fetch('http://localhost:3000/api/productos').then(res => res.json()).then(setProductos);
    fetch('http://localhost:3000/api/categorias').then(res => res.json()).then(setCategorias);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ALTA O MODIFICACIÓN (Submit del formulario)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing 
      ? `http://localhost:3000/api/productos/${formData.id_producto}`
      : 'http://localhost:3000/api/productos';
      
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          precio_base: Number(formData.precio_base),
          id_categoria: formData.id_categoria
        })
      });

      if (response.ok) {
        alert(isEditing ? 'Producto actualizado' : 'Producto creado');
        // Recargar productos
        const actualizados = await fetch('http://localhost:3000/api/productos').then(res => res.json());
        setProductos(actualizados);
        // Limpiar formulario
        setFormData({ id_producto: null, nombre: '', precio_base: '', id_categoria: '' });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error guardando producto", error);
    }
  };

  // BAJA (Eliminar)
  const handleDelete = async (id) => {
    if(!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/productos/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProductos(productos.filter(p => p.id_producto !== id));
      }
    } catch (error) {
      console.error("Error eliminando", error);
    }
  };

  // Preparar formulario para CAMBIO (Editar)
  const handleEdit = (producto) => {
    // Buscar el ID de la categoría basado en el nombre (ya que tu API GET devuelve el nombre de la categoría)
    const cat = categorias.find(c => c.nombre === producto.categoria);
    setFormData({
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      precio_base: producto.precio_base,
      id_categoria: cat ? cat.id_categoria : ''
    });
    setIsEditing(true);
  };

  return (
    <div className="mt-8 bg-gray-50 p-6 rounded-lg border">
      <h2 className="text-2xl font-bold mb-6 uppercase tracking-widest">Panel de Administración</h2>
      
      {/* Formulario (Altas y Modificaciones) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8 bg-white p-4 shadow-sm">
        <input type="text" name="nombre" placeholder="Nombre del producto" value={formData.nombre} onChange={handleChange} required className="border p-2" />
        <input type="number" name="precio_base" placeholder="Precio ($)" step="0.01" value={formData.precio_base} onChange={handleChange} required className="border p-2" />
        <select name="id_categoria" value={formData.id_categoria} onChange={handleChange} required className="border p-2">
          <option value="">Selecciona Categoría</option>
          {categorias.map(c => (
            <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
          ))}
        </select>
        <button type="submit" className="bg-black text-white font-bold p-2 hover:bg-gray-800 transition">
          {isEditing ? 'Actualizar Producto' : 'Añadir Producto'}
        </button>
      </form>

      {/* Tabla de Productos (Lectura, Edición y Bajas) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left bg-white border">
          <thead className="bg-black text-white uppercase text-sm">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Precio</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id_producto} className="border-b">
                <td className="p-3">{p.nombre}</td>
                <td className="p-3">{p.categoria}</td>
                <td className="p-3">${Number(p.precio_base).toFixed(2)}</td>
                <td className="p-3 flex justify-center gap-2">
                  <button onClick={() => handleEdit(p)} className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700">Editar</button>
                  <button onClick={() => handleDelete(p.id_producto)} className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700">Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}