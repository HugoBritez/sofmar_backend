const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')

//Prestadores
router.get('/',seguridad(),todos)
//Operador-Prestadores
router.get('/operador',seguridad(), operador)
router.get('/ope-pres',seguridad(), getOperadoresPrestadores)
router.get('/ope-pres/:id',seguridad(), unoOperadoresPrestadores)
router.post('/ope-pres/',seguridad(), agregarOperadoresPrestadores)
router.put('/ope-pres/:id',seguridad(), eliminarOperadoresPrestadores)

async function todos (req, res, next){
    try {
        const items = await controlador.todos();
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

async function operador (req, res, next){
    try {
        const items = await controlador.operador(req.query.user);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

async function getOperadoresPrestadores (req, res, next){
    try {
        const items = await controlador.getOperadoresPrestadores(req.query.buscar);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

async function unoOperadoresPrestadores (req, res, next){
    try {
        const item = await controlador.unoOperadoresPrestadores(req.params.id);
        respuesta.success(req, res, item, 200); 
    } catch (err) {
        /*respuesta.error(req, res, err, 500)*/
        next(err);
    }
}

async function agregarOperadoresPrestadores (req, res, next){
    try {
        let message = '';

        if (req.body.opre_prestador == -1){ //TODOS
            let prestadores = await controlador.todos();
            for (p in prestadores){
                let estaCargado = await controlador.operador(req.body.opre_operador, prestadores[p].pr_codigo);
                if (estaCargado.length < 1){
                    await controlador.agregarOperadoresPrestadores({opre_codigo:0, opre_operador:req.body.opre_operador, opre_prestador:prestadores[p].pr_codigo});
                }
            }
        }else{ //Uno en específico, agregar
            let estaCargado = await controlador.operador(req.body.opre_operador, req.body.opre_prestador);
            if (estaCargado.length < 1){
                await controlador.agregarOperadoresPrestadores(req.body);
            }else{
                message = `Operador ya se encuentra vinculado con este prestador`;
            }
        }

        if (message === ''){
            if(req.body.opre_codigo == 0)
            {
                message = 'Guardado con éxito';
            }
        }
        respuesta.success(req, res, message, 201);
    } catch (error) {
        next(error);
    }
}

async function eliminarOperadoresPrestadores (req, res, next){
    try {
        await controlador.eliminarOperadoresPrestadores(req.params.id);
        respuesta.success(req, res, 'Item eliminado satisfactoriamente!',200); 
    } catch (err) {
        next(err);
    }
}


module.exports = router;