const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')


router.get('/por_id/', por_id)
router.get('/', todos)
router.get('/todos', todosSinQuery)
router.post('/',seguridad(), modificar)
router.get('/cabecera',seguridad(), cabecera_impresion)
router.get('/get-configuraciones', getConfiguraciones)

async function todos (req, res, next){
    try {
        const items = await controlador.todos(req.query.buscar);
        respuesta.success(req, res, items,200); 
    } catch (err) {
        next(err);
    }
}

async function todosSinQuery (req, res, next){
    try {
        const items = await controlador.getConfiguraciones();
        respuesta.success(req, res, items,200); 
    } catch (err) {
        next(err);
    }
}

router.get('/por_id', por_id) 
async function por_id (req, res, next){
    try {
        const items = await controlador.por_id(req.query.ids);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

async function cabecera_impresion (req, res, next){
    try {
        const configuraciones = await controlador.getConfiguraciones();
        const cabecera = {
            empresa: configuraciones[0].valor,
            fecha: configuraciones[0].fecha,
            hora: configuraciones[0].hora,
            ruc: configuraciones[30].valor,
            telef: configuraciones[2].valor,
        }
        respuesta.success(req, res, cabecera, 201);
    } catch (error) {
        next(error);
    }
}

async function modificar (req, res, next){
    try {
        await controlador.modificar(req.query.id, req.query.valor);
        let message = '';
        message = 'Guardado con éxito';
        respuesta.success(req, res, message, 201);
    } catch (error) {
        next(error);
    }
}

async function getConfiguraciones (req, res, next){
    try {
        const configuraciones = await controlador.getConfiguraciones();
        respuesta.success(req, res, configuraciones, 200);
    } catch (error) {
        next(error);
    }
}

module.exports = router;