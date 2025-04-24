const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')


router.get('/',seguridad(),listar)
router.post('/insert',seguridad(),agregarCotizaciones)
router.post('/update',seguridad(),modificarCotizaciones)

async function listar (req, res, next){
    try {
        const cotizacion = await controlador.listar();
        
        respuesta.success(req, res, cotizacion, 200);
    } catch (err) {
        next(err);
    }
}

async function agregarCotizaciones (req, res, next){
    try {
        let message = 'Procesado';
        const cotizaciones = req.body;

        for (c in cotizaciones){
            await controlador.agregarCotizacion(cotizaciones[c]);
        }

        respuesta.success(req, res, message, 201);
    } catch (err) {
        next(err);
    }
}

async function modificarCotizaciones (req, res, next){
    try {
        let message = 'Procesado';
        const cotizaciones = req.body;

        for (c in cotizaciones){
            await controlador.modificarCotizacion(cotizaciones[c]);
        }

        respuesta.success(req, res, message, 201);
    } catch (err) {
        next(err);
    }
}

module.exports = router;