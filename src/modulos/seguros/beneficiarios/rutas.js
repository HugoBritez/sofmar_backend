const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')


//router.put('/',seguridad(),getVentas)
router.get('/beneficiario', seguridad(), getBeneficiario)
router.get('/adherente', seguridad(), getAdherente)

async function getBeneficiario (req, res, next){
    try {
        const buscar = req.query.string_busqueda;
        const item = await controlador.getBeneficiario(buscar);

        if (item.length > 0){
          item[0].preexistencia = await controlador.verificarPreexistencia(item[0].paccod);
        }

        respuesta.success(req, res, item, 200);
    } catch (err) {
        next(err);
    }
}

async function getAdherente (req, res, next){
    try {
        const buscar = req.query.string_busqueda;
        const item = await controlador.getAdherente(buscar);

        if (item.length > 0){
          item[0].preexistencia = await controlador.verificarPreexistencia(item[0].paccod);
        }
        
        respuesta.success(req, res, item, 200);
    } catch (err) {
        next(err);
    }
}


module.exports = router;