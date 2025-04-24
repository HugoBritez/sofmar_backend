const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')


router.get('/',seguridad(), todos)
router.post('/documento', get_paciente)
router.get('/asegurados', seguridad(), asegurados)
router.get('/validar-aseg', seguridad(), validarAsegurado)


async function todos (req, res, next){
    try {
        const items = await controlador.todos();
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function get_paciente (req, res, next){
    try {
        const items = await controlador.get_paciente(req.query.p_documento);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function asegurados (req, res, next){
    try {
        const items = await controlador.asegurados(req.query.buscar);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function validarAsegurado (req, res, next){
    try {
        const item = await controlador.validarAsegurado(req.query.codigo);
        respuesta.success(req, res, item, 200); 
    } catch (err) {
        next(err);
    }
}

module.exports = router;