const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js');


router.get('/',seguridad(), buscarCabeceras)
router.get('/detalles',seguridad(), getDetalles)
router.post('/agregar',seguridad(), agregar)
router.put('/', seguridad(), eliminar)
router.get('/datos/imprimir', seguridad(), imprimir)

async function buscarCabeceras (req, res, next){
    try {
        let fecha_desde = req.query.desde;
        let fecha_hasta = req.query.hasta;
        let paciente = req.query.paciente;
        let prestadores = req.query.prest;
        
        let items = await controlador.buscarCabeceras(fecha_desde, fecha_hasta, paciente, prestadores);

        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

async function getDetalles (req, res, next){
    try {
        let codigo = req.query.codigo;
        
        const consultas = await controlador.getDetallesConsultas(codigo);
        const procedimientos = await controlador.getDetallesProcedimientos(codigo);

        let items = [...consultas, ...procedimientos];

        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

async function agregar (req, res, next){
    try {
        let cabecera = req.body.visacion;
        let detalles = req.body.visacion_detalles;
        let visacion_nueva = await controlador.agregarCabecera(cabecera);
        controlador.updateNumeroCabecera(visacion_nueva.insertId);

        for (d in detalles){
            detalles[d].svd_visacion = visacion_nueva.insertId;
            await controlador.agregarDetalle(detalles[d]);
        }

        respuesta.success(req, res, visacion_nueva.insertId, 200);
    } catch (err) {
        next(err);
    }
}

async function eliminar(req, res, next) {
    try {
        await controlador.eliminarCabecera(req.query.id);
        // await controlador.eliminarDetalles(req.query.id); //Aparentemente no se cambia el estado de los detalles al anular la cabecera
        respuesta.success(req, res, 'Item eliminado satisfactoriamente!', 200);
    } catch (err) {
        next(err);
    }
}

async function imprimir(req, res, next) {
    try {
        const configuraciones = await controlador.getConfiguraciones();
        const cabecera = {
            empresa: configuraciones[0].valor,
            fecha: configuraciones[0].fecha,
            hora: configuraciones[0].hora,
            ruc: configuraciones[30].valor,
        }
        const visaciones = await controlador.uno(req.query.id);
        const visacion = visaciones[0];
        const consultas = await controlador.getDetallesConsultas(req.query.id);
        const procedimientos = await controlador.getDetallesProcedimientos(req.query.id);
        const detalles = [...consultas,  ...procedimientos];

        const datos = {cabecera, visacion, detalles}
        respuesta.success(req, res, datos, 200);
    } catch (error) {
        next(error);
    }
}

module.exports = router;