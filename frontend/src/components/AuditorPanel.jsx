import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = 'http://localhost:3000/api';

export default function AuditorPanel() {
  const currentUser = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  
  const [activeTab, setActiveTab] = useState('auditoria');

  const [logs, setLogs] = useState([]);
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    if (currentUser?.rol === 'auditor' || currentUser?.rol === 'admin') {
      cargarDatos();
    }
  }, [currentUser, token]);

  const cargarDatos = async () => {
    try {
      const opcionesFetch = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      };

      const [resLogs, resProductos, resUsuarios, resVentas] = await Promise.all([
        fetch(`${API_URL}/auditoria`, opcionesFetch),
        fetch(`${API_URL}/productos?admin=true`, opcionesFetch),
        fetch(`${API_URL}/usuarios`, opcionesFetch),
        fetch(`${API_URL}/pedidos`, opcionesFetch)
      ]);

      if (resLogs.ok) setLogs(await resLogs.json());
      if (resProductos.ok) setProductos(await resProductos.json());
      if (resUsuarios.ok) setUsuarios(await resUsuarios.json());
      if (resVentas.ok) setVentas(await resVentas.json());
      
    } catch (error) {
      console.error("Error cargando datos para el auditor:", error);
    }
  };

  const exportarCSV = () => {
    try {
      if (logs.length === 0) return alert("No hay datos para exportar.");
      
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "ID Log,Fecha,Autor,Email Autor,Accion,Detalles\n";

      logs.forEach(log => {
        const fecha = new Date(log.fecha).toLocaleString().replace(',', '');
        const autor = log.autor ? log.autor.replace(/,/g, '') : 'Sistema';
        const email = log.autor_email || 'N/A';
        const detalles = log.detalles.replace(/,/g, ';');
        
        const row = `${log.id_log},${fecha},${autor},${email},${log.accion},${detalles}`;
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Auditoria_Logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exportando a CSV:", error);
      alert("Hubo un problema al generar el archivo CSV.");
    }
  };

  const exportarPDF = () => {
    // ... (El código de jsPDF se mantiene exactamente igual, no afecta al modo oscuro de la web)
    try {
      const doc = new jsPDF();
      const fechaActual = new Date().toLocaleString();
      const autor = currentUser?.nombre || 'Auditor';
      
      doc.setFontSize(18);
      
      if (activeTab === 'auditoria') {
        if (logs.length === 0) return alert("No hay registros para exportar.");
        doc.text("Reporte de Auditoría - Historial de Actividades", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
        const columnas = ["Fecha", "Autor", "Acción", "Detalles"];
        const filas = logs.map(log => [
          new Date(log.fecha).toLocaleString(),
          `${log.autor || 'Sistema'} \n(${log.autor_email || 'N/A'})`,
          log.accion,
          log.detalles
        ]);
        autoTable(doc, { startY: 36, head: [columnas], body: filas, theme: 'striped', headStyles: { fillColor: [49, 46, 129] }, styles: { fontSize: 8 } });
        doc.save(`Auditoria_Logs_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (activeTab === 'productos') {
        if (productos.length === 0) return alert("No hay productos para exportar.");
        doc.text("Reporte de Inventario (Auditoría)", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
        const columnas = ["ID", "Nombre", "Categoría", "Precio Base", "Estado"];
        const filas = productos.map(p => [p.id_producto, p.nombre, p.categoria, `$${Number(p.precio_base).toFixed(2)}`, p.activo ? 'Activo' : 'Inactivo']);
        autoTable(doc, { startY: 36, head: [columnas], body: filas, theme: 'striped', headStyles: { fillColor: [31, 41, 55] } });
        doc.save(`Auditoria_Inventario_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (activeTab === 'usuarios') {
        if (usuarios.length === 0) return alert("No hay usuarios para exportar.");
        doc.text("Reporte de Usuarios (Auditoría)", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
        const columnas = ["ID", "Nombre", "Email", "Rol", "Estado"];
        const filas = usuarios.map(u => [u.id_usuario, u.nombre, u.email, u.rol.toUpperCase(), u.activo ? 'Activo' : 'Inactivo']);
        autoTable(doc, { startY: 36, head: [columnas], body: filas, theme: 'striped', headStyles: { fillColor: [31, 41, 55] } });
        doc.save(`Auditoria_Usuarios_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (activeTab === 'ventas') { 
        if (ventas.length === 0) return alert("No hay ventas para exportar.");
        doc.text("Reporte de Ventas y Transacciones (Auditoría)", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
        const columnas = ["ID Pedido", "Fecha", "Cliente", "Total", "Estado"];
        const filas = ventas.map(v => [String(v.id_pedido).substring(0, 8) + "...", new Date(v.fecha_pedido).toLocaleString(), v.envio_nombre_completo || 'Cliente Registrado', `$${Number(v.total).toFixed(2)}`, v.estado.toUpperCase()]);
        autoTable(doc, { startY: 36, head: [columnas], body: filas, theme: 'striped', headStyles: { fillColor: [16, 185, 129] } });
        doc.save(`Auditoria_Ventas_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Hubo un problema al generar el PDF. Revisa la consola.");
    }
  };

  if (!currentUser || (currentUser.rol !== 'auditor' && currentUser.rol !== 'admin')) {
    return (
      <div className="mt-8 text-center bg-red-50 dark:bg-red-900/20 p-10 rounded-lg border border-red-200 dark:border-red-800 shadow-sm max-w-2xl mx-auto transition-colors">
        <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">Acceso Denegado 🛑</h2>
        <p className="text-gray-700 dark:text-gray-300 text-lg">Esta área es estrictamente exclusiva para los roles de Auditoría y Administración.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-gray-50 dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
      
      {/* NAVEGACIÓN DE PESTAÑAS */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b dark:border-gray-800 pb-4 gap-4 overflow-x-auto">
        <h2 className="text-2xl font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-400 whitespace-nowrap">Panel de Auditoría</h2>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('auditoria')} className={`px-4 py-2 font-bold rounded transition-colors whitespace-nowrap ${activeTab === 'auditoria' ? 'bg-indigo-900 dark:bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>Registros (Logs)</button>
          <button onClick={() => setActiveTab('ventas')} className={`px-4 py-2 font-bold rounded transition-colors whitespace-nowrap ${activeTab === 'ventas' ? 'bg-emerald-600 dark:bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>Registro de Ventas</button>
          <button onClick={() => setActiveTab('productos')} className={`px-4 py-2 font-bold rounded transition-colors whitespace-nowrap ${activeTab === 'productos' ? 'bg-gray-800 dark:bg-gray-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>Inventario</button>
          <button onClick={() => setActiveTab('usuarios')} className={`px-4 py-2 font-bold rounded transition-colors whitespace-nowrap ${activeTab === 'usuarios' ? 'bg-gray-800 dark:bg-gray-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>Usuarios</button>
        </div>
      </div>

      {/* VISTA DE AUDITORÍA (LOGS) */}
      {activeTab === 'auditoria' && (
        <div className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-800 shadow-sm animate-fadeIn transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Historial de Actividades</h3>
            <div className="flex gap-2">
              <button onClick={cargarDatos} className="text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 dark:text-gray-200 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1 font-semibold transition-colors">
                🔄 Actualizar
              </button>
              <button onClick={exportarCSV} className="text-sm bg-green-600 dark:bg-green-700 text-white font-bold px-3 py-2 rounded hover:bg-green-700 dark:hover:bg-green-600 flex items-center gap-1 shadow-sm transition-colors">
                📊 CSV
              </button>
              <button onClick={exportarPDF} className="text-sm bg-red-600 dark:bg-red-700 text-white font-bold px-3 py-2 rounded hover:bg-red-700 dark:hover:bg-red-600 flex items-center gap-1 shadow-sm transition-colors">
                📄 PDF
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left bg-white dark:bg-gray-900">
              <thead className="bg-indigo-900 dark:bg-indigo-950 text-white uppercase text-xs">
                <tr>
                  <th className="p-3 w-48">Fecha y Hora</th>
                  <th className="p-3 w-48">Autor</th>
                  <th className="p-3 w-32">Acción</th>
                  <th className="p-3">Detalles</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-200 dark:divide-gray-800">
                {logs.length > 0 ? logs.map(log => (
                  <tr key={log.id_log} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-3 whitespace-nowrap text-gray-500 dark:text-gray-400">{new Date(log.fecha).toLocaleString()}</td>
                    <td className="p-3">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{log.autor || 'Sistema'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{log.autor_email || 'N/A'}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold px-2 py-1 rounded">{log.accion}</span>
                    </td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{log.detalles}</td>
                  </tr>
                )) : <tr><td colSpan="4" className="p-6 text-center text-gray-500 dark:text-gray-400">No hay registros de auditoría.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA DE VENTAS */}
      {activeTab === 'ventas' && (
        <div className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-800 shadow-sm animate-fadeIn transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Transacciones Financieras</h3>
            <button onClick={exportarPDF} className="text-sm bg-red-600 dark:bg-red-700 text-white font-bold px-3 py-2 rounded hover:bg-red-700 dark:hover:bg-red-600 flex items-center gap-1 shadow-sm transition-colors">
              📄 PDF
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left bg-white dark:bg-gray-900">
              <thead className="bg-emerald-700 dark:bg-emerald-900 text-white uppercase text-sm">
                <tr>
                  <th className="p-3">ID Pedido</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Cliente (Envío)</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {ventas.length > 0 ? ventas.map(v => (
                  <tr key={v.id_pedido} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-3 text-gray-500 dark:text-gray-400 text-xs font-mono" title={v.id_pedido}>{String(v.id_pedido).substring(0, 8)}...</td>
                    <td className="p-3 text-sm dark:text-gray-300">{new Date(v.fecha_pedido).toLocaleString()}</td>
                    <td className="p-3 font-medium dark:text-gray-200">{v.envio_nombre_completo || 'N/A'}</td>
                    <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400">${Number(v.total).toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                        v.estado === 'completado' || v.estado === 'pagado' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800' :
                        v.estado === 'cancelado' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                      }`}>
                        {v.estado}
                      </span>
                    </td>
                  </tr>
                )) : <tr><td colSpan="5" className="p-6 text-center text-gray-500 dark:text-gray-400">No hay ventas registradas.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA DE PRODUCTOS */}
      {activeTab === 'productos' && (
        <div className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-800 shadow-sm animate-fadeIn transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Reporte de Inventario</h3>
            <button onClick={exportarPDF} className="text-sm bg-red-600 dark:bg-red-700 text-white font-bold px-3 py-2 rounded hover:bg-red-700 dark:hover:bg-red-600 flex items-center gap-1 shadow-sm transition-colors">
              📄 PDF
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left bg-white dark:bg-gray-900">
              <thead className="bg-gray-800 dark:bg-black text-white uppercase text-sm">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Precio Base</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {productos.map(p => (
                  <tr key={p.id_producto} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!p.activo ? 'opacity-70 dark:bg-red-900/10' : ''}`}>
                    <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">#{String(p.id_producto).substring(0,8)}</td>
                    <td className="p-3 font-medium dark:text-gray-200">{p.nombre}</td>
                    <td className="p-3 dark:text-gray-300">{p.categoria}</td>
                    <td className="p-3 dark:text-gray-300">${Number(p.precio_base).toFixed(2)}</td>
                    <td className="p-3 font-bold">
                      <span className={p.activo ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{p.activo ? 'Activo' : 'Inactivo'}</span>
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
        <div className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-800 shadow-sm animate-fadeIn transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Reporte de Usuarios</h3>
            <button onClick={exportarPDF} className="text-sm bg-red-600 dark:bg-red-700 text-white font-bold px-3 py-2 rounded hover:bg-red-700 dark:hover:bg-red-600 flex items-center gap-1 shadow-sm transition-colors">
              📄 PDF
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left bg-white dark:bg-gray-900">
              <thead className="bg-gray-800 dark:bg-black text-white uppercase text-sm">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {usuarios.map(u => (
                  <tr key={u.id_usuario} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!u.activo ? 'opacity-70 dark:bg-red-900/10' : ''}`}>
                    <td className="p-3 text-gray-500 dark:text-gray-400 text-xs" title={u.id_usuario}>{String(u.id_usuario).substring(0, 8)}...</td>
                    <td className="p-3 font-medium dark:text-gray-200">{u.nombre}</td>
                    <td className="p-3 dark:text-gray-300">{u.email}</td>
                    <td className="p-3 capitalize dark:text-gray-300">{u.rol}</td>
                    <td className="p-3 font-bold">
                      <span className={u.activo ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{u.activo ? 'Activo' : 'Inactivo'}</span>
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