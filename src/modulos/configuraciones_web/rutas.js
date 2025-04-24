const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas') 
const controlador = require('./index.js')
const auth = require('../../auth/index')


router.get('/', get_configuraciones)
router.get('/fotos-nota-comun', get_configuraciones_fotos_nota_comun)
router.post('/fotos-nota-comun', update_configuraciones_fotos_nota_comun)
router.get('/fotos-factura', get_configuraciones_fotos_factura)
router.post('/fotos-factura', update_configuraciones_fotos_factura)
router.get('/factura', get_configuraciones_factura)
router.post('/factura', update_configuraciones_factura)

async function get_configuraciones(req, res){
    const configuraciones = await controlador.get_configuraciones();
    respuesta.success(req, res, configuraciones, 200);
}

async function get_configuraciones_fotos_nota_comun(req, res){
    const configuraciones = await controlador.get_configuraciones_fotos_nota_comun();
    respuesta.success(req, res, configuraciones, 200);
}

async function update_configuraciones_fotos_nota_comun(req, res){
    console.log(req.body);
    const configuraciones = await controlador.update_configuraciones_fotos_nota_comun(req.body);
    respuesta.success(req, res, configuraciones, 200);
}

async function get_configuraciones_fotos_factura(req, res){
    const configuraciones = await controlador.get_configuraciones_fotos_factura();
    respuesta.success(req, res, configuraciones, 200);
}

async function update_configuraciones_fotos_factura(req, res){
    const configuraciones = await controlador.update_configuraciones_fotos_factura(req.body);
    respuesta.success(req, res, configuraciones, 200);
}

async function get_configuraciones_factura(req, res){
    const configuraciones = await controlador.get_configuraciones_factura();
    respuesta.success(req, res, configuraciones, 200);
}

async function update_configuraciones_factura(req, res){
    const configuraciones = await controlador.update_configuraciones_factura(req.body);
    respuesta.success(req, res, configuraciones, 200);
}


module.exports = router;