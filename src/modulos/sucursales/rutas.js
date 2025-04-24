const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')


router.get('/',seguridad(), todos_user)
router.get('/listar',seguridad(), todos)
router.get('/ciudad',seguridad(), ciudad)
router.get('/todos',seguridad(), todosConCiudad)
router.get('/sucursal-data', seguridad(), sucursalData)


async function sucursalData (req, res, next){
  try{
    const items = await controlador.sucursalData(req.query.sucursal);
    respuesta.success(req, res, items,200 );
  } catch (err){
    next(err);
  }
}


async function todosConCiudad (req, res, next){
  try {
      const items = await controlador.todosConCiudad();
      respuesta.success(req, res, items,200); 
  } catch (err) {
      next(err);
  }
}

async function todos_user (req, res, next){
  try {
      const items = await controlador.todos_user(req.query.operador);
      respuesta.success(req, res, items,200); 
  } catch (err) {
      next(err);
  }
}

async function todos (req, res, next){
  try {
      const items = await controlador.todos(req.query.operador);
      respuesta.success(req, res, items,200); 
  } catch (err) {
      next(err);
  }
}

async function ciudad (req, res, next){
  try {
      const items = await controlador.ciudad(req.query.suc);
      respuesta.success(req, res, items,200); 
  } catch (err) {
      next(err);
  }
}

module.exports = router;