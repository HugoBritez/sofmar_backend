const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')

router.get('/', todos)
router.get('/:id',seguridad(), uno)
router.post('/',seguridad(), agregar)
router.put('/:id',seguridad(), eliminar)

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
        let message = '';
        if(req.body.s_codigo == 0)
        {
            message = 'Guardado con éxito';
        }else{
            message = 'Item no guardado';
        }
        respuesta.success(req, res, message, 201);
    } catch (error) {
        next(error);
    }
}

async function eliminar (req, res, next){
    try {
        await controlador.eliminar(req.params.id);
        respuesta.success(req, res, 'Item eliminado satisfactoriamente!',200); 
    } catch (err) {
        next(err);
    }
}

module.exports = router;