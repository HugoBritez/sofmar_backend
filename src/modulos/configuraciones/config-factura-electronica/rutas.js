const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')

router.get('/', getDatosFactElect)
router.get('/usa-factura-electronica', usaFacturaElectronica)

async function getDatosFactElect (req, res, next){
    try {
        const items = await controlador.getDatosFactElect(req.query.suc, req.query.op);
        respuesta.success(req, res, items,200); 
    } catch (err) {
        next(err);
    }
}

async function usaFacturaElectronica (req, res, next){
    try {
        const items = await controlador.usaFacturaElectronica(req.query.sucursal_id);
        respuesta.success(req, res, items,200); 
    } catch (err) {
        next(err);
    }
}

module.exports = router;