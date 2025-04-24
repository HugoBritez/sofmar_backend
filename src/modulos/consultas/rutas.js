const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')

router.post('/', agregar)
router.post('/anular', seguridad(), anular)
router.post('/reagendar', seguridad(), reagendar)
router.get('/buscar-cola', seguridad(), buscar_cola)

async function agregar (req, res, next){
    try {
        const parametros = req.body;
        const consultas = {
            con_codigo: 0,
            con_sucursal: 1,
            con_operador: 255,
            con_paciente: parametros.paciente.pac_codigo,
            con_seguro: parametros.paciente.pac_seguro,
            con_fecha: parametros.fecha,
            con_hora: parametros.hora,
            con_moneda: 1,
            con_doctor: parametros.doctor,
            con_tipo: 1,
            con_cobertura: 0,
            con_descuento: 0,
            con_importe: 0,
            con_observacion: 'Reservado desde la Web',
            con_atendido: 0,
            con_estado: 1,
            con_disponibilidad: parametros.dis_codigo,
            con_valor: 0,
            con_saldo: 0,
            con_numero: 0,
            con_nroorden: '',
            con_imprimir: 0,
            con_consultorio: parametros.dis_consultorio,
            con_enproceso: 0,
            con_seguroestado: '',
            con_terminal: 'Desconocida',
            con_horaatendido: '00:00:00',
            con_horafinalizado: '00:00:00',
            con_estadoturnero: 0,
            con_horallamado: '00:00:00',
            con_historico: 0,
            con_origen: 2
        }
        await controlador.agregar(consultas);
        let message = 'Guardado con éxito';
        respuesta.success(req, res, message, 201);
    } catch (error) {
        next(error);
    }
}

async function buscar_cola (req, res, next){
    try {
        const items = await controlador.buscar_cola(req.query.hoy, req.query.bloque);
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

async function reagendar (req, res, next){
    try {
        const items = await controlador.reagendar(req.query.cod, req.query.fch, req.query.hora, req.query.doc, req.query.con);
        respuesta.success(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}


module.exports = router;