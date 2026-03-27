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

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:3000/api/pedidos/usuario/${user.id}`)
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
      
      // Encabezado
      doc.setFontSize(22);
      doc.text("RECIBO DE COMPRA", 14, 20);
      doc.setFontSize(10);
      doc.text("Favourite Threads - Tienda Oficial", 14, 28);
      
      // Info Pedido
      doc.setFontSize(11);
      doc.text(`Pedido #: ${pedido.id_pedido?.toString().padStart(6, '0')}`, 14, 40);
      doc.text(`Fecha: ${new Date(pedido.created_at).toLocaleDateString('es-ES')}`, 14, 46);
      doc.text(`Cliente: ${user.nombre}`, 14, 52);

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
      
      // Desglose de totales en el PDF
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

      // Intento de envío de correo
      await fetch('http://localhost:3000/api/pedidos/enviar-recibo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pedido: pedido.id_pedido, email_destino: user.email })
      });

    } catch (error) {
      console.error("Error:", error);
      alert("Recibo descargado localmente.");
    }
  };

  if (cargando) return <div className="min-h-screen flex items-center justify-center font-bold">Cargando...</div>;

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-black mb-8">MIS COMPRAS</h1>

        <div className="space-y-8">
          {pedidos.map((pedido) => (
            <div key={pedido.id_pedido} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* CABECERA */}
              <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
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
                <span className="bg-green-500 text-white text-[10px] px-2 py-1 rounded font-black uppercase">
                  {pedido.estado}
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* PRODUCTOS */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-bold border-b pb-2 text-sm uppercase tracking-widest">Artículos</h3>
                  {pedido.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <img src={item.imagen_url} alt="" className="w-14 h-14 object-cover rounded shadow-sm" />
                      <div className="flex-1">
                        <p className="font-bold text-sm">{item.nombre}</p>
                        <p className="text-xs text-gray-500">Cantidad: {item.cantidad}</p>
                      </div>
                      <p className="font-bold">${(item.precio * item.cantidad).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* RESUMEN DE PAGO DETALLADO */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                  <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-center">Resumen de Pago</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>${Number(pedido.subtotal_original || pedido.total).toFixed(2)}</span>
                    </div>
                    
                    {pedido.porcentaje_descuento > 0 && (
                      <div className="flex justify-between text-red-600 font-medium">
                        <span>Descuento ({pedido.porcentaje_descuento}%)</span>
                        <span>-${Number(pedido.dinero_descontado).toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-500">Envío</span>
                      <span>${Number(pedido.costo_envio || 0).toFixed(2)}</span>
                    </div>

                    <div className="border-t border-gray-300 my-2 pt-2 flex justify-between font-black text-lg">
                      <span>Total</span>
                      <span className="text-black">${Number(pedido.total).toFixed(2)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDescargarYEnviar(pedido)}
                    className="w-full mt-6 bg-black text-white text-xs font-bold py-3 rounded hover:bg-gray-800 transition uppercase tracking-widest"
                  >
                    Descargar Recibo 📄
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}