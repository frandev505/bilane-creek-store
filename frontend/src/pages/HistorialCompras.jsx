import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function HistorialCompras() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Redirigir si no hay usuario (protección de ruta)
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:3000/api/pedidos/usuario/${user.id}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Error al cargar el historial de compras');
          return res.json();
        })
        .then((data) => {
          // CORRECCIÓN 1: Usamos created_at para ordenar
          const pedidosOrdenados = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setPedidos(pedidosOrdenados);
        })
        .catch((err) => {
          console.error(err);
          setError(err.message);
        })
        .finally(() => setCargando(false));
    }
  }, [user]);

  // FUNCIÓN: Genera PDF y manda a llamar al correo
  const handleDescargarYEnviar = async (pedido) => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text("Recibo de Compra - Favourite Threads", 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Pedido #: ${pedido.id_pedido}`, 14, 32);
      // CORRECCIÓN 2: Usamos created_at en el PDF
      doc.text(`Fecha: ${new Date(pedido.created_at).toLocaleDateString('es-ES')}`, 14, 38);
      doc.text(`Cliente: ${pedido.datos_envio?.nombre || user.nombre || 'Cliente'}`, 14, 44);

      const tableData = pedido.items ? pedido.items.map(item => {
        // CORRECCIÓN 3: El precio viene como item.precio
        const precioReal = Number(item.precio || 0);
        
        return [
          item.nombre || 'Producto',
          item.cantidad.toString(),
          `$${precioReal.toFixed(2)}`,
          `$${(precioReal * item.cantidad).toFixed(2)}`
        ];
      }) : [];

      autoTable(doc, {
        startY: 55,
        head: [['Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
        body: tableData,
      });

      const finalY = doc.lastAutoTable.finalY || 55;
      doc.setFontSize(14);
      doc.text(`Total Pagado: $${Number(pedido.total || 0).toFixed(2)}`, 14, finalY + 15);

      doc.save(`Recibo_Pedido_${pedido.id_pedido}.pdf`);

      alert("Descargando PDF... Solicitando envío al correo.");

      const respuesta = await fetch('http://localhost:3000/api/pedidos/enviar-recibo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_pedido: pedido.id_pedido,
          email_destino: user.email 
        })
      });

      if (!respuesta.ok) {
        console.warn("La ruta de envío de correos en el backend aún no está configurada o falló.");
      } else {
        alert("¡Recibo enviado a tu correo exitosamente!");
      }

    } catch (error) {
      console.error("Error en la descarga/envío:", error);
      alert("Se descargó el PDF, pero hubo un problema al contactar al servidor para el correo.");
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-bold animate-pulse text-gray-500">Cargando tu historial...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900">
            Mis Compras
          </h1>
          <Link to="/" className="text-sm font-bold text-gray-500 hover:text-black hover:underline transition">
            &larr; Volver a la tienda
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium mb-6 border border-red-100">
            {error}
          </div>
        )}

        {!cargando && pedidos.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-2xl font-bold mb-2">Aún no tienes compras</h2>
            <p className="text-gray-500 mb-8">Parece que no has realizado ningún pedido todavía.</p>
            <Link to="/" className="bg-black text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-gray-800 transition rounded">
              Explorar Productos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {pedidos.map((pedido) => (
              <div key={pedido.id_pedido} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                
                {/* CABECERA DEL PEDIDO */}
                <div className="bg-gray-100 p-4 sm:px-6 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between gap-4">
                  <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium uppercase tracking-wider text-xs">Fecha del pedido</p>
                      {/* CORRECCIÓN 4: Usamos created_at en la UI */}
                      <p className="font-bold text-gray-900">
                        {new Date(pedido.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium uppercase tracking-wider text-xs">Total</p>
                      <p className="font-bold text-gray-900">${Number(pedido.total || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium uppercase tracking-wider text-xs">N° de Pedido</p>
                      <p className="font-bold text-gray-900">#{pedido.id_pedido?.toString().padStart(6, '0')}</p>
                    </div>
                  </div>
                  
                  {/* ESTADO DEL PEDIDO */}
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      pedido.estado === 'Completado' || pedido.estado === 'pagado' ? 'bg-green-100 text-green-800 border border-green-200' : 
                      pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                      'bg-gray-200 text-gray-800 border border-gray-300'
                    }`}>
                      {pedido.estado || 'Procesado'}
                    </span>
                  </div>
                </div>

                {/* DETALLES Y MÉTODO DE PAGO */}
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* LISTA DE PRODUCTOS */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="font-bold text-gray-900 border-b pb-2">Artículos</h3>
                    {pedido.items && pedido.items.length > 0 ? (
                      pedido.items.map((item, idx) => {
                        // CORRECCIÓN 5: Usamos el nombre real "precio" para la vista
                        const precioRealUI = Number(item.precio || 0);
                        const nombreRealUI = item.nombre || 'Producto';
                        const imagenRealUI = item.imagen_url || `https://ui-avatars.com/api/?name=${nombreRealUI}&background=random`;

                        return (
                          <div key={idx} className="flex gap-4 items-center">
                            <img 
                              src={imagenRealUI} 
                              alt={nombreRealUI} 
                              className="w-16 h-16 object-cover rounded border border-gray-200"
                            />
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 text-sm leading-tight">{nombreRealUI}</p>
                              <p className="text-gray-500 text-xs mt-1">Cantidad: {item.cantidad}</p>
                            </div>
                            <p className="font-bold text-gray-900 text-sm">
                              ${(precioRealUI * item.cantidad).toFixed(2)}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500">Detalles de artículos no disponibles.</p>
                    )}
                  </div>

                  {/* INFORMACIÓN DE PAGO Y ENVÍO */}
                  <div className="bg-gray-50 p-4 rounded border border-gray-100 flex flex-col gap-4">
                    
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-1 uppercase tracking-wider">Método de Pago</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-2xl">💳</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {pedido.metodo_pago ? pedido.metodo_pago : 'Tarjeta (Vía Stripe)'}
                          </p>
                          <p className="text-xs text-green-600 font-bold">Pago verificado ✓</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <h3 className="font-bold text-gray-900 text-sm mb-1 uppercase tracking-wider">Datos de Envío</h3>
                      {pedido.datos_envio ? (
                        <div className="text-sm text-gray-600 space-y-1 mt-2">
                          <p><span className="font-medium text-gray-800">Recibe:</span> {pedido.datos_envio.nombre || user.nombre}</p>
                          <p>{pedido.datos_envio.direccion || 'Dirección no registrada'}</p>
                          <p>{pedido.datos_envio.ciudad || 'Ciudad no registrada'}, CP: {pedido.datos_envio.codigoPostal || 'N/A'}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2">Envío estándar a dirección principal.</p>
                      )}
                    </div>
                    
                  </div>
                </div>

                {/* PIE DE TARJETA / BOTONES DE ACCIÓN */}
                <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200 flex justify-end">
                  <button 
                    onClick={() => handleDescargarYEnviar(pedido)}
                    className="text-sm font-bold text-black border border-black px-4 py-2 rounded hover:bg-black hover:text-white transition"
                  >
                    📄 Descargar y Enviar Recibo
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}