import { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';

// --- IMPORTAMOS JSPDF PARA EL RECIBO AUTOMÁTICO ---
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- IMPORTACIONES DE STRIPE ---
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_AQUI_PON_TU_LLAVE_SI_FALLA_EL_ENV');

// ==========================================
// COMPONENTE INTERNO: EL FORMULARIO DE PAGO
// ==========================================
const CheckoutForm = ({ totalGeneral, cartItems, userId, isFormValid, formData, subtotal, discountPercent, totalDiscount, costoEnvio }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const clearCart = useCartStore((state) => state.clearCart);
  
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🔥 FUNCIÓN PARA GENERAR PDF AL INSTANTE
  const generarPDFInvitado = (pedido) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("RECIBO DE COMPRA", 14, 20);
    doc.setFontSize(10);
    doc.text("Favourite Threads - Tienda Oficial", 14, 28);
    
    doc.setFontSize(11);
    doc.text(`Pedido #: ${pedido.id_pedido}`, 14, 40);
    doc.text(`Fecha: ${new Date(pedido.created_at).toLocaleDateString('es-ES')}`, 14, 46);
    doc.text(`Cliente: ${pedido.envio_nombre_completo}`, 14, 52);

    const tableData = pedido.items.map(item => [
      item.nombre,
      item.cantidad.toString(),
      `$${Number(item.precio_base || item.precio).toFixed(2)}`,
      `$${(Number(item.precio_base || item.precio) * item.cantidad).toFixed(2)}`
    ]);

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
    doc.text(`$${Number(pedido.subtotal_original).toFixed(2)}`, 180, finalY + 10);
    
    if (pedido.porcentaje_descuento > 0) {
      doc.setTextColor(200, 0, 0);
      doc.text(`Descuento (${pedido.porcentaje_descuento}%):`, rightX, finalY + 16);
      doc.text(`-$${Number(pedido.dinero_descontado).toFixed(2)}`, 180, finalY + 16);
      doc.setTextColor(0, 0, 0);
    }

    doc.text(`Envío:`, rightX, finalY + 22);
    doc.text(`$${Number(pedido.costo_envio).toFixed(2)}`, 180, finalY + 22);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL PAGADO:`, rightX, finalY + 32);
    doc.text(`$${Number(pedido.total).toFixed(2)}`, 180, finalY + 32);

    doc.save(`Recibo_Bilane_${pedido.id_pedido}.pdf`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', 
    });

    if (stripeError) {
      setError(stripeError.message);
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        const response = await fetch('http://localhost:3000/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_usuario: userId === 'guest' ? null : userId,
            total: totalGeneral,
            subtotal_original: subtotal,
            porcentaje_descuento: discountPercent,
            dinero_descontado: totalDiscount,
            costo_envio: costoEnvio,
            items: cartItems,
            datos_envio: formData 
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "El servidor rechazó el pedido");
        }
        
        const dataBackend = await response.json().catch(() => ({})); 

        if (userId === 'guest') {
          const guestOrder = {
            id_pedido: dataBackend.id_pedido || dataBackend.id || Date.now().toString().slice(-6),
            created_at: new Date().toISOString(),
            estado: 'pagado',
            items: cartItems,
            subtotal_original: subtotal,
            porcentaje_descuento: discountPercent,
            dinero_descontado: totalDiscount,
            costo_envio: costoEnvio,
            total: totalGeneral,
            envio_nombre_completo: formData.nombre,
            email_destino: formData.email
          };
          localStorage.setItem('lastGuestOrder', JSON.stringify(guestOrder));

          // 🔥 MAGIA AQUÍ: Preguntamos si quiere descargar y generamos el PDF
          const quiereDescargar = window.confirm("¡Pago exitoso! Tu pedido ha sido procesado correctamente.\n\n¿Deseas descargar tu recibo de compra en formato PDF ahora mismo?");
          if (quiereDescargar) {
            generarPDFInvitado(guestOrder);
          }
        } else {
          alert("¡Pago exitoso! Tu pedido ha sido procesado.");
        }

        clearCart(userId);
        navigate('/mis-compras');
        
      } catch (err) {
        console.error("❌ Error CRÍTICO al guardar el pedido:", err);
        alert(`Tu tarjeta fue cobrada, pero hubo un error en la tienda: ${err.message}. Contacta a soporte.`);
        setIsProcessing(false); 
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <div className="p-4 bg-gray-50 dark:bg-white rounded-md"> 
        <PaymentElement />
      </div>
      {error && <div className="text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 p-3 rounded text-sm font-medium">{error}</div>}
      <button disabled={!stripe || isProcessing || !isFormValid} className="w-full bg-black text-white dark:bg-white dark:text-black py-4 rounded font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-400 disabled:dark:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-md">
        {isProcessing ? 'Procesando Pago...' : `Pagar $${totalGeneral.toFixed(2)}`}
      </button>
      {!isFormValid && <p className="text-sm text-red-500 dark:text-red-400 text-center mt-2 font-medium">Por favor, completa correctamente todos los datos de envío.</p>}
    </form>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL: CHECKOUT
// ==========================================
export default function Checkout() {
  const user = useAuthStore((state) => state.user);
  const userId = user ? user.id : 'guest';
  
  const carritosPorUsuario = useCartStore((state) => state.carritosPorUsuario);
  const addToCart = useCartStore((state) => state.addToCart);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const getCartTotals = useCartStore((state) => state.getCartTotals);
  
  const cartItems = carritosPorUsuario[userId] || [];
  const { subtotal, discountPercent, totalDiscount, finalTotal, promoMessage } = getCartTotals(userId);
  const costoEnvio = cartItems.length > 0 ? 15.00 : 0;
  const totalGeneral = finalTotal + costoEnvio;

  const [clientSecret, setClientSecret] = useState("");

  const [formData, setFormData] = useState({
    email: user?.email || '', nombre: user?.nombre || '', direccion: '', ciudad: '', codigoPostal: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const validateField = (name, value) => {
    let errorMsg = '';
    switch (name) {
      case 'nombre': case 'ciudad': if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) errorMsg = 'Solo se permiten letras y espacios.'; break;
      case 'email': if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errorMsg = 'Ingresa un correo válido.'; break;
      case 'codigoPostal': if (!/^\d{4,10}$/.test(value)) errorMsg = 'Debe contener solo números.'; break;
      case 'direccion': if (/[@;:<>\/\\]/g.test(value)) errorMsg = 'Caracteres especiales no permitidos.'; break;
      default: break;
    }
    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value.trim() !== '') setFormErrors({ ...formErrors, [name]: validateField(name, value) });
    else setFormErrors({ ...formErrors, [name]: 'Este campo es obligatorio.' });
  };

  const isFormValid = Object.values(formData).every(value => value.trim() !== '') && Object.values(formErrors).every(error => error === '');

  useEffect(() => {
    if (cartItems.length > 0) {
      fetch('http://localhost:3000/api/pagos/crear-intencion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cartItems, montoTotal: totalGeneral }) 
      }).then(res => res.json()).then(data => { if (data.clientSecret) setClientSecret(data.clientSecret); }).catch(err => console.error(err));
    }
  }, [cartItems, totalGeneral]);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 transition-colors duration-300">
        <h2 className="text-3xl font-bold mb-4 dark:text-white">Tu carrito está vacío</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Agrega algunos productos antes de proceder al pago.</p>
        <Link to="/" className="bg-black text-white dark:bg-white dark:text-black px-6 py-3 font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-md">Volver a la tienda</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-10">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
              <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-800 pb-2 dark:text-white">1. Información de Contacto</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full border rounded p-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white dark:bg-gray-800 dark:text-white outline-none transition-colors ${formErrors.email ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-700'}`} placeholder="tu@email.com" />
                {formErrors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.email}</p>}
              </div>
            </section>

            <section className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
              <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-800 pb-2 dark:text-white">2. Dirección de Envío</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className={`w-full border rounded p-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white dark:bg-gray-800 dark:text-white outline-none transition-colors ${formErrors.nombre ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-700'}`} />
                  {formErrors.nombre && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.nombre}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className={`w-full border rounded p-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white dark:bg-gray-800 dark:text-white outline-none transition-colors ${formErrors.direccion ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-700'}`} placeholder="Ej. Av. Principal 123" />
                  {formErrors.direccion && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.direccion}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ciudad</label>
                  <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} className={`w-full border rounded p-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white dark:bg-gray-800 dark:text-white outline-none transition-colors ${formErrors.ciudad ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-700'}`} />
                  {formErrors.ciudad && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.ciudad}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código Postal</label>
                  <input type="text" name="codigoPostal" value={formData.codigoPostal} onChange={handleChange} className={`w-full border rounded p-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white dark:bg-gray-800 dark:text-white outline-none transition-colors ${formErrors.codigoPostal ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-700'}`} />
                  {formErrors.codigoPostal && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.codigoPostal}</p>}
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
              <h2 className="text-xl font-semibold mb-4 border-b dark:border-gray-800 pb-2 dark:text-white">3. Pago Seguro</h2>
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm totalGeneral={totalGeneral} cartItems={cartItems} userId={userId} isFormValid={isFormValid} formData={formData} subtotal={subtotal} discountPercent={discountPercent} totalDiscount={totalDiscount} costoEnvio={costoEnvio} />
                </Elements>
              ) : (
                <div className="flex justify-center items-center h-32"><p className="text-gray-500 dark:text-gray-400 animate-pulse font-medium">Conectando con pasarela de pagos...</p></div>
              )}
            </section>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 sticky top-10 transition-colors">
              <h2 className="text-xl font-semibold mb-6 border-b dark:border-gray-800 pb-2 dark:text-white">Resumen del Pedido</h2>
              <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id_producto} className="flex items-start gap-4 pb-4 border-b dark:border-gray-800 last:border-0">
                    <img src={item.imagen_url || `https://ui-avatars.com/api/?name=${item.nombre}&background=random`} alt={item.nombre || "Producto"} className="w-14 h-14 object-cover rounded shadow-sm border dark:border-gray-700" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-2">{item.nombre}</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded border-gray-300 dark:border-gray-700 overflow-hidden">
                          <button type="button" onClick={() => decreaseQuantity(item.id_producto, userId)} className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">-</button>
                          <span className="px-2 text-sm font-bold dark:text-white dark:bg-gray-900">{item.cantidad}</span>
                          <button type="button" onClick={() => addToCart(item, userId)} className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">+</button>
                        </div>
                        <button type="button" onClick={() => removeFromCart(item.id_producto, userId)} className="text-red-500 dark:text-red-400 text-xs font-bold hover:underline uppercase">Eliminar</button>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">${(Number(item.precio_base || item.precio) * item.cantidad).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {promoMessage && <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm p-3 rounded-md text-center font-bold mb-4 transition-colors">✨ {promoMessage}</div>}

              <div className="border-t dark:border-gray-800 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span className={discountPercent > 0 ? "line-through text-gray-400 dark:text-gray-600" : "dark:text-gray-300"}>${subtotal.toFixed(2)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 font-bold">
                    <span>Descuento aplicado ({discountPercent}%)</span>
                    <span>-${totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400 border-b dark:border-gray-800 pb-3">
                  <span>Envío estándar</span>
                  <span className="dark:text-gray-300">${costoEnvio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-gray-900 dark:text-white pt-1">
                  <span>Total</span>
                  <span>${totalGeneral.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}