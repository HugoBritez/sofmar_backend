const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')


router.get('/conf_hospitalarias', get_conf_hospitalarias)

async function get_parametros_rescursos (req, res, next){
    try {
        const items = await controlador.get_parametros_rescursos();
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function get_conf_hospitalarias (req, res, next){
    try {
        const items = await controlador.get_conf_hospitalarias(req.query.codigos);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

module.exports = router;