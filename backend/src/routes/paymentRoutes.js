const express = require('express');
const router = express.Router();
const { crearIntencionDePago } = require('../controllers/paymentController');

router.post('/crear-intencion', crearIntencionDePago);

module.exports = router;