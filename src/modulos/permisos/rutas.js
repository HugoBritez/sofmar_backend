const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')

router.post('/',seguridad(), todos)
router.post('/acceso', traerPermisosDeAcceso)
router.post('/permitir', permitirAcceso)


async function traerPermisosDeAcceso(req, res, next) {
    try{
        const operador = await controlador.traerPermisosDeAcceso(req.body.user);
        respuesta.success(req, res, operador, 200);
    }catch(err){
        next(err);
    }
}

async function permitirAcceso(req, res, next){
    try{
        const permiso = await controlador.permitirAcceso(req.body.userId, req.body.menuId);
        respuesta.success(req, res, permiso, 200);
        console.log(permiso);
    } catch(err){
        next(err);
    }
}

async function todos (req, res, next){
    try {
        let items = await controlador.todos(req.query.user, req.query.orden);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}
module.exports = router;