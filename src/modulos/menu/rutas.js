const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')

//router.get('/', todos)
router.get('/rol',seguridad(), rol)
router.post('/',seguridad(), todos)

async function todos (req, res, next){
    try {
        let items = await controlador.todos(req.query.user, req.query.grupo, req.query.orden);
        for (i in items){
            if (items[i].m_descripcion.substring(0, 2) === "w."){
                items[i].m_descripcion = items[i].m_descripcion.substring(2);
            }
        }
        respuesta.success(req, res, items,200); 
    } catch (err) {
        next(err);
    }
}

async function rol (req, res, next){
    try {
        let items = await controlador.rol(req.query.user);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

module.exports = router;