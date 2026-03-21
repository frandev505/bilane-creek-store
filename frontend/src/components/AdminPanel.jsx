import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
// 1. IMPORTACIONES CORREGIDAS PARA EL PDF 👇
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; 

// 2. CENTRALIZAMOS LA URL BASE DE LA API
const API_URL = 'http://localhost:3000/api';

export default function AdminPanel() {
  const currentUser = useAuthStore(state => state.user);
  const [activeTab, setActiveTab] = useState('productos');

  // ==========================================
  // ESTADOS GLOBALES
  // ==========================================
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Estados para Formularios
  const [formData, setFormData] = useState({ id_producto: null, nombre: '', precio_base: '', id_categoria: '', imagen_url: '' });
  const [isEditing, setIsEditing] = useState(false);

  const [userFormData, setUserFormData] = useState({ id_usuario: null, nombre: '', email: '', password: '', rol: 'cliente' });
  const [isUserEditing, setIsUserEditing] = useState(false);

  const rolesDisponibles = ['admin', 'gerente', 'auditor', 'cliente'];

  // ==========================================
  // CARGA DE DATOS (FETCH)
  // ==========================================
  const cargarLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/auditoria`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Error cargando auditoría:", error);
    }
  };

  useEffect(() => {
    // Solo cargamos si es admin o gerente
    if (currentUser?.rol === 'admin' || currentUser?.rol === 'gerente') {
      fetch(`${API_URL}/productos?admin=true`).then(res => res.json()).then(setProductos);
      fetch(`${API_URL}/categorias`).then(res => res.json()).then(setCategorias);
      fetch(`${API_URL}/usuarios`).then(res => res.json()).then(setUsuarios);
      cargarLogs();
    }
  }, [currentUser]);

  // ==========================================
  // EXPORTAR A PDF CORREGIDO 📄
  // ==========================================
  const exportarPDF = () => {
    try {
      const doc = new jsPDF();
      const fechaActual = new Date().toLocaleString();
      const autor = currentUser?.nombre || 'Administrador';
      doc.setFontSize(18);

      if (activeTab === 'productos') {
        if (productos.length === 0) return alert("No hay productos para exportar.");
        
        doc.text("Reporte de Inventario - Admin", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
        
        const columnas = ["Nombre", "Categoría", "Precio Base", "Estado"];
        const filas = productos.map(p => [
          p.nombre, 
          p.categoria, 
          `$${Number(p.precio_base).toFixed(2)}`, 
          p.activo ? 'Activo' : 'Inactivo'
        ]);
        
        // CORRECCIÓN AQUÍ 👇
        autoTable(doc, { 
          startY: 36, head: [columnas], body: filas, theme: 'striped', headStyles: { fillColor: [0, 0, 0] } 
        });
        doc.save(`Admin_Inventario_${new Date().toISOString().split('T')[0]}.pdf`);

      } else if (activeTab === 'usuarios') {
        if (usuarios.length === 0) return alert("No hay usuarios para exportar.");
        
        doc.text("Directorio de Usuarios - Admin", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
        
        const columnas = ["Nombre", "Email", "Rol", "Estado"];
        const filas = usuarios.map(u => [
          u.nombre, 
          u.email, 
          u.rol.toUpperCase(), 
          u.activo ? 'Activo' : 'Inactivo'
        ]);
        
        // CORRECCIÓN AQUÍ 👇
        autoTable(doc, { 
          startY: 36, head: [columnas], body: filas, theme: 'striped', headStyles: { fillColor: [0, 0, 0] } 
        });
        doc.save(`Admin_Usuarios_${new Date().toISOString().split('T')[0]}.pdf`);

      } else if (activeTab === 'auditoria') {
        if (logs.length === 0) return alert("No hay registros para exportar.");
        
        doc.text("Registro de Actividad (Logs) - Admin", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
        
        const columnas = ["Fecha", "Autor", "Acción", "Detalles"];
        const filas = logs.map(log => [
          new Date(log.fecha).toLocaleString(),
          `${log.autor || 'Sistema'}\n(${log.autor_email || 'N/A'})`,
          log.accion,
          log.detalles
        ]);
        
        // CORRECCIÓN AQUÍ 👇
        autoTable(doc, { 
          startY: 36, head: [columnas], body: filas, theme: 'striped', headStyles: { fillColor: [31, 41, 55] }, styles: { fontSize: 8 } 
        });
        doc.save(`Admin_Auditoria_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Hubo un problema al generar el PDF. Revisa la consola.");
    }
  };

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
  // LOGICA: PRODUCTOS
  // ==========================================
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing ? `${API_URL}/productos/${formData.id_producto}` : `${API_URL}/productos`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          precio_base: Number(formData.precio_base),
          id_categoria: formData.id_categoria,
          imagen_url: formData.imagen_url,
          requesterId: currentUser.id
        })
      });

      if (response.ok) {
        alert(isEditing ? 'Producto actualizado' : 'Producto creado');
        const actualizados = await fetch(`${API_URL}/productos?admin=true`).then(res => res.json());
        setProductos(actualizados);
        handleProductClear();
        cargarLogs();
      }
    } catch (error) {
      console.error("Error guardando producto:", error);
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
      const response = await fetch(`${API_URL}/productos/${producto.id_producto}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !producto.activo, requesterId: currentUser.id })
      });
      if (response.ok) {
        const actualizados = await fetch(`${API_URL}/productos?admin=true`).then(res => res.json());
        setProductos(actualizados);
        cargarLogs();
      }
    } catch (error) {
      console.error("Error cambiando estado:", error);
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
  // LOGICA: USUARIOS
  // ==========================================
  const handleUserChange = (e) => setUserFormData({ ...userFormData, [e.target.name]: e.target.value });

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const url = isUserEditing ? `${API_URL}/usuarios/${userFormData.id_usuario}` : `${API_URL}/usuarios`;
    const method = isUserEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userFormData, requesterId: currentUser.id })
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(isUserEditing ? 'Usuario actualizado' : 'Usuario creado');
        const actualizados = await fetch(`${API_URL}/usuarios`).then(res => res.json());
        setUsuarios(actualizados);
        handleUserClear();
        cargarLogs();
      } else {
        alert(data.error); 
      }
    } catch (error) {
      console.error("Error guardando usuario:", error);
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
    if(usuario.id_usuario === currentUser.id) return alert("No puedes inhabilitarte a ti mismo.");
    const accion = usuario.activo ? "inhabilitar" : "habilitar";
    if(!window.confirm(`¿Seguro que deseas ${accion} a este usuario?`)) return;
    
    try {
      const response = await fetch(`${API_URL}/usuarios/${usuario.id_usuario}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !usuario.activo, requesterId: currentUser.id })
      });
      const data = await response.json();
      if (response.ok) {
        const actualizados = await fetch(`${API_URL}/usuarios`).then(res => res.json());
        setUsuarios(actualizados);
        cargarLogs();
      } else {
        alert(data.error); 
      }
    } catch (error) {
      console.error("Error cambiando estado del usuario:", error);
    }
  };

  const handleResetPassword = async (id) => {
    if(!window.confirm("¿Seguro que deseas resetear la contraseña a 'pass123'?")) return;
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterRole: currentUser.rol, requesterId: currentUser.id })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.mensaje || "Contraseña reseteada con éxito.");
        setUsuarios(usuarios.map(u => u.id_usuario === id ? { ...u, activo: true } : u));
        cargarLogs();
      } else {
        alert(data.error); 
      }
    } catch (error) {
      console.error("Error reseteando contraseña:", error);
    }
  };

  // ==========================================
  // VISTA (RENDER)
  // ==========================================
  return (
    <div className="mt-8 bg-gray-50 p-6 rounded-lg border">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold uppercase tracking-widest">Panel de Administración</h2>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('productos')} className={`px-4 py-2 font-bold rounded transition-colors ${activeTab === 'productos' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Productos</button>
          <button onClick={() => setActiveTab('usuarios')} className={`px-4 py-2 font-bold rounded transition-colors ${activeTab === 'usuarios' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Usuarios</button>
          <button onClick={() => setActiveTab('auditoria')} className={`px-4 py-2 font-bold rounded transition-colors ${activeTab === 'auditoria' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Auditoría 👁️</button>
        </div>
      </div>

      {/* VISTA DE PRODUCTOS */}
      {activeTab === 'productos' && (
        <div>
          <form onSubmit={handleProductSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 bg-white p-4 shadow-sm items-end rounded">
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

          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold text-gray-800">Inventario Actual</h3>
            <button onClick={exportarPDF} className="text-sm bg-red-600 text-white font-bold px-4 py-2 rounded hover:bg-red-700 transition shadow-sm">
              📄 Exportar a PDF
            </button>
          </div>

          <div className="overflow-x-auto shadow-sm">
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

      {/* VISTA DE USUARIOS */}
      {activeTab === 'usuarios' && (
        <div>
          <form onSubmit={handleUserSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 bg-white p-4 shadow-sm items-end rounded">
            <input type="text" name="nombre" placeholder="Nombre completo" value={userFormData.nombre} onChange={handleUserChange} required className="border p-2 w-full" />
            <input type="email" name="email" placeholder="Correo electrónico" value={userFormData.email} onChange={handleUserChange} required className="border p-2 w-full" />
            
            {!isUserEditing ? (
              <input type="password" name="password" placeholder="Contraseña" value={userFormData.password} onChange={handleUserChange} required className="border p-2 w-full" minLength="6" />
            ) : (
              <div className="border p-2 bg-gray-100 text-gray-500 text-sm flex items-center h-[42px] w-full rounded">Contraseña oculta</div>
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

          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold text-gray-800">Directorio de Usuarios</h3>
            <button onClick={exportarPDF} className="text-sm bg-red-600 text-white font-bold px-4 py-2 rounded hover:bg-red-700 transition shadow-sm">
              📄 Exportar a PDF
            </button>
          </div>

          <div className="overflow-x-auto shadow-sm">
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
                          title="Resetear a pass123 y Desbloquear"
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

      {/* VISTA DE AUDITORÍA */}
      {activeTab === 'auditoria' && (
        <div className="bg-white p-4 rounded border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Registro de Actividad</h3>
            <div className="flex gap-2">
              <button 
                onClick={cargarLogs}
                className="text-sm bg-gray-100 border border-gray-300 px-3 py-1 rounded hover:bg-gray-200 font-semibold"
              >
                🔄 Refrescar
              </button>
              <button onClick={exportarPDF} className="text-sm bg-red-600 text-white font-bold px-4 py-1 rounded hover:bg-red-700 transition shadow-sm">
                📄 Exportar a PDF
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto shadow-sm">
            <table className="w-full text-left bg-white border">
              <thead className="bg-gray-800 text-white uppercase text-xs">
                <tr>
                  <th className="p-3 w-48">Fecha y Hora</th>
                  <th className="p-3 w-48">Autor</th>
                  <th className="p-3 w-32">Acción</th>
                  <th className="p-3">Detalles</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {logs.length > 0 ? (
                  logs.map(log => (
                    <tr key={log.id_log} className="border-b hover:bg-gray-50">
                      <td className="p-3 whitespace-nowrap text-gray-500">
                        {new Date(log.fecha).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-800">{log.autor || 'Sistema'}</div>
                        <div className="text-xs text-gray-500">{log.autor_email || 'N/A'}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                          {log.accion}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700">{log.detalles}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500">
                      No hay registros de auditoría por el momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}