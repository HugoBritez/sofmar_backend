const express = require('express');
const respuesta = require('../../../red/respuestas.js')
const router = express.Router();
const controlador = require('./index.js')
const seguridad = require('../../../middleware/seguridad');



router.get('/traer-cajas', seguridad(), traerCajas)
router.post('/iniciar', seguridad(), iniciar)
router.post('/cerrar', seguridad(), cerrar)
router.get('/verificar/:id', seguridad(), VerificarCajaAbierta)
router.post('/insertar-operacion', seguridad(), insertarOperacion)
router.post('insertar-inventario', seguridad(), insertarInventario)




async function traerCajas(req, res, next){
    try {
        const cajas = await controlador.traerCajas();
        respuesta.success(req, res, cajas, 200);
    } catch (err) {
        next(err);
    }
}

async function insertarInventario(req, res, next){
    try {
        console.log('Insertando inventario con los siguientes datos: ', req.body);
        const result = await controlador.insertarInventario(req.body);
        respuesta.success(req, res, result, 201);
    } catch (err) {
        next(err);
    }
}


async function insertarOperacion(req, res, next){
    try {
        console.log('Insertando operacion con los siguientes datos: ', req.body);
        const result = await controlador.insertarOperacion(req.body);
        respuesta.success(req, res, result, 201);
    } catch (err) {
        next(err);
    }
}


async function iniciar(req, res, next){
    try {
        
        const result = await controlador.IniciarCaja(req);
        respuesta.success(req, res, result, 201);
    } catch (err) {
        next(err);
    }
}


async function cerrar(req, res, next){
    try {
        console.log('Iniciando caja con los siguientes datos: ', req.body);
        const result = await controlador.CerrarCaja(req);
        respuesta.success(req, res, result, 200);
    } catch (err) {
        next(err);
    }
    
}

async function VerificarCajaAbierta(req, res, next){
    try {
        const result = await controlador.VerificarCajaAbierta(req.params.id);
        respuesta.success(req, res, result, 200);
        console.log('Caja abierta: ', result);
    } catch (err) {
        next(err);
    }
}

module.exports = router;