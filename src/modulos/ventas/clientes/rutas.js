const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')

router.get('/', todos)
router.get("/get-clientes", seguridad(), getClientes);
router.get('/:id',seguridad(), uno)
router.post('/',seguridad(), agregar)
router.put('/:id',seguridad(), eliminar)


async function getClientes(req, res, next){
    try {
        console.log(req.query);
        const items = await controlador.getClientes(req.query.buscar, req.query.id, req.query.id_cliente, req.query.estado, req.query.limite);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function todos_por_vendedor (req, res, next){
    try {
        const items = await controlador.todos_por_vendedor(req.params.id);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function uno (req, res, next){
    try {
        const item = await controlador.uno(req.params.id);

        if (item.length > 0){
            const saldos = await controlador.saldo(req.params.id);

            for (s in saldos){
                if (saldos[s].mo_codigo === 1) item[0].saldog = saldos[s].saldo;
                if (saldos[s].mo_codigo === 2) item[0].saldod = saldos[s].saldo;
                if (saldos[s].mo_codigo === 3) item[0].saldor = saldos[s].saldo;
                if (saldos[s].mo_codigo === 4) item[0].saldop = saldos[s].saldo;
            }
        }
        
        respuesta.success(req, res, item, 200); 
    } catch (err) {
        /*respuesta.error(req, res, err, 500)*/
        next(err);
    }
}

async function todos (req, res, next){
    try {
        const items = await controlador.todos(req.query.buscar);
        respuesta.success(req, res, items,200); 
    } catch (err) {
        next(err);
    }
}

async function agregar (req, res, next){
    try {
        await controlador.agregar(req.body);
        let message = '';
        if(req.body.cli_codigo == 0)
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