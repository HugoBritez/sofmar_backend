const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')

router.get('/get-configuraciones', getConfiguraciones)

async function getConfiguraciones (req, res, next){
    try {
        const configuraciones = await controlador.getConfiguraciones();
        respuesta.success(req, res, configuraciones, 200);
    } catch (error) {
        next(error);
    }
}

module.exports = router;