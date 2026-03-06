import { useCartStore } from './store/cartStore';

function Carrito({ volverAlCatalogo }) {
  const { carrito, eliminarDelCarrito } = useCartStore();

  // Calculamos el total multiplicando precio por cantidad de cada producto
  const total = carrito.reduce((suma, item) => suma + (item.precio_base * item.cantidad), 0);

  if (carrito.length === 0) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Tu carrito está vacío 🛒</h2>
        <p style={{ color: '#666', marginTop: '10px' }}>¡Agrega algunos productos de nuestro catálogo!</p>
        <button 
          onClick={volverAlCatalogo} 
          style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <button 
        onClick={volverAlCatalogo} 
        style={{ marginBottom: '20px', padding: '8px 15px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        ← Volver al catálogo
      </button>

      <h2>Resumen de tu compra</h2>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '20px' }}>
        {carrito.map(item => (
          <div key={item.id_producto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0' }}>{item.nombre}</h4>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Cantidad: {item.cantidad} x ${item.precio_base}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                ${(item.precio_base * item.cantidad).toFixed(2)}
              </span>
              <button 
                onClick={() => eliminarDelCarrito(item.id_producto)} 
                style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
              >
                X
              </button>
            </div>
          </div>
        ))}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '22px', fontWeight: 'bold', borderTop: '2px solid #000', paddingTop: '20px' }}>
          <span>Total a pagar:</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <button style={{ width: '100%', padding: '15px', marginTop: '20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
          Proceder al Pago
        </button>
      </div>
    </div>
  );
}

export default Carrito;