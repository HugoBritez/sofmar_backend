const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')

router.get('/consultas', seguridad(), consultarRemisiones)
router.get('/obtener', seguridad(), obtenerRemisionesParaVenta)

async function obtenerRemisionesParaVenta(req, res, next){
  try{
    console.log(req.query)
    const result = await controlador.obtenerRemisionesParaVenta(req.query.id)
    respuesta.success(req, res, result, 200)
  }catch(err){
    next(err)
  }
}

async function consultarRemisiones (req, res, next){
  try{
    console.log(req.query)
    const result = await controlador.consultarRemisiones(req.query.fecha_desde, req.query.fecha_hasta)
    respuesta.success(req, res, result, 200)
  }catch(err){
    next(err)
  }
}


module.exports = router;