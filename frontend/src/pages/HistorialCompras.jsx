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

  // 🔥 EL CADENERO AHORA DEJA PASAR A INVITADOS CON COMPRAS RECIENTES
  useEffect(() => {
    if (!user) {
      const savedGuestOrder = localStorage.getItem('lastGuestOrder');
      if (savedGuestOrder) {
        setPedidos([JSON.parse(savedGuestOrder)]);
        setCargando(false);
      } else {
        // Si no hay usuario Y no hay recibo temporal, de vuelta a la tienda
        navigate('/');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/usuario/${user.id}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Error al cargar el historial');
          return res.json();
        })
        .then((data) => {
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

  const handleDescargarYEnviar = async (pedido) => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.text("RECIBO DE COMPRA", 14, 20);
      doc.setFontSize(10);
      doc.text("Favourite Threads - Tienda Oficial", 14, 28);
      
      doc.setFontSize(11);
      doc.text(`Pedido #: ${pedido.id_pedido?.toString().padStart(6, '0')}`, 14, 40);
      doc.text(`Fecha: ${new Date(pedido.created_at).toLocaleDateString('es-ES')}`, 14, 46);
      
      // 🔥 SOPORTE PARA EL NOMBRE DEL INVITADO
      const nombreCliente = user ? user.nombre : (pedido.envio_nombre_completo || 'Invitado');
      doc.text(`Cliente: ${nombreCliente}`, 14, 52);

      const tableData = pedido.items ? pedido.items.map(item => [
        item.nombre || 'Producto',
        item.cantidad.toString(),
        `$${Number(item.precio || 0).toFixed(2)}`,
        `$${(Number(item.precio || 0) * item.cantidad).toFixed(2)}`
      ]) : [];

      autoTable(doc, {
        startY: 60,
        head: [['Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 0, 0] }
      });

      const finalY = doc.lastAutoTable.finalY || 60;
      
      doc.setFontSize(10);
      const rightX = 140;
      doc.text(`Subtotal:`, rightX, finalY + 10);
      doc.text(`$${Number(pedido.subtotal_original || pedido.total).toFixed(2)}`, 180, finalY + 10);
      
      if (pedido.porcentaje_descuento > 0) {
        doc.setTextColor(200, 0, 0);
        doc.text(`Descuento (${pedido.porcentaje_descuento}%):`, rightX, finalY + 16);
        doc.text(`-$${Number(pedido.dinero_descontado).toFixed(2)}`, 180, finalY + 16);
        doc.setTextColor(0, 0, 0);
      }

      doc.text(`Envío:`, rightX, finalY + 22);
      doc.text(`$${Number(pedido.costo_envio || 0).toFixed(2)}`, 180, finalY + 22);

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`TOTAL PAGADO:`, rightX, finalY + 32);
      doc.text(`$${Number(pedido.total || 0).toFixed(2)}`, 180, finalY + 32);

      doc.save(`Recibo_Bilane_${pedido.id_pedido}.pdf`);

      // 🔥 SOPORTE PARA ENVIAR CORREO A INVITADO
      const correoDestino = user ? user.email : pedido.email_destino;
      if (correoDestino) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/enviar-recibo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_pedido: pedido.id_pedido, email_destino: correoDestino })
        });
      }

    } catch (error) {
      console.error("Error:", error);
      alert("Recibo descargado localmente.");
    }
  };

  if (cargando) return <div className="min-h-screen flex items-center justify-center font-bold bg-[#faf9f8] dark:bg-gray-900 dark:text-white transition-colors duration-300">Cargando...</div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-10 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-black mb-8 dark:text-white">MIS COMPRAS</h1>

        {/* 🔥 MENSAJE ESPECIAL PARA INVITADOS */}
        {!user && pedidos.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">
              ℹ️ Estás viendo el comprobante de tu compra como invitado. Crea una cuenta para guardar el historial de todos tus pedidos futuros.
            </p>
          </div>
        )}

        <div className="space-y-8">
          {pedidos.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Aún no has realizado ninguna compra.</p>
              <Link to="/" className="mt-4 inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-2 font-bold uppercase tracking-widest text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                Ir a la tienda
              </Link>
            </div>
          ) : (
            pedidos.map((pedido) => (
              <div key={pedido.id_pedido} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors">
                
                {/* CABECERA */}
                <div className="bg-gray-900 dark:bg-black text-white p-4 flex justify-between items-center border-b dark:border-gray-800">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-bold">N° Pedido</p>
                      <p className="font-mono">#{pedido.id_pedido.toString().padStart(6, '0')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-bold">Fecha</p>
                      <p>{new Date(pedido.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="bg-green-500 dark:bg-green-600 text-white text-[10px] px-2 py-1 rounded font-black uppercase shadow-sm">
                    {pedido.estado}
                  </span>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* PRODUCTOS */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold border-b dark:border-gray-800 pb-2 text-sm uppercase tracking-widest dark:text-gray-300">Artículos</h3>
                    {pedido.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <img 
                          src={item.imagen_url || `https://ui-avatars.com/api/?name=${item.nombre}&background=random`} 
                          alt={item.nombre || "Producto"} 
                          className="w-14 h-14 object-cover rounded shadow-sm border dark:border-gray-700" 
                        />
                        <div className="flex-1">
                          <p className="font-bold text-sm dark:text-white">{item.nombre}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Cantidad: {item.cantidad}</p>
                        </div>
                        <p className="font-bold dark:text-white">${(item.precio * item.cantidad).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* RESUMEN DE PAGO DETALLADO */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-center dark:text-gray-300">Resumen de Pago</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                        <span className="dark:text-gray-200">${Number(pedido.subtotal_original || pedido.total).toFixed(2)}</span>
                      </div>
                      
                      {pedido.porcentaje_descuento > 0 && (
                        <div className="flex justify-between text-red-600 dark:text-red-400 font-medium">
                          <span>Descuento ({pedido.porcentaje_descuento}%)</span>
                          <span>-${Number(pedido.dinero_descontado).toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Envío</span>
                        <span className="dark:text-gray-200">${Number(pedido.costo_envio || 0).toFixed(2)}</span>
                      </div>

                      <div className="border-t border-gray-300 dark:border-gray-600 my-2 pt-2 flex justify-between font-black text-lg">
                        <span className="dark:text-white">Total</span>
                        <span className="text-black dark:text-white">${Number(pedido.total).toFixed(2)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDescargarYEnviar(pedido)}
                      className="w-full mt-6 bg-black dark:bg-white text-white dark:text-black text-xs font-bold py-3 rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors uppercase tracking-widest shadow-md"
                    >
                      Descargar Recibo 📄
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}