const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')

router.get('/', todos)
router.get('/:id',seguridad(), uno)
router.post('/',seguridad(), agregar)

async function uno (req, res, next){
    try {
        const item = await controlador.uno(req.params.id);
        respuesta.success(req, res, item, 200); 
    } catch (err) {
        /*respuesta.error(req, res, err, 500)*/
        next(err);
    }
}

async function todos (req, res, next){
    try {
        const items = await controlador.todos();
        respuesta.success(req, res, items,200); 
    } catch (err) {
        next(err);
    }
}

async function agregar (req, res, next){
    try {
        await controlador.agregar(req.body);
        let message = 'Guardado con éxito';
        respuesta.success(req, res, message, 201);
    } catch (error) {
        next(error);
    }
}

module.exports = router;