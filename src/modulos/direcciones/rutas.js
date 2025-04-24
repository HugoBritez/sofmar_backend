const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas') 
const controlador = require('./index.js')

const getDirecciones = async (req, res, next) => {
    try {
        const items = await controlador.getDirecciones(req.query.busqueda, req.query.zona);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

const crearDirecciones = async (req, res, next) => {
    try {
        console.log(req.body);
        const items = await controlador.postDirecciones(req.body);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

const eliminarDirecciones = async (req, res, next) => {
    try {
        console.log(req.query);
        const items = await controlador.eliminarDirecciones(req.query.rango);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

const crearAgrupacionesEnSecuencia = async (req, res, next) => {
    try {
        console.log(req.body);
        const { rango, zona } = req.body;
        const items = await controlador.agruparDireccionesEnSecuencia(rango, zona);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

const getArticulosDirecciones = async (req, res, next) => {
    try {
        const items = await controlador.getArticulosDirecciones(req.query.busqueda, req.query.rango);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

const crearArticuloDireccion = async (req, res, next) => {
    try {
        console.log(req.body);
        const items = await controlador.crearArticuloDireccion(req.body);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

const eliminarArticuloDireccion = async (req, res, next) => {
    try {
        console.log(req.query);
        const items = await controlador.eliminarArticuloDireccion(req.query.rango, req.query.articulo);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

const generarRotulos = async (req, res, next) => {
    try {
        console.log('Query para generar rotulos:', req.query);
        const items = await controlador.generarRotulos(req.query.rango);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

router.get('/', seguridad(), getDirecciones);
router.post('/', seguridad(), crearDirecciones);
router.delete('/', seguridad(), eliminarDirecciones);
router.post('/agrupar', seguridad(), crearAgrupacionesEnSecuencia);
router.get('/articulos', seguridad(), getArticulosDirecciones);
router.post('/articulo', seguridad(), crearArticuloDireccion);
router.delete('/articulo', seguridad(), eliminarArticuloDireccion);
router.get('/rotulos', seguridad(), generarRotulos);

module.exports = router;