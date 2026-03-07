import { useState } from 'react';
import { useCartStore } from './store/cartStore';

// Recibimos la función para volver y los datos del usuario logueado
function Carrito({ volverAlCatalogo, usuario }) {
  const { carrito, eliminarDelCarrito, limpiarCarrito } = useCartStore();
  const [procesando, setProcesando] = useState(false);
  console.log("Datos del usuario logueado:", usuario);

  const total = carrito.reduce((suma, item) => suma + (item.precio_base * item.cantidad), 0);

  const procesarPago = async () => {
    if (!usuario || !usuario.id) {
      alert("Error: No se pudo identificar al usuario.");
      return;
    }

    setProcesando(true);

    try {
      const respuesta = await fetch('http://localhost:3000/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: usuario.id,
          total: total,
          items: carrito // Enviamos todo el arreglo de productos
        })
      });

      const datos = await respuesta.json();

      if (datos.success) {
        alert(`¡Pago exitoso! Tu número de orden es: ${datos.id_pedido.substring(0,8)}...`);
        limpiarCarrito(); // Vaciamos Zustand
        volverAlCatalogo(); // Regresamos al cliente a la tienda
      } else {
        alert("Hubo un problema al procesar el pago.");
      }
    } catch (error) {
      console.error("Error al pagar:", error);
      alert("Error de conexión con el servidor.");
    } finally {
      setProcesando(false);
    }
  };

  if (carrito.length === 0) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Tu carrito está vacío 🛒</h2>
        <p style={{ color: '#666', marginTop: '10px' }}>¡Agrega algunos productos de nuestro catálogo!</p>
        <button onClick={volverAlCatalogo} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <button onClick={volverAlCatalogo} style={{ marginBottom: '20px', padding: '8px 15px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        ← Volver al catálogo
      </button>

      <h2>Resumen de tu compra</h2>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '20px' }}>
        {carrito.map(item => (
          <div key={item.id_producto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0' }}>{item.nombre}</h4>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Cantidad: {item.cantidad} x ${item.precio_base}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>${(item.precio_base * item.cantidad).toFixed(2)}</span>
              <button onClick={() => eliminarDelCarrito(item.id_producto)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                X
              </button>
            </div>
          </div>
        ))}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '22px', fontWeight: 'bold', borderTop: '2px solid #000', paddingTop: '20px' }}>
          <span>Total a pagar:</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <button 
          onClick={procesarPago}
          disabled={procesando}
          style={{ width: '100%', padding: '15px', marginTop: '20px', backgroundColor: procesando ? '#6c757d' : '#28a745', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '18px', fontWeight: 'bold', cursor: procesando ? 'not-allowed' : 'pointer' }}
        >
          {procesando ? 'Procesando pago...' : 'Proceder al Pago'}
        </button>
      </div>
    </div>
  );
}

export default Carrito;