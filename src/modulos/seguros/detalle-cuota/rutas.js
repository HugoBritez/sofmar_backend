const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')


router.get('/verifPago', seguridad(), verifPago)

async function verifPago (req, res, next){
    try {
        const beneficiario = req.query.benef;
        const item = await controlador.verifPago(beneficiario);

        respuesta.success(req, res, item, 200);
    } catch (err) {
        next(err);
    }
}

module.exports = router;