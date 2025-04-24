const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')

router.get('/', todos)
router.post('/actualizar-confirmacion', actualizar_confirmacion)
router.post('/reagendar', seguridad(), reagendar)
router.post('/anular', seguridad(), anular)

async function todos (req, res, next){
  try {
      const q = req.query;
      const items = await controlador.todos(q.fecha_desde, q.fecha_hasta, q.suc, q.pac, q.doc);
      respuesta.success(req, res, items, 200);
  } catch (err) {
      next(err);
  }
}

async function actualizar_confirmacion (req, res, next){
  try {
      const q = req.query;
      const items = await controlador.actualizar_confirmacion(q.codigo, q.tipo, q.etapa);
      respuesta.success(req, res, items, 200);
  } catch (err) {
      next(err);
  }
}

async function reagendar (req, res, next){
  try {
      const items = await controlador.reagendar(req.query.cod, req.query.fch, req.query.hora, req.query.doc, req.query.con, req.query.dis);
      respuesta.success(req, res, items, 200);
  } catch (err) {
      next(err);
  }
}

async function anular (req, res, next){
  try {
      const items = await controlador.anular(req.query.cod);
      respuesta.success(req, res, items, 200);
  } catch (err) {
      next(err);
  }
}


module.exports = router;