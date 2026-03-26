import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

export default function HistorialCompras() {
  const user = useAuthStore((state) => state.user);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Si no hay usuario logueado, no hacemos la petición
    if (!user) {
      setCargando(false);
      return;
    }

    fetch(`http://localhost:3000/api/pedidos/usuario/${user.id}`)
      .then(res => res.json())
      .then(data => {
        // BLINDAJE: Verificamos si la respuesta es realmente un arreglo
        if (Array.isArray(data)) {
          setPedidos(data);
        } else {
          console.error("El servidor respondió con un error:", data);
          setPedidos([]); 
        }
        setCargando(false);
      })
      .catch(err => {
        console.error("Error cargando historial:", err);
        setPedidos([]); 
        setCargando(false);
      });
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold mb-4">Inicia sesión para ver tu historial</h2>
        <Link to="/login" className="bg-black text-white px-6 py-2 rounded">Ir al Login</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Mi Historial de Compras</h1>

        {cargando ? (
          <p>Cargando tus pedidos...</p>
        ) : pedidos.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-lg shadow-sm border border-gray-100">
            <p className="text-gray-500 mb-4">Aún no has realizado ninguna compra.</p>
            <Link to="/" className="text-black font-bold underline">Ir a la tienda</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {pedidos.map((pedido) => (
              <div key={pedido.id_pedido} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                
                {/* Cabecera del pedido */}
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Pedido realizado el: <span className="font-semibold text-gray-900">{new Date(pedido.created_at).toLocaleDateString()}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">ID del Pedido: #{pedido.id_pedido}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-gray-900">${Number(pedido.total).toFixed(2)}</p>
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold mt-1">
                      {pedido.estado}
                    </span>
                  </div>
                </div>

                {/* Lista de productos en ese pedido */}
                <div className="space-y-4">
                  {pedido.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <img 
                        src={item.imagen_url || `https://ui-avatars.com/api/?name=${item.nombre}&background=random`} 
                        alt={item.nombre} 
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{item.nombre}</p>
                        {/* Aquí mostramos el color y la talla */}
                        <p className="text-xs text-gray-500 uppercase">{item.color} - {item.talla}</p>
                        <p className="text-sm text-gray-600 mt-1">Cant: {item.cantidad}</p>
                      </div>
                      <p className="font-semibold text-gray-700">
                        ${(Number(item.precio) * item.cantidad).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}