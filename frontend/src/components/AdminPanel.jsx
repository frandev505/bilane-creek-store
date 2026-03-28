import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; 

const API_URL = 'http://localhost:3000/api';

export default function AdminPanel() {
  const currentUser = useAuthStore(state => state.user);
  const [activeTab, setActiveTab] = useState('productos');
  const [auditoriaSubTab, setAuditoriaSubTab] = useState('logs'); // 🔥 NUEVO: Sub-pestaña para separar Logs y Ventas

  // ==========================================
  // ESTADOS GLOBALES
  // ==========================================
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [logs, setLogs] = useState([]);
  const [ventas, setVentas] = useState([]); // 🔥 NUEVO: Estado para guardar los pedidos
  
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
  const [sortVentasConfig, setSortVentasConfig] = useState({ key: 'fecha_pedido', direction: 'desc' }); // 🔥 NUEVO

  // ==========================================
  // ESTADOS DE PAGINACIÓN
  // ==========================================
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPageProd, setCurrentPageProd] = useState(1);
  const [currentPageUser, setCurrentPageUser] = useState(1);
  const [currentPageLog, setCurrentPageLog] = useState(1);
  const [currentPageVenta, setCurrentPageVenta] = useState(1); // 🔥 NUEVO

  useEffect(() => setCurrentPageProd(1), [filtros]);

  // ==========================================
  // ESTADOS PARA MODALES Y FORMULARIOS
  // ==========================================
  const [showProductModal, setShowProductModal] = useState(false);
  const [formData, setFormData] = useState({ id_producto: null, nombre: '', precio_base: '', id_categoria: '', imagen_url: '', tipo_venta: 'prefabricado', stock: '' });
  const [isEditing, setIsEditing] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState({ id_usuario: null, nombre: '', email: '', password: '', rol: 'cliente' });
  const [isUserEditing, setIsUserEditing] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false); 

  const rolesDisponibles = ['admin', 'gerente', 'auditor', 'cliente'];

  // ==========================================
  // CARGA DE DATOS (FETCH SEGURO) - CORRECCIÓN 1
  // ==========================================
  const cargarLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/auditoria`);
      if (res.ok) {
        setLogs(await res.json());
      } else {
        console.warn("La ruta /api/auditoria no está disponible en el backend.");
      }
    } catch (error) { console.error("Error de red cargando auditoría:", error); }
  };

  useEffect(() => {
    if (currentUser?.rol === 'admin' || currentUser?.rol === 'gerente') {
      fetch(`${API_URL}/productos?admin=true`)
        .then(res => res.ok ? res.json() : [])
        .then(setProductos)
        .catch(err => console.error("Error al cargar productos", err));

      fetch(`${API_URL}/categorias`)
        .then(res => res.ok ? res.json() : [])
        .then(setCategorias)
        .catch(err => console.error("Error al cargar categorías", err));

      fetch(`${API_URL}/usuarios`)
        .then(res => res.ok ? res.json() : [])
        .then(setUsuarios)
        .catch(err => console.error("Error al cargar usuarios", err));

      // 🔥 NUEVO: Cargar los pedidos/ventas
      fetch(`${API_URL}/pedidos`)
        .then(res => res.ok ? res.json() : [])
        .then(setVentas)
        .catch(err => console.error("Error al cargar ventas", err));

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
      if (sortConfig.key === 'precio_base' || sortConfig.key === 'stock') { aValue = Number(aValue); bValue = Number(bValue); }
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
  // PROCESAMIENTO: AUDITORÍA (LOGS)
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
  // PROCESAMIENTO: AUDITORÍA (VENTAS) 🔥 NUEVO
  // ==========================================
  let ventasProcesadas = [...ventas];
  if (sortVentasConfig.key) {
    ventasProcesadas.sort((a, b) => {
      let aValue = a[sortVentasConfig.key]; let bValue = b[sortVentasConfig.key];
      if (sortVentasConfig.key === 'fecha_pedido' || sortVentasConfig.key === 'created_at') {
        aValue = new Date(aValue || a.created_at).getTime(); 
        bValue = new Date(bValue || b.created_at).getTime();
      } else if (sortVentasConfig.key === 'total') {
        aValue = Number(aValue); bValue = Number(bValue);
      } else {
        aValue = String(aValue || '').toLowerCase(); bValue = String(bValue || '').toLowerCase();
      }
      if (aValue < bValue) return sortVentasConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortVentasConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const handleSortVentas = (key) => {
    let direction = 'asc';
    if (sortVentasConfig.key === key && sortVentasConfig.direction === 'asc') direction = 'desc';
    setSortVentasConfig({ key, direction });
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
  const ventasPaginadas = paginateList(ventasProcesadas, currentPageVenta); // 🔥 NUEVO

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
  const isStockValido = formData.tipo_venta === 'bajo_pedido' ? true : (formData.stock !== '' && Number(formData.stock) >= 0);
  const isProductFormValid = formData.nombre.length > 0 && formData.nombre.length <= 30 && isNombreProductoValido && isPrecioProductoValido && formData.precio_base !== '' && formData.id_categoria !== '' && isStockValido;

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
  // EXPORTAR A PDF (Mejorado para Ventas)
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
        const filas = productosProcesados.map(p => [ 
          p.nombre, 
          p.categoria, 
          `$${Number(p.precio_base).toFixed(2)}`, 
          p.tipo_venta === 'bajo_pedido' ? 'Bajo Pedido' : p.stock, 
          p.activo ? 'Activo' : 'Inactivo' 
        ]);
        autoTable(doc, { startY: 36, head: [["Nombre", "Categoría", "Precio Base", "Stock", "Estado"]], body: filas, theme: 'striped', headStyles: { fillColor: [26, 45, 33] } });
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
        // 🔥 NUEVO: Manejo Inteligente de PDF para Auditoría
        if (auditoriaSubTab === 'logs') {
          if (logsProcesados.length === 0) return alert("No hay registros para exportar.");
          doc.text("Registro de Actividad (Logs)", 14, 22);
          doc.setFontSize(11);
          doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
          const filas = logsProcesados.map(log => [new Date(log.fecha).toLocaleString(), `${log.autor || 'Sistema'}\n(${log.autor_email || 'N/A'})`, log.accion, log.detalles]);
          autoTable(doc, { startY: 36, head: [["Fecha", "Autor", "Acción", "Detalles"]], body: filas, theme: 'striped', headStyles: { fillColor: [26, 45, 33] }, styles: { fontSize: 8 } });
          doc.save(`Auditoria_Logs_${new Date().toISOString().split('T')[0]}.pdf`);
        } else if (auditoriaSubTab === 'ventas') {
          if (ventasProcesadas.length === 0) return alert("No hay ventas para exportar.");
          doc.text("Reporte General de Ventas (Admin)", 14, 22);
          doc.setFontSize(11);
          doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
          const filas = ventasProcesadas.map(v => [
            String(v.id_pedido).substring(0, 8) + "...", 
            new Date(v.created_at || v.fecha_pedido).toLocaleString(),
            v.envio_nombre_completo || 'Cliente Registrado',
            `$${Number(v.total).toFixed(2)}`,
            v.estado.toUpperCase()
          ]);
          autoTable(doc, { startY: 36, head: [["ID Pedido", "Fecha", "Cliente", "Total", "Estado"]], body: filas, theme: 'striped', headStyles: { fillColor: [26, 45, 33] } });
          doc.save(`Auditoria_Ventas_${new Date().toISOString().split('T')[0]}.pdf`);
        }
      }
    } catch (error) { console.error("Error PDF:", error); alert("Problema generando el PDF."); }
  };

  // ==========================================
  // MANEJO FORMULARIO PRODUCTOS
  // ==========================================
  const handleFilterChange = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
  
  const limpiarFiltros = () => { 
    setFiltros({ busqueda: '', categoria: '', precioMin: '', precioMax: '', estado: '' });
    setSortConfig({ key: null, direction: 'asc' }); 
  };

  const handleProductClear = () => { 
    setFormData({ id_producto: null, nombre: '', precio_base: '', id_categoria: '', imagen_url: '', tipo_venta: 'prefabricado', stock: '' });
    setIsEditing(false); 
    setShowProductModal(false); 
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!isProductFormValid) return;
    const url = isEditing ? `${API_URL}/productos/${formData.id_producto}` : `${API_URL}/productos`;
    const method = isEditing ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, nombre: formData.nombre.trim(), precio_base: Number(formData.precio_base), stock: Number(formData.stock || 0), requesterId: currentUser.id })
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
    const cat = categorias.find(c => String(c.nombre).trim().toLowerCase() === String(producto.categoria).trim().toLowerCase());
    setFormData({ 
      id_producto: producto.id_producto, 
      nombre: producto.nombre, 
      precio_base: producto.precio_base, 
      id_categoria: cat ? cat.id_categoria : (producto.id_categoria || ''), 
      imagen_url: producto.imagen_url || '',
      tipo_venta: producto.tipo_venta || 'prefabricado',
      stock: producto.stock || 0 
    });
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
      const response = await fetch(`${API_URL}/usuarios/${id}/reset-password`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          newPassword: 'pass123', 
          requesterRole: currentUser.rol, 
          requesterId: currentUser.id 
        }) 
      });
      
      if (response.ok) { 
        alert("Contraseña reseteada con éxito a 'pass123'.");
        setUsuarios(await fetch(`${API_URL}/usuarios`).then(res => res.json())); 
        cargarLogs(); 
      } else {
        const errorData = await response.json();
        alert("Error al resetear: " + errorData.error);
      }
    } catch (error) { 
      console.error("Error reseteando:", error);
    }
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

      <div className="flex justify-end mb-4 items-center gap-3">
        <label className="text-sm font-semibold text-white/70">Mostrar:</label>
        <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPageProd(1); setCurrentPageUser(1); setCurrentPageLog(1); setCurrentPageVenta(1); }} className="bg-[#ccc] text-black/90 font-medium border-0 p-1.5 px-3 rounded outline-none focus:ring-2 focus:ring-green-500/50">
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
                  
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Precio Base ($)</label>
                      <input type="number" name="precio_base" step="0.01" min="0" onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }} value={formData.precio_base} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} required className={`bg-[#ccc] text-black/90 font-bold placeholder-black/40 p-3 w-full rounded outline-none focus:ring-2 ${!isPrecioProductoValido ? 'ring-red-500' : 'focus:ring-green-500/50'}`} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Categoría</label>
                      <select name="id_categoria" value={formData.id_categoria} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} required className="bg-[#ccc] text-black/90 font-bold p-3 w-full rounded outline-none focus:ring-2 focus:ring-green-500/50">
                        <option value="">Selecciona...</option>
                        {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Tipo de Venta</label>
                      <select name="tipo_venta" value={formData.tipo_venta} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} required className="bg-[#ccc] text-black/90 font-bold p-3 w-full rounded outline-none focus:ring-2 focus:ring-green-500/50" >
                        <option value="prefabricado">Prefabricado (Con Stock)</option>
                        <option value="bajo_pedido">Bajo Pedido (Sin Stock fijo)</option>
                      </select>
                    </div>
                    
                    {formData.tipo_venta === 'prefabricado' && (
                      <div className="flex-1">
                        <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Cantidad Stock</label>
                        <input type="number" name="stock" min="0" onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} value={formData.stock} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} required className="bg-[#ccc] text-black/90 font-bold p-3 w-full rounded outline-none focus:ring-2 focus:ring-green-500/50" placeholder="Ej. 50" />
                      </div>
                    )}
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
              <select name="estado" value={filtros.estado} onChange={handleFilterChange} className="bg-[#ccc] text-black/80 font-medium p-2.5 rounded-md outline-none focus:ring-2 focus:ring-green-500/50 w-full">
                <option value="">Todos los Estados</option>
                <option value="activo">Solo Activos</option>
                <option value="inactivo">Solo Inactivos</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
             <div className="bg-[#1a2d21]/80 text-white/90 border border-white/20 px-6 py-4 rounded-xl shadow-lg inline-block">
               <h3 className="text-lg font-black uppercase tracking-widest text-green-400 mb-1">Inventario</h3>
               <p className="text-xs font-semibold text-white/60">Gestiona los productos y sus existencias.</p>
             </div>
             <div>
               <button onClick={exportarPDF} className="bg-red-900/80 text-red-100 hover:bg-red-800 font-bold px-5 py-2 rounded-md mr-3 transition-all shadow-lg">📄 PDF</button>
               <button onClick={() => { handleProductClear(); setShowProductModal(true); }} className="bg-green-600 text-white hover:bg-green-500 font-bold px-5 py-2 rounded-md transition-all shadow-lg">➕ Nuevo</button>
             </div>
          </div>

          <div className="overflow-x-auto shadow-2xl border border-white/20 rounded-xl bg-white/5 backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0a120e] text-white/90 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 border-b border-white/10">Img</th>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('nombre')}>Nombre {renderSortArrow(sortConfig, 'nombre')}</th>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('categoria')}>Categoría {renderSortArrow(sortConfig, 'categoria')}</th>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('precio_base')}>Precio {renderSortArrow(sortConfig, 'precio_base')}</th>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('stock')}>Stock {renderSortArrow(sortConfig, 'stock')}</th>
                  <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('activo')}>Estado {renderSortArrow(sortConfig, 'activo')}</th>
                  <th className="p-4 border-b border-white/10 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosPaginados.length > 0 ? productosPaginados.map(p => (
                  <tr key={p.id_producto} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${!p.activo ? 'opacity-50' : ''}`}>
                    <td className="p-4"><img src={p.imagen_url || `https://ui-avatars.com/api/?name=${p.nombre}&background=random`} alt={p.nombre} className="w-10 h-10 object-cover rounded-md border border-white/20" /></td>
                    <td className="p-4"><div className="font-semibold text-white">{p.nombre}</div><span className="text-xs text-white/50">{p.tipo_venta === 'bajo_pedido' ? 'Bajo Pedido' : 'Prefabricado'}</span></td>
                    <td className="p-4 text-white/70 text-sm">{p.categoria}</td>
                    <td className="p-4 font-bold text-green-400">${Number(p.precio_base).toFixed(2)}</td>
                    <td className="p-4 font-bold text-lg">{p.tipo_venta === 'bajo_pedido' ? <span className="text-purple-400">∞</span> : <span className={p.stock < 10 ? 'text-red-400' : 'text-white'}>{p.stock}</span>}</td>
                    <td className="p-4"><span className={p.activo ? "bg-green-500/20 text-green-300 border border-green-500/30 px-2.5 py-1 rounded text-xs font-bold tracking-wide" : "bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-1 rounded text-xs font-bold tracking-wide"}>{p.activo ? 'ACTIVO' : 'INACTIVO'}</span></td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleProductEdit(p)} className="bg-blue-900/80 text-blue-100 px-3 py-1.5 rounded mr-2 hover:bg-blue-800 transition-colors border border-blue-500/30 font-bold text-xs uppercase tracking-wider shadow-md">Editar</button>
                      <button onClick={() => handleProductToggleStatus(p)} className="bg-gray-800 text-white/80 px-3 py-1.5 rounded hover:bg-gray-700 transition-colors border border-white/10 font-bold text-xs uppercase tracking-wider shadow-md">{p.activo ? 'Desactivar' : 'Activar'}</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="7" className="p-8 text-center text-white/60 font-medium">No se encontraron productos.</td></tr>}
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
          {showUserModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
              <div className="bg-[#132018] border border-white/20 p-8 rounded-2xl shadow-2xl max-w-lg w-full relative">
                <h3 className="text-2xl font-black uppercase text-white mb-6 border-b border-white/10 pb-4">{isUserEditing ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}</h3>
                <form onSubmit={handleUserSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Nombre Completo</label>
                    <input type="text" name="nombre" value={userFormData.nombre} onChange={(e) => setUserFormData({ ...userFormData, [e.target.name]: e.target.value })} minLength={3} required className={`bg-[#ccc] text-black/90 font-bold p-3 w-full rounded outline-none focus:ring-2 ${!isUserNameValid ? 'ring-red-500' : 'focus:ring-green-500/50'}`} />
                    {!isUserNameValid && <span className="text-xs text-red-400 font-semibold mt-1 block">Solo letras y espacios.</span>}
                  </div>
                  
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Correo Electrónico</label>
                    <input type="email" name="email" value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, [e.target.name]: e.target.value })} required className={`bg-[#ccc] text-black/90 font-bold p-3 w-full rounded outline-none focus:ring-2 ${!isUserEmailValid ? 'ring-red-500' : 'focus:ring-green-500/50'}`} />
                    {!isUserEmailValid && <span className="text-xs text-red-400 font-semibold mt-1 block">Formato inválido.</span>}
                  </div>

                  {!isUserEditing && (
                    <div>
                      <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Contraseña</label>
                      <div className="relative">
                        <input type={showUserPassword ? "text" : "password"} name="password" value={userFormData.password} onChange={(e) => setUserFormData({ ...userFormData, [e.target.name]: e.target.value })} required={!isUserEditing} className={`bg-[#ccc] text-black/90 font-bold p-3 w-full rounded outline-none pr-12 focus:ring-2 ${userFormData.password.length > 0 && !isUserPassValidLocal ? 'ring-red-500' : 'focus:ring-green-500/50'}`} />
                        <button type="button" onClick={() => setShowUserPassword(!showUserPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black font-bold text-xs uppercase">
                          {showUserPassword ? 'Ocultar' : 'Ver'}
                        </button>
                      </div>
                      
                      {userFormData.password.length > 0 && (
                        <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded">
                          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mb-2">
                            <div className={`h-full transition-all duration-300 ${pwColor}`} style={{ width: pwWidth }}></div>
                          </div>
                          <p className={`text-[10px] font-bold text-right mb-2 uppercase ${pwColor.replace('bg-', 'text-')}`}>{pwText}</p>
                          <ul className="grid grid-cols-2 gap-1 text-[10px] uppercase font-bold tracking-tight">
                            <li className={isValidLength ? 'text-green-400' : 'text-white/40'}>{isValidLength ? '✓' : '○'} 6-32 chars</li>
                            <li className={hasUpper ? 'text-green-400' : 'text-white/40'}>{hasUpper ? '✓' : '○'} Mayúscula</li>
                            <li className={hasLower ? 'text-green-400' : 'text-white/40'}>{hasLower ? '✓' : '○'} Minúscula</li>
                            <li className={hasNumber ? 'text-green-400' : 'text-white/40'}>{hasNumber ? '✓' : '○'} Número</li>
                            <li className={hasSpecial ? 'text-green-400' : 'text-white/40'}>{hasSpecial ? '✓' : '○'} Especial</li>
                            <li className={hasNoSpace ? 'text-green-400' : 'text-white/40'}>{hasNoSpace ? '✓' : '○'} Sin Espacios</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-white/60 mb-1 block">Rol del Sistema</label>
                    <select name="rol" value={userFormData.rol} onChange={(e) => setUserFormData({ ...userFormData, [e.target.name]: e.target.value })} required className="bg-[#ccc] text-black/90 font-bold p-3 w-full rounded outline-none focus:ring-2 focus:ring-green-500/50">
                      {rolesDisponibles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
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

          <div className="flex justify-between items-center mb-6">
             <div className="bg-[#1a2d21]/80 text-white/90 border border-white/20 px-6 py-4 rounded-xl shadow-lg inline-block">
               <h3 className="text-lg font-black uppercase tracking-widest text-green-400 mb-1">Directorio de Usuarios</h3>
               <p className="text-xs font-semibold text-white/60">Gestiona accesos y roles del sistema.</p>
             </div>
             <div>
               <button onClick={() => { handleUserClear(); setShowUserModal(true); }} className="bg-green-600 text-white hover:bg-green-500 font-bold px-5 py-2 rounded-md transition-all shadow-lg mr-2">➕ Nuevo</button>
               <button onClick={exportarPDF} className="bg-red-900/80 text-red-100 hover:bg-red-800 font-bold px-5 py-2 rounded-md transition-all shadow-lg">📄 Exportar a PDF</button>
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
                {usuariosPaginados.length > 0 ? usuariosPaginados.map(u => (
                  <tr key={u.id_usuario} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${!u.activo ? 'opacity-50' : ''}`}>
                    <td className="p-4 font-semibold text-white">{u.nombre}</td>
                    <td className="p-4 text-white/70 text-sm">{u.email}</td>
                    <td className="p-4"><span className="bg-white/10 text-white/80 border border-white/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{u.rol}</span></td>
                    <td className="p-4"><span className={u.activo ? "bg-green-500/20 text-green-300 border border-green-500/30 px-2.5 py-1 rounded text-xs font-bold tracking-wide" : "bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-1 rounded text-xs font-bold tracking-wide"}>{u.activo ? 'ACTIVO' : 'INACTIVO'}</span></td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleUserEdit(u)} className="bg-blue-900/80 text-blue-100 px-3 py-1.5 rounded mr-2 hover:bg-blue-800 transition-colors border border-blue-500/30 font-bold text-xs uppercase tracking-wider shadow-md">Editar</button>
                      <button onClick={() => handleUserToggleStatus(u)} className="bg-gray-800 text-white/80 px-3 py-1.5 rounded mr-2 hover:bg-gray-700 transition-colors border border-white/10 font-bold text-xs uppercase tracking-wider shadow-md">{u.activo ? 'Desactivar' : 'Activar'}</button>
                      <button onClick={() => handleResetPassword(u.id_usuario)} className="bg-orange-900/80 text-orange-100 px-3 py-1.5 rounded hover:bg-orange-800 transition-colors border border-orange-500/30 font-bold text-xs uppercase tracking-wider shadow-md">Reset Pass</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="5" className="p-8 text-center text-white/60 font-medium">No se encontraron usuarios.</td></tr>}
              </tbody>
            </table>
            <PaginationControls totalItems={usuariosProcesados.length} currentPage={currentPageUser} setCurrentPage={setCurrentPageUser} />
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VISTA: AUDITORÍA 🔥 NUEVO RENDERING DE PESTAÑAS */}
      {/* ========================================== */}
      {activeTab === 'auditoria' && (
        <div className="animate-fade-in">
          
          <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
             <div className="flex gap-2 bg-[#0a120e]/40 p-1.5 rounded-lg border border-white/5 shadow-md">
                <button 
                  onClick={() => setAuditoriaSubTab('logs')} 
                  className={`px-6 py-2.5 font-bold rounded-md transition-all uppercase tracking-widest text-xs ${auditoriaSubTab === 'logs' ? 'bg-[#1a2d21] text-green-400 shadow-md border border-white/20' : 'bg-transparent text-white/50 hover:bg-white/5 hover:text-white'}`}
                >
                  📋 Logs del Sistema
                </button>
                <button 
                  onClick={() => setAuditoriaSubTab('ventas')} 
                  className={`px-6 py-2.5 font-bold rounded-md transition-all uppercase tracking-widest text-xs ${auditoriaSubTab === 'ventas' ? 'bg-[#1a2d21] text-green-400 shadow-md border border-white/20' : 'bg-transparent text-white/50 hover:bg-white/5 hover:text-white'}`}
                >
                  💰 Transacciones de Ventas
                </button>
             </div>
             <div>
               <button onClick={exportarPDF} className="bg-red-900/80 text-red-100 hover:bg-red-800 font-bold px-5 py-2 rounded-md transition-all shadow-lg text-sm uppercase tracking-widest">📄 Exportar a PDF</button>
             </div>
          </div>

          {/* === SUB-TAB: LOGS === */}
          {auditoriaSubTab === 'logs' && (
            <div className="overflow-x-auto shadow-2xl border border-white/20 rounded-xl bg-white/5 backdrop-blur-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0a120e] text-white/90 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortLogs('fecha')}>Fecha y Hora {renderSortArrow(sortLogsConfig, 'fecha')}</th>
                    <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortLogs('autor')}>Autor {renderSortArrow(sortLogsConfig, 'autor')}</th>
                    <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortLogs('accion')}>Acción {renderSortArrow(sortLogsConfig, 'accion')}</th>
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
          )}

          {/* === SUB-TAB: VENTAS === */}
          {auditoriaSubTab === 'ventas' && (
            <div className="overflow-x-auto shadow-2xl border border-white/20 rounded-xl bg-white/5 backdrop-blur-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0a120e] text-white/90 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortVentas('fecha_pedido')}>Fecha de Compra {renderSortArrow(sortVentasConfig, 'fecha_pedido')}</th>
                    <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortVentas('id_pedido')}>ID Pedido {renderSortArrow(sortVentasConfig, 'id_pedido')}</th>
                    <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortVentas('envio_nombre_completo')}>Cliente {renderSortArrow(sortVentasConfig, 'envio_nombre_completo')}</th>
                    <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortVentas('total')}>Total Pagado {renderSortArrow(sortVentasConfig, 'total')}</th>
                    <th className="p-4 border-b border-white/10 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSortVentas('estado')}>Estado {renderSortArrow(sortVentasConfig, 'estado')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {ventasPaginadas.length > 0 ? ventasPaginadas.map(v => (
                    <tr key={v.id_pedido} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 whitespace-nowrap text-white/70 font-medium">{new Date(v.created_at || v.fecha_pedido).toLocaleString()}</td>
                      <td className="p-4 text-white/50 font-mono text-xs" title={v.id_pedido}>{String(v.id_pedido).substring(0, 8)}...</td>
                      <td className="p-4 font-bold text-white">{v.envio_nombre_completo || 'Cliente Registrado'}</td>
                      <td className="p-4 font-bold text-green-400 text-lg">${Number(v.total).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold tracking-wide uppercase border ${
                          v.estado === 'completado' || v.estado === 'pagado' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                          v.estado === 'cancelado' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        }`}>
                          {v.estado}
                        </span>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="5" className="p-8 text-center text-white/60 font-medium">No hay ventas registradas.</td></tr>}
                </tbody>
              </table>
              <PaginationControls totalItems={ventasProcesadas.length} currentPage={currentPageVenta} setCurrentPage={setCurrentPageVenta} />
            </div>
          )}
        </div>
      )}

    </div>
  );
}