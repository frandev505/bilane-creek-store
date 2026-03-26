const Stripe = require('stripe');
// Inicializamos Stripe con nuestra llave secreta del .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const crearIntencionDePago = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    // 1. CALCULAMOS EL TOTAL EN EL BACKEND (Por seguridad)
    // Nota: En un entorno de producción estricto, aquí buscarías el precio de 
    // cada item.id_producto en tu base de datos para evitar que alteren el precio.
    // Por ahora, calcularemos usando lo que nos mandan para ver la demostración.
    const subtotal = items.reduce((total, item) => {
      return total + (Number(item.precio_base) * item.cantidad);
    }, 0);
    
    const costoEnvio = subtotal > 0 ? 15.00 : 0;
    const totalGeneral = subtotal + costoEnvio;

    // 2. STRIPE TRABAJA EN CENTAVOS
    // Stripe no entiende de decimales. $15.50 se envía como 1550 centavos.
    const amountInCents = Math.round(totalGeneral * 100);

    // 3. CREAMOS LA INTENCIÓN DE PAGO EN STRIPE
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd', // o 'mxn', 'eur', etc.
      // Opcional: puedes mandar metadatos para saber qué compraron
      metadata: {
        integracion: 'bilane_creek_demo'
      }
    });

    // 4. LE DEVOLVEMOS EL SECRETO AL FRONTEND
    res.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error("Error en Stripe:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearIntencionDePago
};