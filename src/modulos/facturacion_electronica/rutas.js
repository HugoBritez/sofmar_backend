const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')

router.get('/',seguridad(), getParametrosFE)
router.get('/consultar',seguridad(), consultarConfiguracionFE)

async function getParametrosFE (req, res, next){
    try {
        const parametros = await controlador.getParametrosFE();
        respuesta.success(req, res, parametros, 200);
    } catch (error) {
        next(error);
    }
}

async function consultarConfiguracionFE (req, res, next){
    try {
        const parametros = await controlador.consultarConfiguracionFE(req.query.sucursal_id);
        respuesta.success(req, res, parametros, 200);
    } catch (error) {
        next(error);
    }
}

module.exports = router;