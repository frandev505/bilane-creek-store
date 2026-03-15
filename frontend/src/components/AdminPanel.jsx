import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function AdminPanel() {
  const currentUser = useAuthStore(state => state.user);
  const [activeTab, setActiveTab] = useState('productos');

  // Listas de datos
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  // Formulario de Productos
  const [formData, setFormData] = useState({ id_producto: null, nombre: '', precio_base: '', id_categoria: '', imagen_url: '' });
  const [isEditing, setIsEditing] = useState(false);

  // Formulario de Usuarios
  const [userFormData, setUserFormData] = useState({ id_usuario: null, nombre: '', email: '', password: '', rol: 'cliente' });
  const [isUserEditing, setIsUserEditing] = useState(false);

  const rolesDisponibles = ['admin', 'gerente', 'auditor', 'cliente'];

  // Cargar datos iniciales
  useEffect(() => {
    if (currentUser?.rol === 'admin' || currentUser?.rol === 'gerente') {
      fetch('http://localhost:3000/api/productos?admin=true').then(res => res.json()).then(setProductos);
      fetch('http://localhost:3000/api/categorias').then(res => res.json()).then(setCategorias);
      fetch('http://localhost:3000/api/usuarios').then(res => res.json()).then(setUsuarios);
    }
  }, [currentUser]);

  // ==========================================
  // SEGURIDAD: PROTECCIÓN DE RUTA
  // ==========================================
  if (!currentUser || (currentUser.rol !== 'admin' && currentUser.rol !== 'gerente')) {
    return (
      <div className="mt-8 text-center bg-red-50 p-10 rounded-lg border border-red-200 shadow-sm">
        <h2 className="text-3xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
        <p className="text-gray-700 text-lg">No tienes los permisos necesarios para ver el Panel de Administración.</p>
      </div>
    );
  }

  // ==========================================
  // FUNCIONES DE PRODUCTOS
  // ==========================================
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing ? `http://localhost:3000/api/productos/${formData.id_producto}` : 'http://localhost:3000/api/productos';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          precio_base: Number(formData.precio_base),
          id_categoria: formData.id_categoria,
          imagen_url: formData.imagen_url
        })
      });

      if (response.ok) {
        alert(isEditing ? 'Producto actualizado' : 'Producto creado');
        const actualizados = await fetch('http://localhost:3000/api/productos?admin=true').then(res => res.json());
        setProductos(actualizados);
        handleProductClear();
      }
    } catch (error) {
      console.error("Error guardando producto", error);
    }
  };

  const handleProductClear = () => {
    setFormData({ id_producto: null, nombre: '', precio_base: '', id_categoria: '', imagen_url: '' });
    setIsEditing(false);
  };

  const handleProductToggleStatus = async (producto) => {
    const accion = producto.activo ? "inhabilitar" : "habilitar";
    if(!window.confirm(`¿Seguro que deseas ${accion} este producto?`)) return;
    try {
      const response = await fetch(`http://localhost:3000/api/productos/${producto.id_producto}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !producto.activo })
      });
      if (response.ok) {
        const actualizados = await fetch('http://localhost:3000/api/productos?admin=true').then(res => res.json());
        setProductos(actualizados);
      }
    } catch (error) {
      console.error("Error cambiando estado", error);
    }
  };

  const handleProductEdit = (producto) => {
    const cat = categorias.find(c => c.nombre === producto.categoria);
    setFormData({
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      precio_base: producto.precio_base,
      id_categoria: cat ? cat.id_categoria : '',
      imagen_url: producto.imagen_url || ''
    });
    setIsEditing(true);
  };

  // ==========================================
  // FUNCIONES DE USUARIOS
  // ==========================================
  const handleUserChange = (e) => setUserFormData({ ...userFormData, [e.target.name]: e.target.value });

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const url = isUserEditing ? `http://localhost:3000/api/usuarios/${userFormData.id_usuario}` : 'http://localhost:3000/api/usuarios';
    const method = isUserEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: userFormData.nombre,
          email: userFormData.email,
          rol: userFormData.rol,
          password: userFormData.password
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(isUserEditing ? 'Usuario actualizado' : 'Usuario creado');
        const actualizados = await fetch('http://localhost:3000/api/usuarios').then(res => res.json());
        setUsuarios(actualizados);
        handleUserClear();
      } else {
        alert(data.error); 
      }
    } catch (error) {
      console.error("Error guardando usuario", error);
    }
  };

  const handleUserClear = () => {
    setUserFormData({ id_usuario: null, nombre: '', email: '', password: '', rol: 'cliente' });
    setIsUserEditing(false);
  };

  const handleUserEdit = (usuario) => {
    setUserFormData({
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      email: usuario.email,
      password: '', 
      rol: usuario.rol
    });
    setIsUserEditing(true);
  };

  const handleUserToggleStatus = async (usuario) => {
    if(usuario.id_usuario === currentUser.id) return alert("No puedes inhabilitarte a ti mismo mientras estás logueado.");
    const accion = usuario.activo ? "inhabilitar" : "habilitar";
    if(!window.confirm(`¿Seguro que deseas ${accion} a este usuario?`)) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/usuarios/${usuario.id_usuario}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !usuario.activo })
      });
      const data = await response.json();
      if (response.ok) {
        const actualizados = await fetch('http://localhost:3000/api/usuarios').then(res => res.json());
        setUsuarios(actualizados);
      } else {
        alert(data.error); 
      }
    } catch (error) {
      console.error("Error cambiando estado del usuario", error);
    }
  };

  const handleResetPassword = async (id) => {
    if(!window.confirm("¿Seguro que deseas resetear la contraseña de este usuario a 'pass123'?")) return;
    try {
      const response = await fetch(`http://localhost:3000/api/usuarios/${id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterRole: currentUser.rol }) 
      });
      const data = await response.json();
      if (response.ok) {
        alert("La contraseña ha sido reseteada a 'pass123'.");
      } else {
        alert(data.error); 
      }
    } catch (error) {
      console.error("Error reseteando contraseña", error);
    }
  };

  return (
    <div className="mt-8 bg-gray-50 p-6 rounded-lg border">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold uppercase tracking-widest">Panel de Administración</h2>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('productos')} className={`px-4 py-2 font-bold rounded transition-colors ${activeTab === 'productos' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Productos</button>
          <button onClick={() => setActiveTab('usuarios')} className={`px-4 py-2 font-bold rounded transition-colors ${activeTab === 'usuarios' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Usuarios</button>
        </div>
      </div>

      {/* ================= VISTA DE PRODUCTOS ================= */}
      {activeTab === 'productos' && (
        <div>
          <form onSubmit={handleProductSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8 bg-white p-4 shadow-sm items-end">
            <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required className="border p-2 w-full" />
            <input type="number" name="precio_base" placeholder="Precio ($)" step="0.01" value={formData.precio_base} onChange={handleChange} required className="border p-2 w-full" />
            <select name="id_categoria" value={formData.id_categoria} onChange={handleChange} required className="border p-2 w-full">
              <option value="">Categoría...</option>
              {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
            </select>
            <input type="text" name="imagen_url" placeholder="Ruta imagen (/img/...)" value={formData.imagen_url} onChange={handleChange} className="border p-2 w-full" />
            
            <div className="flex gap-2 lg:col-span-2">
              <button type="submit" className="bg-blue-600 text-white font-bold p-2 hover:bg-blue-700 transition flex-1 rounded">
                {isEditing ? 'Actualizar' : 'Añadir'}
              </button>
              <button type="button" onClick={handleProductClear} className="bg-gray-500 text-white font-bold p-2 hover:bg-gray-600 transition flex-1 rounded">
                Limpiar
              </button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left bg-white border">
              <thead className="bg-black text-white uppercase text-sm">
                <tr>
                  <th className="p-3">Img</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Precio</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p.id_producto} className={`border-b hover:bg-gray-50 transition-opacity ${!p.activo ? 'opacity-60' : ''}`}>
                    <td className="p-3"><img src={p.imagen_url || `https://ui-avatars.com/api/?name=${p.nombre}&background=random`} alt={p.nombre} className="w-10 h-10 object-cover rounded-full border" /></td>
                    <td className="p-3">{p.nombre}</td>
                    <td className="p-3">{p.categoria}</td>
                    <td className="p-3">${Number(p.precio_base).toFixed(2)}</td>
                    <td className="p-3 font-bold">
                      <span className={p.activo ? "text-green-600" : "text-red-600"}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-3 flex justify-center gap-2 items-center h-full pt-4">
                      <button onClick={() => handleProductEdit(p)} className="bg-yellow-500 text-white px-3 py-1 text-sm rounded hover:bg-yellow-600">Editar</button>
                      <button 
                        onClick={() => handleProductToggleStatus(p)} 
                        className={`px-3 py-1 text-sm rounded text-white ${p.activo ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                      >
                        {p.activo ? 'Inhabilitar' : 'Habilitar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= VISTA DE USUARIOS ================= */}
      {activeTab === 'usuarios' && (
        <div>
          <form onSubmit={handleUserSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8 bg-white p-4 shadow-sm items-end">
            <input type="text" name="nombre" placeholder="Nombre completo" value={userFormData.nombre} onChange={handleUserChange} required className="border p-2 w-full" />
            <input type="email" name="email" placeholder="Correo electrónico" value={userFormData.email} onChange={handleUserChange} required className="border p-2 w-full" />
            
            {!isUserEditing ? (
              <input type="password" name="password" placeholder="Contraseña" value={userFormData.password} onChange={handleUserChange} required className="border p-2 w-full" minLength="6" />
            ) : (
              <div className="border p-2 bg-gray-100 text-gray-500 text-sm flex items-center h-[42px] w-full">Contraseña oculta</div>
            )}
            
            <select 
              name="rol" 
              value={userFormData.rol} 
              onChange={handleUserChange} 
              required 
              className={`border p-2 w-full ${userFormData.id_usuario === currentUser.id ? 'bg-gray-200 cursor-not-allowed' : ''}`}
              disabled={userFormData.id_usuario === currentUser.id}
            >
              {rolesDisponibles.map(rol => (
                <option key={rol} value={rol}>{rol.charAt(0).toUpperCase() + rol.slice(1)}</option>
              ))}
            </select>
            
            <div className="flex gap-2 lg:col-span-2">
              <button type="submit" className="bg-blue-600 text-white font-bold p-2 hover:bg-blue-700 transition flex-1 rounded">
                {isUserEditing ? 'Actualizar' : 'Añadir'}
              </button>
              <button type="button" onClick={handleUserClear} className="bg-gray-500 text-white font-bold p-2 hover:bg-gray-600 transition flex-1 rounded">
                Limpiar
              </button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left bg-white border">
              <thead className="bg-black text-white uppercase text-sm">
                <tr>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id_usuario} className={`border-b hover:bg-gray-50 transition-opacity ${!u.activo ? 'opacity-60' : ''}`}>
                    <td className="p-3 font-semibold">{u.nombre} {currentUser.id === u.id_usuario && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">Tú</span>}</td>
                    <td className="p-3 text-sm text-gray-600">{u.email}</td>
                    <td className="p-3 capitalize font-medium">{u.rol}</td>
                    <td className="p-3 font-bold">
                      <span className={u.activo ? "text-green-600" : "text-red-600"}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-3 flex justify-center gap-2 items-center h-full">
                      <button onClick={() => handleUserEdit(u)} className="bg-yellow-500 text-white px-3 py-1 text-sm rounded hover:bg-yellow-600">Editar</button>
                      
                      {(currentUser?.rol === 'admin' || currentUser?.rol === 'gerente') && (
                        <button 
                          onClick={() => handleResetPassword(u.id_usuario)} 
                          className="bg-purple-500 text-white px-3 py-1 text-sm rounded hover:bg-purple-600"
                          title="Resetear a pass123"
                        >
                          Reset Pass
                        </button>
                      )}

                      <button 
                        onClick={() => handleUserToggleStatus(u)} 
                        disabled={currentUser.id === u.id_usuario}
                        className={`px-3 py-1 text-sm rounded text-white ${currentUser.id === u.id_usuario ? 'bg-gray-300 cursor-not-allowed' : (u.activo ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700')}`}
                      >
                        {u.activo ? 'Inhabilitar' : 'Habilitar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}