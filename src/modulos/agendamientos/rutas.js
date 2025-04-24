const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')

router.get('/',seguridad(), todos)
router.get('/:id',seguridad(), uno)
router.post('/',seguridad(), agregar)
router.put('/:id',seguridad(), eliminar)

async function uno (req, res, next){
    try {
        const item = await controlador.uno(req.params.id);
        respuesta.success(req, res, item, 200); 
    } catch (err) {
        next(err);
    }
}

async function todos (req, res, next){
    try {
        const items = await controlador.todos(req.query.buscar);
        respuesta.success(req, res, items,200); 
    } catch (err) {
        next(err);
    }
}

async function agregar (req, res, next){
    try {
        const detalle = req.body.fechas;
        const cabecera = req.body.cabecera;
        let guardar = [];
        let message = 'Guardado con éxito';

        for (let key in detalle){          
            const datos = { 
                ha_codigo: 0,
                ha_fecha: detalle[key].ha_fecha,
                ha_hora: detalle[key].ha_hora,
                ha_paciente: cabecera.ha_paciente,
                ha_doctor: cabecera.ha_doctor,
                ha_ayudante: cabecera.ha_ayudante,
                ha_maquina: cabecera.ha_maquina,
                ha_obs: cabecera.ha_obs,
                ha_estado: 1,
                ha_atendido: 0,
                ha_sucursal: cabecera.ha_sucursal
            }

            //VALIDACIONES DE HORARIOS
            const valid = await controlador.obtener_horario(datos.ha_fecha, datos.ha_hora);
            console.log(valid);
            for (let key in valid){  
                if(valid[key].ha_maquina === datos.ha_maquina){
                    message = 'Máquina ocupada en la misma Fecha y Hora ' + datos.ha_fecha + ' ' + datos.ha_hora
                    next({message: message, statusCode: 501} );      
                    return
                }
                /*if(valid[key].ha_doctor === datos.ha_doctor){
                    message = 'Doctor/Especialista ya está agendado en la misma Fecha y Hora ' + datos.ha_fecha + ' ' + datos.ha_hora
                    next({message: message, statusCode: 501} );      
                    return
                }*/
                if(valid[key].ha_paciente === datos.ha_paciente){
                    message = 'Paciente ya está agendado en la misma Fecha y Hora ' + datos.ha_fecha + ' ' + datos.ha_hora
                    next({message: message, statusCode: 501} );      
                    return
                }
            }
            guardar.push({datos});
        }

        for (let key in guardar){  
            await controlador.agregar(guardar[key].datos);
        }

        respuesta.success(req, res, message, 201);
    } catch (error) {
        next(error);
    }
}

async function eliminar (req, res, next){
    try {
        await controlador.eliminar(req.params.id);
        respuesta.success(req, res, 'Cancelado satisfactoriamente!',200); 
    } catch (err) {
        next(err);
    }
}

module.exports = router;