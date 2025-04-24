const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')

router.get('/', seguridad(), todos)

async function todos (req, res, next){
    try {
        const items = await controlador.todos();
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

module.exports = router;