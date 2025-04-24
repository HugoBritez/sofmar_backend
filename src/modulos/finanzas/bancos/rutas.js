const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')

router.get('/todos', seguridad(), listarBancos)
router.get('/cuentas', seguridad(), listarCuentasBancarias)
router.get('/tarjetas',seguridad(), listarTarjetas)


async function listarTarjetas(req, res, next) {
    try {
        const tarjetas = await controlador.tarjetas()
        respuesta.success(req, res, tarjetas, 200)
    } catch (error) {
        respuesta.error(req, res, error, 500)
    }
}

async function listarCuentasBancarias(req, res, next) {
    try {
        const cuentas = await controlador.listarCuentasBancarias()
        respuesta.success(req, res, cuentas, 200)
    } catch (error) {
        respuesta.error(req, res, error, 500)
    }
}


async function listarBancos(req, res, next) {
    try {
        const bancos = await controlador.listarBancos()
        respuesta.success(req, res, bancos, 200)
    } catch (error) {
        respuesta.error(req, res, error, 500)
    }
}

module.exports = router;