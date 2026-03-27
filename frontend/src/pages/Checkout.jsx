import { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';

// --- IMPORTACIONES DE STRIPE ---
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_AQUI_PON_TU_LLAVE_SI_FALLA_EL_ENV');

// ==========================================
// COMPONENTE INTERNO: EL FORMULARIO DE PAGO
// ==========================================
// 👇 1. Recibimos las nuevas props aquí 👇
const CheckoutForm = ({ totalGeneral, cartItems, userId, isFormValid, formData, subtotal, discountPercent, totalDiscount, costoEnvio }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const clearCart = useCartStore((state) => state.clearCart);
  
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
        await fetch('http://localhost:3000/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_usuario: userId === 'guest' ? null : userId,
            total: totalGeneral,
            // 👇 2. Enviamos los datos para la factura congelada en el tiempo 👇
            subtotal_original: subtotal,
            porcentaje_descuento: discountPercent,
            dinero_descontado: totalDiscount,
            costo_envio: costoEnvio,
            items: cartItems,
            datos_envio: formData 
          })
        });
        
        clearCart(userId);
        alert("¡Pago exitoso! Tu pedido ha sido procesado.");
        
        // Redirigimos al historial de compras
        navigate('/mis-compras');
        
      } catch (err) {
        console.error("Error al guardar el pedido:", err);
        alert("Pago exitoso, pero hubo un error guardando el recibo.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <PaymentElement />
      {error && <div className="text-red-600 bg-red-50 p-3 rounded text-sm font-medium">{error}</div>}
      <button 
        disabled={!stripe || isProcessing || !isFormValid} 
        className="w-full bg-black text-white py-4 rounded font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {isProcessing ? 'Procesando Pago...' : `Pagar $${totalGeneral.toFixed(2)}`}
      </button>
      {!isFormValid && (
        <p className="text-sm text-red-500 text-center mt-2">
          Por favor, completa correctamente todos los datos de envío para poder pagar.
        </p>
      )}
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
  
  // ¡MAGIA! Traemos nuestra función de totales inteligentes
  const getCartTotals = useCartStore((state) => state.getCartTotals);
  
  const cartItems = carritosPorUsuario[userId] || [];

  // Reemplazamos el cálculo manual por nuestra función centralizada
  const { subtotal, discountPercent, totalDiscount, finalTotal, promoMessage } = getCartTotals(userId);
  
  // El costo de envío se calcula basado en si hay productos, y se suma al total *después* del descuento
  const costoEnvio = cartItems.length > 0 ? 15.00 : 0;
  const totalGeneral = finalTotal + costoEnvio;

  const [clientSecret, setClientSecret] = useState("");

  // ==========================================
  // ESTADOS Y VALIDACIONES DEL FORMULARIO
  // ==========================================
  const [formData, setFormData] = useState({
    email: user?.email || '',
    nombre: user?.nombre || '',
    direccion: '',
    ciudad: '',
    codigoPostal: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const validateField = (name, value) => {
    let errorMsg = '';
    switch (name) {
      case 'nombre':
      case 'ciudad':
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          errorMsg = 'Solo se permiten letras y espacios.';
        }
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errorMsg = 'Ingresa un correo electrónico válido.';
        }
        break;
      case 'codigoPostal':
        if (!/^\d{4,10}$/.test(value)) {
          errorMsg = 'Debe contener solo números (mínimo 4).';
        }
        break;
      case 'direccion':
        if (/[@;:<>\/\\]/g.test(value)) {
          errorMsg = 'No se permiten caracteres especiales como @ ; : < > / \\';
        }
        break;
      default:
        break;
    }
    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (value.trim() !== '') {
      const error = validateField(name, value);
      setFormErrors({ ...formErrors, [name]: error });
    } else {
      setFormErrors({ ...formErrors, [name]: 'Este campo es obligatorio.' });
    }
  };

  const isFormValid = 
    Object.values(formData).every(value => value.trim() !== '') &&
    Object.values(formErrors).every(error => error === '');

  // ==========================================
  // EFECTO PARA STRIPE
  // ==========================================
  useEffect(() => {
    if (cartItems.length > 0) {
      fetch('http://localhost:3000/api/pagos/crear-intencion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // IMPORTANTE: Le decimos al backend el total con descuento y envío
        body: JSON.stringify({ items: cartItems, montoTotal: totalGeneral }) 
      })
      .then(res => res.json())
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      })
      .catch(err => console.error("Error conectando con el backend de pagos", err));
    }
  }, [cartItems, totalGeneral]); // Se re-ejecuta si el total cambia (por agregar más prendas)

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <h2 className="text-3xl font-bold mb-4">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-8">Agrega algunos productos antes de proceder al pago.</p>
        <Link to="/" className="bg-black text-white px-6 py-3 font-semibold hover:bg-gray-800 transition">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-10">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* COLUMNA IZQUIERDA: FORMULARIOS */}
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">1. Información de Contacto</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 focus:ring-black focus:border-black ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                  placeholder="tu@email.com" 
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
            </section>

            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">2. Dirección de Envío</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={`w-full border rounded p-2 focus:ring-black focus:border-black ${formErrors.nombre ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                  />
                  {formErrors.nombre && <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input 
                    type="text" 
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className={`w-full border rounded p-2 focus:ring-black focus:border-black ${formErrors.direccion ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                    placeholder="Ej. Av. Principal 123" 
                  />
                  {formErrors.direccion && <p className="text-red-500 text-xs mt-1">{formErrors.direccion}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input 
                    type="text" 
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    className={`w-full border rounded p-2 focus:ring-black focus:border-black ${formErrors.ciudad ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                  />
                  {formErrors.ciudad && <p className="text-red-500 text-xs mt-1">{formErrors.ciudad}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                  <input 
                    type="text" 
                    name="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={handleChange}
                    className={`w-full border rounded p-2 focus:ring-black focus:border-black ${formErrors.codigoPostal ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                  />
                  {formErrors.codigoPostal && <p className="text-red-500 text-xs mt-1">{formErrors.codigoPostal}</p>}
                </div>
              </div>
            </section>

            {/* SECCIÓN DE PAGO CON STRIPE */}
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">3. Pago Seguro</h2>
              
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  {/* 👇 3. Pasamos las nuevas props a CheckoutForm 👇 */}
                  <CheckoutForm 
                    totalGeneral={totalGeneral} 
                    cartItems={cartItems} 
                    userId={userId} 
                    isFormValid={isFormValid}
                    formData={formData}
                    subtotal={subtotal}
                    discountPercent={discountPercent}
                    totalDiscount={totalDiscount}
                    costoEnvio={costoEnvio}
                  />
                </Elements>
              ) : (
                <div className="flex justify-center items-center h-32">
                  <p className="text-gray-500 animate-pulse font-medium">Conectando con pasarela de pagos...</p>
                </div>
              )}
            </section>
          </div>

          {/* COLUMNA DERECHA: RESUMEN DEL PEDIDO CON DESCUENTOS VISIBLES */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-10">
              <h2 className="text-xl font-semibold mb-6 border-b pb-2">Resumen del Pedido</h2>
              
              <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={item.id_producto} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <img 
                      src={item.imagen_url || `https://ui-avatars.com/api/?name=${item.nombre}&background=random`} 
                      alt={item.nombre} 
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900 leading-tight mb-2">{item.nombre}</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded border-gray-300">
                          <button type="button" onClick={() => decreaseQuantity(item.id_producto, userId)} className="px-2 py-0.5 bg-gray-50 hover:bg-gray-200">-</button>
                          <span className="px-2 text-sm font-bold">{item.cantidad}</span>
                          <button type="button" onClick={() => addToCart(item, userId)} className="px-2 py-0.5 bg-gray-50 hover:bg-gray-200">+</button>
                        </div>
                        <button type="button" onClick={() => removeFromCart(item.id_producto, userId)} className="text-red-500 text-xs font-bold hover:underline uppercase">Eliminar</button>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 mt-1">
                      ${(Number(item.precio_base) * item.cantidad).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Mensaje de motivación debajo de los productos */}
              {promoMessage && (
                <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm p-3 rounded-md text-center font-bold mb-4">
                  ✨ {promoMessage}
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className={discountPercent > 0 ? "line-through text-gray-400" : ""}>
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                
                {/* Mostrar el descuento en verde si aplica */}
                {discountPercent > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Descuento aplicado ({discountPercent}%)</span>
                    <span>-${totalDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600 border-b pb-3">
                  <span>Envío estándar</span>
                  <span>${costoEnvio.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xl font-black text-gray-900 pt-1">
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