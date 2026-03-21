import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
// 1. IMPORTACIONES CORREGIDAS PARA EL PDF 👇
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// 2. CENTRALIZAMOS LA URL BASE DE LA API
const API_URL = 'http://localhost:3000/api';

export default function AuditorPanel() {
  const currentUser = useAuthStore(state => state.user);
  const [activeTab, setActiveTab] = useState('auditoria');

  // ==========================================
  // ESTADOS GLOBALES (Solo lectura)
  // ==========================================
  const [logs, setLogs] = useState([]);
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // ==========================================
  // CARGA DE DATOS (FETCH)
  // ==========================================
  useEffect(() => {
    if (currentUser?.rol === 'auditor') {
      cargarDatos();
    }
  }, [currentUser]);

  const cargarDatos = async () => {
    try {
      const [resLogs, resProductos, resUsuarios] = await Promise.all([
        fetch(`${API_URL}/auditoria`),
        fetch(`${API_URL}/productos?admin=true`),
        fetch(`${API_URL}/usuarios`)
      ]);

      if (resLogs.ok) setLogs(await resLogs.json());
      if (resProductos.ok) setProductos(await resProductos.json());
      if (resUsuarios.ok) setUsuarios(await resUsuarios.json());
    } catch (error) {
      console.error("Error cargando datos para el auditor:", error);
    }
  };

  // ==========================================
  // EXPORTAR A CSV (Con manejo de errores)
  // ==========================================
  const exportarCSV = () => {
    try {
      if (logs.length === 0) return alert("No hay datos para exportar.");
      
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "ID Log,Fecha,Autor,Email Autor,Accion,Detalles\n";

      logs.forEach(log => {
        const fecha = new Date(log.fecha).toLocaleString().replace(',', '');
        const autor = log.autor ? log.autor.replace(/,/g, '') : 'Sistema';
        const email = log.autor_email || 'N/A';
        const detalles = log.detalles.replace(/,/g, ';'); // Evitar comas en los detalles
        
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

  // ==========================================
  // EXPORTAR A PDF CORREGIDO 📄
  // ==========================================
  const exportarPDF = () => {
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
        
        // CORRECCIÓN AQUÍ 👇
        autoTable(doc, { 
          startY: 36, 
          head: [columnas], 
          body: filas, 
          theme: 'striped', 
          headStyles: { fillColor: [49, 46, 129] }, // bg-indigo-900
          styles: { fontSize: 8 }
        });
        doc.save(`Auditoria_${new Date().toISOString().split('T')[0]}.pdf`);
        
      } else if (activeTab === 'productos') {
        if (productos.length === 0) return alert("No hay productos para exportar.");
        
        doc.text("Reporte de Inventario (Auditoría)", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
        
        const columnas = ["ID", "Nombre", "Categoría", "Precio Base", "Estado"];
        const filas = productos.map(p => [
          p.id_producto, 
          p.nombre, 
          p.categoria, 
          `$${Number(p.precio_base).toFixed(2)}`, 
          p.activo ? 'Activo' : 'Inactivo'
        ]);
        
        autoTable(doc, { 
          startY: 36, 
          head: [columnas], 
          body: filas, 
          theme: 'striped', 
          headStyles: { fillColor: [31, 41, 55] } // bg-gray-800
        });
        doc.save(`Inventario_Auditoria_${new Date().toISOString().split('T')[0]}.pdf`);
        
      } else if (activeTab === 'usuarios') {
        if (usuarios.length === 0) return alert("No hay usuarios para exportar.");
        
        doc.text("Reporte de Usuarios (Auditoría)", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado el: ${fechaActual} por ${autor}`, 14, 30);
        
        const columnas = ["ID", "Nombre", "Email", "Rol", "Estado"];
        const filas = usuarios.map(u => [
          u.id_usuario, 
          u.nombre, 
          u.email, 
          u.rol.toUpperCase(), 
          u.activo ? 'Activo' : 'Inactivo'
        ]);
        
        autoTable(doc, { 
          startY: 36, 
          head: [columnas], 
          body: filas, 
          theme: 'striped', 
          headStyles: { fillColor: [31, 41, 55] } // bg-gray-800
        });
        doc.save(`Usuarios_Auditoria_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Hubo un problema al generar el PDF. Revisa la consola.");
    }
  };

  // ==========================================
  // SEGURIDAD: PROTECCIÓN DE RUTA
  // ==========================================
  if (!currentUser || currentUser.rol !== 'auditor') {
    return (
      <div className="mt-8 text-center bg-red-50 p-10 rounded-lg border border-red-200 shadow-sm">
        <h2 className="text-3xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
        <p className="text-gray-700 text-lg">Esta área es exclusiva para el rol de Auditoría y Reportería.</p>
      </div>
    );
  }

  // ==========================================
  // VISTA (RENDER)
  // ==========================================
  return (
    <div className="mt-8 bg-gray-50 p-6 rounded-lg border">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-indigo-900">Panel de Auditoría</h2>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('auditoria')} className={`px-4 py-2 font-bold rounded transition-colors ${activeTab === 'auditoria' ? 'bg-indigo-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Registros (Logs)</button>
          <button onClick={() => setActiveTab('productos')} className={`px-4 py-2 font-bold rounded transition-colors ${activeTab === 'productos' ? 'bg-indigo-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Inventario</button>
          <button onClick={() => setActiveTab('usuarios')} className={`px-4 py-2 font-bold rounded transition-colors ${activeTab === 'usuarios' ? 'bg-indigo-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Usuarios</button>
        </div>
      </div>

      {/* VISTA DE AUDITORÍA */}
      {activeTab === 'auditoria' && (
        <div className="bg-white p-4 rounded border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Historial de Actividades</h3>
            <div className="flex gap-2">
              <button onClick={cargarDatos} className="text-sm bg-gray-100 border border-gray-300 px-3 py-2 rounded hover:bg-gray-200 flex items-center gap-1 font-semibold">
                🔄 Actualizar
              </button>
              <button onClick={exportarCSV} className="text-sm bg-green-600 text-white font-bold px-3 py-2 rounded hover:bg-green-700 flex items-center gap-1 shadow-sm">
                📊 Exportar a CSV
              </button>
              <button onClick={exportarPDF} className="text-sm bg-red-600 text-white font-bold px-3 py-2 rounded hover:bg-red-700 flex items-center gap-1 shadow-sm">
                📄 Exportar a PDF
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left bg-white border">
              <thead className="bg-indigo-900 text-white uppercase text-xs">
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
                      <td className="p-3 whitespace-nowrap text-gray-500">{new Date(log.fecha).toLocaleString()}</td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-800">{log.autor || 'Sistema'}</div>
                        <div className="text-xs text-gray-500">{log.autor_email || 'N/A'}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">{log.accion}</span>
                      </td>
                      <td className="p-3 text-gray-700">{log.detalles}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500">No hay registros de auditoría por el momento.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA DE PRODUCTOS (INVENTARIO) */}
      {activeTab === 'productos' && (
        <div className="bg-white p-4 rounded border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Reporte de Inventario (Solo Lectura)</h3>
            <button onClick={exportarPDF} className="text-sm bg-red-600 text-white font-bold px-3 py-2 rounded hover:bg-red-700 flex items-center gap-1 shadow-sm">
              📄 Exportar a PDF
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left bg-white border">
              <thead className="bg-gray-800 text-white uppercase text-sm">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Precio Base</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p.id_producto} className={`border-b hover:bg-gray-50 transition-opacity ${!p.activo ? 'opacity-60 bg-red-50' : ''}`}>
                    <td className="p-3 text-gray-500">#{p.id_producto}</td>
                    <td className="p-3 font-medium">{p.nombre}</td>
                    <td className="p-3">{p.categoria}</td>
                    <td className="p-3">${Number(p.precio_base).toFixed(2)}</td>
                    <td className="p-3 font-bold">
                      <span className={p.activo ? "text-green-600" : "text-red-600"}>{p.activo ? 'Activo' : 'Inactivo'}</span>
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
        <div className="bg-white p-4 rounded border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Reporte de Usuarios (Solo Lectura)</h3>
            <button onClick={exportarPDF} className="text-sm bg-red-600 text-white font-bold px-3 py-2 rounded hover:bg-red-700 flex items-center gap-1 shadow-sm">
              📄 Exportar a PDF
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left bg-white border">
              <thead className="bg-gray-800 text-white uppercase text-sm">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id_usuario} className={`border-b hover:bg-gray-50 transition-opacity ${!u.activo ? 'opacity-60 bg-red-50' : ''}`}>
                    <td className="p-3 text-gray-500">#{u.id_usuario}</td>
                    <td className="p-3 font-medium">{u.nombre}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3 capitalize">{u.rol}</td>
                    <td className="p-3 font-bold">
                      <span className={u.activo ? "text-green-600" : "text-red-600"}>{u.activo ? 'Activo' : 'Inactivo'}</span>
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