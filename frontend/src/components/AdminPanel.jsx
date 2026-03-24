import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; 

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
  
  // ==========================================
  // ESTADOS DE FILTROS PARA PRODUCTOS
  // ==========================================
  const [filtros, setFiltros] = useState({
    busqueda: '',
    categoria: '',
    precioMin: '',
    precioMax: '',
    estado: '' 
  });

  // ==========================================
  // ESTADOS DE ORDENACIÓN (SORTING)
  // ==========================================
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' }); 
  const [sortUsersConfig, setSortUsersConfig] = useState({ key: null, direction: 'asc' }); 
  const [sortLogsConfig, setSortLogsConfig] = useState({ key: 'fecha', direction: 'desc' });

  // ==========================================
  // ESTADOS DE PAGINACIÓN
  // ==========================================
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPageProd, setCurrentPageProd] = useState(1);
  const [currentPageUser, setCurrentPageUser] = useState(1);
  const [currentPageLog, setCurrentPageLog] = useState(1);

  useEffect(() => setCurrentPageProd(1), [filtros]);

  // ==========================================
  // ESTADOS PARA MODALES Y FORMULARIOS
  // ==========================================
  const [showProductModal, setShowProductModal] = useState(false);
  const [formData, setFormData] = useState({ id_producto: null, nombre: '', precio_base: '', id_categoria: '', imagen_url: '' });
  const [isEditing, setIsEditing] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState({ id_usuario: null, nombre: '', email: '', password: '', rol: 'cliente' });
  const [isUserEditing, setIsUserEditing] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false); 

  const rolesDisponibles = ['admin', 'gerente', 'auditor', 'cliente'];

  // ==========================================
  // CARGA DE DATOS (FETCH)
  // ==========================================
  const cargarLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/auditoria`);
      if (res.ok) setLogs(await res.json());
    } catch (error) { console.error("Error cargando auditoría:", error); }
  };

  useEffect(() => {
    if (currentUser?.rol === 'admin' || currentUser?.rol === 'gerente') {
      fetch(`${API_URL}/productos?admin=true`).then(res => res.json()).then(setProductos);
      fetch(`${API_URL}/categorias`).then(res => res.json()).then(setCategorias);
      fetch(`${API_URL}/usuarios`).then(res => res.json()).then(setUsuarios);
      cargarLogs();
    }
  }, [currentUser]);

  // ==========================================
  // PROCESAMIENTO: PRODUCTOS
  // ==========================================
  let productosProcesados = productos.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase());
    const matchCategoria = filtros.categoria ? p.categoria === filtros.categoria : true;
    const matchMin = filtros.precioMin ? Number(p.precio_base) >= Number(filtros.precioMin) : true;
    const matchMax = filtros.precioMax ? Number(p.precio_base) <= Number(filtros.precioMax) : true;
    const matchEstado = filtros.estado === 'activo' ? p.activo === true : (filtros.estado === 'inactivo' ? p.activo === false : true);
    return matchBusqueda && matchCategoria && matchMin && matchMax && matchEstado;
  });

  if (sortConfig.key) {
    productosProcesados.sort((a, b) => {
      let aValue = a[sortConfig.key]; let bValue = b[sortConfig.key];
      if (sortConfig.key === 'precio_base') { aValue = Number(aValue); bValue = Number(bValue); }
      else if (sortConfig.key === 'activo') { aValue = aValue ? 1 : 0; bValue = bValue ? 1 : 0; }
      else { aValue = String(aValue).toLowerCase(); bValue = String(bValue).toLowerCase(); }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const renderSortArrow = (config, columnKey) => {
    if (config.key !== columnKey) return <span className="text-gray-500 opacity-50 ml-1">↕</span>;
    return config.direction === 'asc' ? <span className="text-green-400 ml-1">↑</span> : <span className="text-green-400 ml-1">↓</span>;
  };

  // ==========================================
  // PROCESAMIENTO: USUARIOS
  // ==========================================
  let usuariosProcesados = [...usuarios];
  if (sortUsersConfig.key) {
    usuariosProcesados.sort((a, b) => {
      let aValue = a[sortUsersConfig.key]; let bValue = b[sortUsersConfig.key];
      if (sortUsersConfig.key === 'activo') { aValue = aValue ? 1 : 0; bValue = bValue ? 1 : 0; }
      else { aValue = String(aValue).toLowerCase(); bValue = String(bValue).toLowerCase(); }
      if (aValue < bValue) return sortUsersConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortUsersConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const handleSortUsers = (key) => {
    let direction = 'asc';
    if (sortUsersConfig.key === key && sortUsersConfig.direction === 'asc') direction = 'desc';
    setSortUsersConfig({ key, direction });
  };

  // ==========================================
  // PROCESAMIENTO: AUDITORÍA
  // ==========================================
  let logsProcesados = [...logs];
  if (sortLogsConfig.key) {
    logsProcesados.sort((a, b) => {
      let aValue = a[sortLogsConfig.key]; let bValue = b[sortLogsConfig.key];
      if (sortLogsConfig.key === 'fecha') { aValue = new Date(aValue).getTime(); bValue = new Date(bValue).getTime(); }
      else { aValue = String(aValue || '').toLowerCase(); bValue = String(bValue || '').toLowerCase(); }
      if (aValue < bValue) return sortLogsConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortLogsConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const handleSortLogs = (key) => {
    let direction = 'asc';
    if (sortLogsConfig.key === key && sortLogsConfig.direction === 'asc') direction = 'desc';
    setSortLogsConfig({ key, direction });
  };

  // ==========================================
  // PAGINACIÓN (Cálculos de listas a mostrar)
  // ==========================================
  const paginateList = (list, currentPage) => {
    if (itemsPerPage === 'all') return list;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return list.slice(startIndex, startIndex + itemsPerPage);
  };

  const productosPaginados = paginateList(productosProcesados, currentPageProd);
  const usuariosPaginados = paginateList(usuariosProcesados, currentPageUser);
  const logsPaginados = paginateList(logsProcesados, currentPageLog);

  // Componente Reutilizable de Paginación
  const PaginationControls = ({ totalItems, currentPage, setCurrentPage }) => {
    if (itemsPerPage === 'all' || totalItems <= itemsPerPage) return null;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    return (
      <div className="flex justify-between items-center bg-[#0a120e]/60 p-4 border-t border-white/10">
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-1.5 bg-white/10 text-white rounded-md disabled:opacity-30 hover:bg-white/20 font-bold text-sm transition-colors border border-white/10">
          Anterior
        </button>
        <span className="text-sm font-medium text-white/70">
          Página {currentPage} de {totalPages}
        </span>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-1.5 bg-white/10 text-white rounded-md disabled:opacity-30 hover:bg-white/20 font-bold text-sm transition-colors border border-white/10">
          Siguiente
        </button>
      </div>
    );
  };

  // ==========================================
  // VALIDACIONES: PRODUCTOS
  // ==========================================
  const regexNombreProducto = /^[a-zA-ZÀ-ÿ0-9\s]+$/;
  const isNombreProductoValido = formData.nombre.length === 0 || regexNombreProducto.test(formData.nombre);
  const isPrecioProductoValido = formData.precio_base === '' || Number(formData.precio_base) >= 0;
  const isProductFormValid = formData.nombre.length > 0 && formData.nombre.length <= 30 && isNombreProductoValido && isPrecioProductoValido && formData.precio_base !== '' && formData.id_categoria !== '';

  // ==========================================
  // VALIDACIONES: USUARIOS (INCLUYENDO FUERZA DE CONTRASEÑA)
  // ==========================================
  const regexNombreUsuario = /^[a-zA-ZÀ-ÿ\s]+$/;
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const isUserNameValid = userFormData.nombre.length === 0 || regexNombreUsuario.test(userFormData.nombre);
  const isUserEmailValid = userFormData.email.length === 0 || regexEmail.test(userFormData.email);
  
  const userPassword = userFormData.password;
  const hasLower = /[a-z]/.test(userPassword);
  const hasUpper = /[A-Z]/.test(userPassword);
  const hasNumber = /\d/.test(userPassword);
  const hasSpecial = /[\W_]/.test(userPassword);
  const hasNoSpace = !/\s/.test(userPassword) && userPassword.length > 0;
  const isValidLength = userPassword.length >= 6 && userPassword.length <= 32;

  let strengthScore = 0;
  if (hasLower) strengthScore++;
  if (hasUpper) strengthScore++;
  if (hasNumber) strengthScore++;
  if (hasSpecial) strengthScore++;
  if (isValidLength && hasNoSpace) strengthScore++;

  const getStrengthData = () => {
    if (userPassword.length === 0) return { width: '0%', color: 'bg-white/20', text: '' };
    if (strengthScore <= 2) return { width: '25%', color: 'bg-red-500', text: 'Muy Débil' };
    if (strengthScore === 3) return { width: '50%', color: 'bg-orange-500', text: 'Regular' };
    if (strengthScore === 4) return { width: '75%', color: 'bg-yellow-400', text: 'Buena' };
    return { width: '100%', color: 'bg-green-500', text: 'Fuerte y Segura' };
  };

  const { width: pwWidth, color: pwColor, text: pwText } = getStrengthData();
  const isUserPassValidLocal = strengthScore === 5 && hasNoSpace;
  const finalIsUserPassValid = isUserEditing ? true : isUserPassValidLocal; 
  
  const isUserFormValid = userFormData.nombre.length >= 3 && isUserNameValid && userFormData.email.length > 0 && isUserEmailValid && finalIsUserPassValid;

  // ==========================================
  // EXPORTAR A PDF (Respeta listas Procesadas)
  // ==========================================
  const exportarPDF = () => {
    try {
      const doc = new jsPDF();
      const fechaActual = new Date().toLocaleString();
      const autor = currentUser?.nombre || 'Administrador';
      doc.setFontSize(18);

      if (activeTab === 'productos') {
        if (productosProcesados.length === 0) return alert("No hay productos para exportar.");
        doc.text("Reporte de Inventario - Admin", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
        const filas = productosProcesados.map(p => [ p.nombre, p.categoria, `$${Number(p.precio_base).toFixed(2)}`, p.activo ? 'Activo' : 'Inactivo' ]);
        autoTable(doc, { startY: 36, head: [["Nombre", "Categoría", "Precio Base", "Estado"]], body: filas, theme: 'striped', headStyles: { fillColor: [26, 45, 33] } });
        doc.save(`Inventario_${new Date().toISOString().split('T')[0]}.pdf`);

      } else if (activeTab === 'usuarios') {
        if (usuariosProcesados.length === 0) return alert("No hay usuarios para exportar.");
        doc.text("Directorio de Usuarios - Admin", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
        const filas = usuariosProcesados.map(u => [u.nombre, u.email, u.rol.toUpperCase(), u.activo ? 'Activo' : 'Inactivo']);
        autoTable(doc, { startY: 36, head: [["Nombre", "Email", "Rol", "Estado"]], body: filas, theme: 'striped', headStyles: { fillColor: [26, 45, 33] } });
        doc.save(`Usuarios_${new Date().toISOString().split('T')[0]}.pdf`);

      } else if (activeTab === 'auditoria') {
        if (logsProcesados.length === 0) return alert("No hay registros para exportar.");
        doc.text("Registro de Actividad (Logs)", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
        const filas = logsProcesados.map(log => [new Date(log.fecha).toLocaleString(), `${log.autor || 'Sistema'}\n(${log.autor_email || 'N/A'})`, log.accion, log.detalles]);
        autoTable(doc, { startY: 36, head: [["Fecha", "Autor", "Acción", "Detalles"]], body: filas, theme: 'striped', headStyles: { fillColor: [26, 45, 33] }, styles: { fontSize: 8 } });
        doc.save(`Auditoria_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) { console.error("Error PDF:", error); alert("Problema generando el PDF."); }
  };

  // ==========================================
  // MANEJO FORMULARIO PRODUCTOS
  // ==========================================
  const handleFilterChange = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
  const limpiarFiltros = () => { setFiltros({ busqueda: '', categoria: '', precioMin: '', precioMax: '', estado: '' }); setSortConfig({ key: null, direction: 'asc' }); };

  const handleProductClear = () => { setFormData({ id_producto: null, nombre: '', precio_base: '', id_categoria: '', imagen_url: '' }); setIsEditing(false); setShowProductModal(false); };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!isProductFormValid) return;
    const url = isEditing ? `${API_URL}/productos/${formData.id_producto}` : `${API_URL}/productos`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, nombre: formData.nombre.trim(), precio_base: Number(formData.precio_base), requesterId: currentUser.id })
      });
      if (response.ok) {
        alert(isEditing ? 'Producto actualizado' : 'Producto creado');
        setProductos(await fetch(`${API_URL}/productos?admin=true`).then(res => res.json()));
        handleProductClear();
        cargarLogs();
      }
    } catch (error) { console.error("Error guardando producto:", error); }
  };

  const handleProductEdit = (producto) => {
    const cat = categorias.find(c => c.nombre === producto.categoria);
    setFormData({ id_producto: producto.id_producto, nombre: producto.nombre, precio_base: producto.precio_base, id_categoria: cat ? cat.id_categoria : '', imagen_url: producto.imagen_url || '' });
    setIsEditing(true);
    setShowProductModal(true);
  };

  const handleProductToggleStatus = async (producto) => {
    if(!window.confirm(`¿Seguro que deseas ${producto.activo ? "inhabilitar" : "habilitar"} este producto?`)) return;
    try {
      const response = await fetch(`${API_URL}/productos/${producto.id_producto}/estado`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activo: !producto.activo, requesterId: currentUser.id }) });
      if (response.ok) { setProductos(await fetch(`${API_URL}/productos?admin=true`).then(res => res.json())); cargarLogs(); }
    } catch (error) { console.error("Error cambiando estado:", error); }
  };

  // ==========================================
  // MANEJO FORMULARIO USUARIOS
  // ==========================================
  const handleUserClear = () => { 
    setUserFormData({ id_usuario: null, nombre: '', email: '', password: '', rol: 'cliente' }); 
    setIsUserEditing(false); 
    setShowUserModal(false); 
    setShowUserPassword(false); 
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!isUserFormValid) return;
    const url = isUserEditing ? `${API_URL}/usuarios/${userFormData.id_usuario}` : `${API_URL}/usuarios`;
    const method = isUserEditing ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...userFormData, requesterId: currentUser.id }) });
      if (response.ok) { 
        alert(isUserEditing ? 'Usuario actualizado' : 'Usuario creado'); 
        setUsuarios(await fetch(`${API_URL}/usuarios`).then(res => res.json())); 
        handleUserClear(); 
        cargarLogs(); 
      } else { alert((await response.json()).error); }
    } catch (error) { console.error("Error guardando usuario:", error); }
  };

  const handleUserEdit = (usuario) => { 
    setUserFormData({ id_usuario: usuario.id_usuario, nombre: usuario.nombre, email: usuario.email, password: '', rol: usuario.rol }); 
    setIsUserEditing(true); 
    setShowUserModal(true); 
  };

  const handleUserToggleStatus = async (usuario) => {
    if(usuario.id_usuario === currentUser.id) return alert("No puedes inhabilitarte a ti mismo.");
    if(!window.confirm(`¿Seguro que deseas ${usuario.activo ? "inhabilitar" : "habilitar"} a este usuario?`)) return;
    try {
      const response = await fetch(`${API_URL}/usuarios/${usuario.id_usuario}/estado`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activo: !usuario.activo, requesterId: currentUser.id }) });
      if (response.ok) { setUsuarios(await fetch(`${API_URL}/usuarios`).then(res => res.json())); cargarLogs(); }
    } catch (error) { console.error("Error cambiando estado:", error); }
  };

  const handleResetPassword = async (id) => {
    if(!window.confirm("¿Seguro que deseas resetear la contraseña a 'pass123'?")) return;
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}/reset-password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requesterRole: currentUser.rol, requesterId: currentUser.id }) });
      if (response.ok) { alert("Contraseña reseteada con éxito."); setUsuarios(await fetch(`${API_URL}/usuarios`).then(res => res.json())); cargarLogs(); }
    } catch (error) { console.error("Error reseteando:", error); }
  };

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================
  if (!currentUser || (currentUser.rol !== 'admin' && currentUser.rol !== 'gerente')) {
    return (
      <div className="mt-8 text-center bg-red-900/40 p-10 rounded-xl border border-red-500/30 shadow-2xl backdrop-blur-md">
        <h2 className="text-3xl font-bold text-red-400 mb-2">Acceso Denegado</h2>
        <p className="text-white/80 text-lg">No tienes los permisos necesarios para ver esta sección.</p>
      </div>
    );
  }

  return (
    // CONTENEDOR PRINCIPAL GLASSMORPHISM
    <div className="mt-8 rounded-2xl border border-white/20 shadow-2xl p-6 relative overflow-hidden" style={{ background: "radial-gradient(circle at 10% 20%, rgb(40, 60, 45) 0%, rgb(10, 20, 15) 100%)" }}>
      
      {/* TÍTULO Y PESTAÑAS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-white/10 pb-6 gap-4">
        <h2 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-md">Panel de Administración</h2>
        <div className="flex gap-2 bg-[#0a120e]/60 p-1.5 rounded-lg border border-white/10">
          <button onClick={() => setActiveTab('productos')} className={`px-5 py-2 font-bold rounded-md transition-all ${activeTab === 'productos' ? 'bg-[#1a2d21] text-white shadow-lg border border-white/20' : 'bg-transparent text-white/60 hover:text-white hover:bg-white/10'}`}>Productos</button>
          <button onClick={() => setActiveTab('usuarios')} className={`px-5 py-2 font-bold rounded-md transition-all ${activeTab === 'usuarios' ? 'bg-[#1a2d21] text-white shadow-lg border border-white/20' : 'bg-transparent text-white/60 hover:text-white hover:bg-white/10'}`}>Usuarios</button>
          <button onClick={() => setActiveTab('auditoria')} className={`px-5 py-2 font-bold rounded-md transition-all ${activeTab === 'auditoria' ? 'bg-[#1a2d21] text-white shadow-lg border border-white/20' : 'bg-transparent text-white/60 hover:text-white hover:bg-white/10'}`}>Auditoría</button>
        </div>
      </div>

      {/* CONTROLES DE PAGINACIÓN GENERAL */}
      <div className="flex justify-end mb-4 items-center gap-3">
        <label className="text-sm font-semibold text-white/70">Mostrar:</label>
        <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPageProd(1); setCurrentPageUser(1); setCurrentPageLog(1); }} className="bg-[#ccc] text-black/90 font-medium border-0 p-1.5 px-3 rounded outline-none focus:ring-2 focus:ring-green-500/50">
          <option value={20}>20 filas</option>
          <option value="all">Todo</option>
        </select>
      </div>

      {/* ========================================== */}
      {/* VISTA: PRODUCTOS */}
      {/* ========================================== */}
      {activeTab === 'productos' && (
        <div className="animate-fade-in">
          {/* Modal Productos */}
          {showProductModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
              <div className="bg-[#132018] border border-white/20 p-8 rounded-2xl shadow-2xl max-w-lg w-full relative">
                <h3 className="text-2xl font-black uppercase text-white mb-6 border-b border-white/10 pb-4">{isEditing ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h3>
                <form onSubmit={handleProductSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Nombre del Producto</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} maxLength={30} required className={`bg-[#ccc] text-black/90 font-bold placeholder-black/40 p-3 w-full rounded outline-none focus:ring-2 ${!isNombreProductoValido ? 'ring-red-500' : 'focus:ring-green-500/50'}`} />
                    {!isNombreProductoValido && <span className="text-xs text-red-400 font-semibold mt-1 block">Solo letras y números.</span>}
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Precio Base ($)</label>
                    <input type="number" name="precio_base" step="0.01" min="0" value={formData.precio_base} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} required className={`bg-[#ccc] text-black/90 font-bold placeholder-black/40 p-3 w-full rounded outline-none focus:ring-2 ${!isPrecioProductoValido ? 'ring-red-500' : 'focus:ring-green-500/50'}`} />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Categoría</label>
                    <select name="id_categoria" value={formData.id_categoria} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} required className="bg-[#ccc] text-black/90 font-bold p-3 w-full rounded outline-none focus:ring-2 focus:ring-green-500/50">
                      <option value="">Selecciona...</option>
                      {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">URL Imagen</label>
                    <input type="text" name="imagen_url" value={formData.imagen_url} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} className="bg-[#ccc] text-black/90 font-bold placeholder-black/40 p-3 w-full rounded outline-none focus:ring-2 focus:ring-green-500/50" />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button type="submit" disabled={!isProductFormValid} className={`flex-1 font-bold uppercase tracking-widest py-3 rounded transition-colors ${!isProductFormValid ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-500 shadow-lg'}`}>Guardar</button>
                    <button type="button" onClick={handleProductClear} className="flex-1 bg-white/10 text-white/80 font-bold uppercase tracking-widest py-3 hover:bg-white/20 transition-colors rounded">Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-xl mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white/90">Filtros de Búsqueda</h3>
              <button onClick={limpiarFiltros} className="text-xs text-green-400 hover:text-green-300 hover:underline">Limpiar Filtros</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input type="text" name="busqueda" placeholder="Buscar por nombre..." value={filtros.busqueda} onChange={handleFilterChange} className="bg-[#ccc] text-black/80 font-medium p-2.5 rounded-md outline-none focus:ring-2 focus:ring-green-500/50 w-full" />
              <select name="categoria" value={filtros.categoria} onChange={handleFilterChange} className="bg-[#ccc] text-black/80 font-medium p-2.5 rounded-md outline-none focus:ring-2 focus:ring-green-500/50 w-full"><option value="">Todas las Categorías</option>{categorias.map(c => <option key={c.id_categoria} value={c.nombre}>{c.nombre}</option>)}</select>
              <input type="number" name="precioMin" placeholder="Precio Mínimo" min="0" value={filtros.precioMin} onChange={handleFilterChange} className="bg-[#ccc] text-black/80 font-medium p-2.5 rounded-md outline-none focus:ring-2 focus:ring-green-500/50 w-full" />
              <input type="number" name="precioMax" placeholder="Precio Máximo" min="0" value={filtros.precioMax} onChange={handleFilterChange} className="bg-[#ccc] text-black/80 font-medium p-2.5 rounded-md outline-none focus:ring-2 focus:ring-green-500/50 w-full" />
              <select name="estado" value={filtros.estado} onChange={handleFilterChange} className="bg-[#ccc] text-black/80 font-medium p-2.5 rounded-md outline-none focus:ring-2 focus:ring-green-500/50 w-full"><option value="">Todos los Estados</option><option value="activo">Solo Activos</option><option value="inactivo">Solo Inactivos</option></select>
            </div>
          </div>

          {/* Cabecera Tabla */}
          <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
            <h3 className="text-xl font-bold text-white">Inventario ({productosProcesados.length})</h3>
            <div className="flex gap-2">
              <button onClick={() => setShowProductModal(true)} className="bg-[#132018] text-white border border-white/30 hover:bg-white/10 hover:border-white/50 shadow-lg font-bold px-5 py-2 rounded-md transition-all">➕ Nuevo Producto</button>
              <button onClick={exportarPDF} className="bg-red-900/80 text-red-100 border border-red-500/30 hover:bg-red-800 font-bold px-5 py-2 rounded-md transition-all shadow-lg">📄 Exportar a PDF</button>
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="overflow-x-auto shadow-2xl border border-white/20 rounded-xl bg-white/5 backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0a120e] text-white/90 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 border-b border-white/10">Img</th>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('nombre')}>Nombre {renderSortArrow(sortConfig, 'nombre')}</th>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('categoria')}>Categoría {renderSortArrow(sortConfig, 'categoria')}</th>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('precio_base')}>Precio {renderSortArrow(sortConfig, 'precio_base')}</th>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('activo')}>Estado {renderSortArrow(sortConfig, 'activo')}</th>
                  <th className="p-4 border-b border-white/10 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosPaginados.length > 0 ? productosPaginados.map(p => (
                  <tr key={p.id_producto} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${!p.activo ? 'opacity-50' : ''}`}>
                    <td className="p-4"><img src={p.imagen_url || `https://ui-avatars.com/api/?name=${p.nombre}&background=random`} alt={p.nombre} className="w-10 h-10 object-cover rounded-md border border-white/20" /></td>
                    <td className="p-4 font-semibold text-white">{p.nombre}</td>
                    <td className="p-4 text-white/70 text-sm">{p.categoria}</td>
                    <td className="p-4 font-bold text-green-400">${Number(p.precio_base).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={p.activo ? "bg-green-500/20 text-green-300 border border-green-500/30 px-2.5 py-1 rounded text-xs font-bold tracking-wide" : "bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-1 rounded text-xs font-bold tracking-wide"}>{p.activo ? 'ACTIVO' : 'INACTIVO'}</span>
                    </td>
                    <td className="p-4 flex justify-center gap-2 items-center h-full">
                      <button onClick={() => handleProductEdit(p)} className="bg-yellow-600/80 text-yellow-100 border border-yellow-500/50 hover:bg-yellow-500 px-3 py-1.5 text-xs rounded-md font-bold transition-colors">Editar</button>
                      <button onClick={() => handleProductToggleStatus(p)} className={`px-3 py-1.5 text-xs rounded-md font-bold transition-colors border ${p.activo ? 'bg-red-900/80 text-red-100 border-red-500/50 hover:bg-red-800' : 'bg-green-900/80 text-green-100 border-green-500/50 hover:bg-green-800'}`}>{p.activo ? 'Inhabilitar' : 'Habilitar'}</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="6" className="p-8 text-center text-white/60 font-medium">No se encontraron productos.</td></tr>}
              </tbody>
            </table>
            <PaginationControls totalItems={productosProcesados.length} currentPage={currentPageProd} setCurrentPage={setCurrentPageProd} />
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VISTA: USUARIOS */}
      {/* ========================================== */}
      {activeTab === 'usuarios' && (
        <div className="animate-fade-in">
          {/* Modal Usuarios */}
          {showUserModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
              <div className="bg-[#132018] border border-white/20 p-8 rounded-2xl shadow-2xl max-w-lg w-full relative">
                <h3 className="text-2xl font-black uppercase text-white mb-6 border-b border-white/10 pb-4">{isEditing ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}</h3>
                <form onSubmit={handleUserSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Nombre Completo</label>
                    <input type="text" name="nombre" value={userFormData.nombre} onChange={(e) => setUserFormData({ ...userFormData, [e.target.name]: e.target.value })} required className={`bg-[#ccc] text-black/90 font-bold placeholder-black/40 p-3 w-full rounded outline-none focus:ring-2 ${!isUserNameValid ? 'ring-red-500' : 'focus:ring-green-500/50'}`} />
                    {!isUserNameValid && <span className="text-xs text-red-400 font-semibold mt-1 block">Solo letras y espacios permitidos.</span>}
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Correo Electrónico</label>
                    <input type="email" name="email" value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, [e.target.name]: e.target.value })} required className={`bg-[#ccc] text-black/90 font-bold placeholder-black/40 p-3 w-full rounded outline-none focus:ring-2 ${!isUserEmailValid ? 'ring-red-500' : 'focus:ring-green-500/50'}`} />
                    {!isUserEmailValid && <span className="text-xs text-red-400 font-semibold mt-1 block">Correo no válido.</span>}
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Contraseña {!isUserEditing && '(Estricta)'}</label>
                    {!isUserEditing ? (
                      <>
                        <div className="relative">
                          <input 
                            type={showUserPassword ? "text" : "password"} 
                            name="password" 
                            maxLength={32} 
                            value={userFormData.password} 
                            onChange={(e) => setUserFormData({ ...userFormData, [e.target.name]: e.target.value })} 
                            required 
                            className={`bg-[#ccc] text-black/90 font-bold p-3 pr-20 w-full rounded outline-none focus:ring-2 ${!finalIsUserPassValid && userFormData.password.length > 0 ? 'ring-red-500' : 'focus:ring-green-500/50'}`} 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowUserPassword(!showUserPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs uppercase font-bold text-black/60 hover:text-black transition-colors"
                          >
                            {showUserPassword ? "Ocultar" : "Mostrar"}
                          </button>
                        </div>
                        {userFormData.password.length > 0 && (
                          <div className="mt-3 p-4 bg-white/5 border border-white/10 text-white/80 text-sm rounded-lg">
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-2">
                              <div className={`h-full transition-all duration-300 ease-in-out ${pwColor}`} style={{ width: pwWidth }}></div>
                            </div>
                            <p className={`text-xs font-bold text-right mb-3 ${pwColor.replace('bg-', 'text-')}`}>
                              {pwText}
                            </p>
                            <ul className="grid grid-cols-2 gap-2 text-xs">
                              <li className={isValidLength ? 'text-green-400 font-semibold' : 'text-white/40'}>{isValidLength ? '✓' : '○'} 6 - 32 caract.</li>
                              <li className={hasUpper ? 'text-green-400 font-semibold' : 'text-white/40'}>{hasUpper ? '✓' : '○'} Mayúscula</li>
                              <li className={hasLower ? 'text-green-400 font-semibold' : 'text-white/40'}>{hasLower ? '✓' : '○'} Minúscula</li>
                              <li className={hasNumber ? 'text-green-400 font-semibold' : 'text-white/40'}>{hasNumber ? '✓' : '○'} Número</li>
                              <li className={hasSpecial ? 'text-green-400 font-semibold' : 'text-white/40'}>{hasSpecial ? '✓' : '○'} Especial (@$!)</li>
                              <li className={hasNoSpace ? 'text-green-400 font-semibold' : 'text-white/40'}>{hasNoSpace ? '✓' : '○'} Sin espacios</li>
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="border border-white/10 bg-white/5 text-white/50 text-sm font-semibold flex items-center p-3 w-full rounded">Contraseña protegida (Usa Reset Pass para cambiar)</div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Rol del Sistema</label>
                    <select name="rol" value={userFormData.rol} onChange={(e) => setUserFormData({ ...userFormData, [e.target.name]: e.target.value })} required className={`bg-[#ccc] text-black/90 font-bold p-3 w-full rounded outline-none focus:ring-2 focus:ring-green-500/50 ${userFormData.id_usuario === currentUser.id ? 'opacity-70 cursor-not-allowed' : ''}`} disabled={userFormData.id_usuario === currentUser.id}>
                      {rolesDisponibles.map(rol => <option key={rol} value={rol}>{rol.charAt(0).toUpperCase() + rol.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button type="submit" disabled={!isUserFormValid} className={`flex-1 font-bold uppercase tracking-widest py-3 rounded transition-colors ${!isUserFormValid ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-500 shadow-lg'}`}>Guardar</button>
                    <button type="button" onClick={handleUserClear} className="flex-1 bg-white/10 text-white/80 font-bold uppercase tracking-widest py-3 hover:bg-white/20 transition-colors rounded">Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
            <h3 className="text-xl font-bold text-white">Directorio de Usuarios ({usuariosProcesados.length})</h3>
            <div className="flex gap-2">
              <button onClick={() => { setIsUserEditing(false); setShowUserModal(true); }} className="bg-[#132018] text-white border border-white/30 hover:bg-white/10 hover:border-white/50 shadow-lg font-bold px-5 py-2 rounded-md transition-all">➕ Nuevo Usuario</button>
              <button onClick={exportarPDF} className="bg-red-900/80 text-red-100 border border-red-500/30 hover:bg-red-800 font-bold px-5 py-2 rounded-md transition-all shadow-lg">📄 Exportar a PDF</button>
            </div>
          </div>

          <div className="overflow-x-auto shadow-2xl border border-white/20 rounded-xl bg-white/5 backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0a120e] text-white/90 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortUsers('nombre')}>Nombre {renderSortArrow(sortUsersConfig, 'nombre')}</th>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortUsers('email')}>Email {renderSortArrow(sortUsersConfig, 'email')}</th>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortUsers('rol')}>Rol {renderSortArrow(sortUsersConfig, 'rol')}</th>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortUsers('activo')}>Estado {renderSortArrow(sortUsersConfig, 'activo')}</th>
                  <th className="p-4 border-b border-white/10 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosPaginados.map(u => (
                  <tr key={u.id_usuario} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${!u.activo ? 'opacity-50' : ''}`}>
                    <td className="p-4 font-semibold text-white">{u.nombre} {currentUser.id === u.id_usuario && <span className="ml-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Tú</span>}</td>
                    <td className="p-4 text-white/70 text-sm">{u.email}</td>
                    <td className="p-4 uppercase text-xs font-bold tracking-wider text-green-400">{u.rol}</td>
                    <td className="p-4">
                      <span className={u.activo ? "bg-green-500/20 text-green-300 border border-green-500/30 px-2.5 py-1 rounded text-xs font-bold tracking-wide" : "bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-1 rounded text-xs font-bold tracking-wide"}>{u.activo ? 'ACTIVO' : 'INACTIVO'}</span>
                    </td>
                    <td className="p-4 flex justify-center gap-2 items-center h-full">
                      <button onClick={() => handleUserEdit(u)} className="bg-yellow-600/80 text-yellow-100 border border-yellow-500/50 hover:bg-yellow-500 px-3 py-1.5 text-xs rounded-md font-bold transition-colors">Editar</button>
                      {(currentUser?.rol === 'admin' || currentUser?.rol === 'gerente') && <button onClick={() => handleResetPassword(u.id_usuario)} className="bg-purple-900/80 text-purple-100 border border-purple-500/50 hover:bg-purple-800 px-3 py-1.5 text-xs rounded-md font-bold transition-colors">Reset Pass</button>}
                      <button onClick={() => handleUserToggleStatus(u)} disabled={currentUser.id === u.id_usuario} className={`px-3 py-1.5 text-xs rounded-md font-bold transition-colors border ${currentUser.id === u.id_usuario ? 'bg-white/10 text-white/30 border-transparent cursor-not-allowed' : (u.activo ? 'bg-red-900/80 text-red-100 border-red-500/50 hover:bg-red-800' : 'bg-green-900/80 text-green-100 border-green-500/50 hover:bg-green-800')}`}>
                        {u.activo ? 'Inhabilitar' : 'Habilitar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls totalItems={usuariosProcesados.length} currentPage={currentPageUser} setCurrentPage={setCurrentPageUser} />
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VISTA: AUDITORÍA */}
      {/* ========================================== */}
      {activeTab === 'auditoria' && (
        <div className="animate-fade-in">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
            <h3 className="text-xl font-bold text-white">Registro de Actividad ({logsProcesados.length})</h3>
            <div className="flex gap-2">
              <button onClick={cargarLogs} className="bg-[#132018] text-white border border-white/30 hover:bg-white/10 hover:border-white/50 shadow-lg font-bold px-5 py-2 rounded-md transition-all">🔄 Refrescar</button>
              <button onClick={exportarPDF} className="bg-red-900/80 text-red-100 border border-red-500/30 hover:bg-red-800 font-bold px-5 py-2 rounded-md transition-all shadow-lg">📄 Exportar a PDF</button>
            </div>
          </div>
          
          <div className="overflow-x-auto shadow-2xl border border-white/20 rounded-xl bg-white/5 backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0a120e] text-white/90 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 border-b border-white/10 w-48 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortLogs('fecha')}>Fecha y Hora {renderSortArrow(sortLogsConfig, 'fecha')}</th>
                  <th className="p-4 border-b border-white/10 w-48 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortLogs('autor')}>Autor {renderSortArrow(sortLogsConfig, 'autor')}</th>
                  <th className="p-4 border-b border-white/10 w-32 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortLogs('accion')}>Acción {renderSortArrow(sortLogsConfig, 'accion')}</th>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortLogs('detalles')}>Detalles {renderSortArrow(sortLogsConfig, 'detalles')}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {logsPaginados.length > 0 ? logsPaginados.map(log => (
                  <tr key={log.id_log} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 whitespace-nowrap text-white/60 font-medium">{new Date(log.fecha).toLocaleString()}</td>
                    <td className="p-4"><div className="font-bold text-white">{log.autor || 'Sistema'}</div><div className="text-xs text-white/50">{log.autor_email || 'N/A'}</div></td>
                    <td className="p-4"><span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded text-xs font-bold tracking-wide uppercase">{log.accion}</span></td>
                    <td className="p-4 text-white/80">{log.detalles}</td>
                  </tr>
                )) : <tr><td colSpan="4" className="p-8 text-center text-white/60 font-medium">No hay registros de auditoría por el momento.</td></tr>}
              </tbody>
            </table>
            <PaginationControls totalItems={logsProcesados.length} currentPage={currentPageLog} setCurrentPage={setCurrentPageLog} />
          </div>
        </div>
      )}

    </div>
  );
}