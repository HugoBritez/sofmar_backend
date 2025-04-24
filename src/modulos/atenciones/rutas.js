const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')

router.post('/anular', seguridad(), anular)
router.post('/reagendar', seguridad(), reagendar)

async function anular (req, res, next){
    try {
        const items = await controlador.anular(req.query.cod);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

async function reagendar (req, res, next){
    try {
        const items = await controlador.reagendar(req.query.cod, req.query.fch, req.query.hora, req.query.doc, req.query.con);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}


module.exports = router;