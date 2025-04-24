const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')

router.get('/', seguridad(), todos)
router.get('/usuario', seguridad(), usuario)

async function todos (req, res, next){
    try {
        const items = await controlador.todos();
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function usuario (req, res, next){
    try {
        let bloque = 0;
        const items = await controlador.usuario(req.query.user);

        if (items.length > 0){
            bloque = items[0].blo_codigo;
        }

        respuesta.success(req, res, bloque, 200); 
    } catch (err) {
        next(err);
    }
}


module.exports = router;