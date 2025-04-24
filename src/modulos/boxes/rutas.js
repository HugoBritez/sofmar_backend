const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')

router.get('/', todos)
router.get('/:id',seguridad(), uno)
router.post('/',seguridad(), agregar)
router.put('/:id',seguridad(), eliminar)
router.post('/estado',seguridad(), abrircerrar)
router.post('/getBox',seguridad(), getBox)

async function uno (req, res, next){
    try {
        const item = await controlador.uno(req.params.id);
        respuesta.success(req, res, item, 200); 
    } catch (err) {
        /*respuesta.error(req, res, err, 500)*/
        next(err);
    }
}

async function todos (req, res, next){
    try {
        const items = await controlador.todos(req.query.buscar, req.query.filt_suc);

        for (registro in items){
            let actual = items[registro];

            //Escribimos el servicio completo dependiendo de su código
            if (actual.box_estado === 0){
                actual.en_uso = 'Libre';
            }else{
                actual.en_uso = 'En uso';
            }

            //Escribimos tipo de atención
            switch (actual.box_tpo_atiende){
                case 1:
                    actual.tipo_atiende = "Consultas";
                    break;
                case 2:
                    actual.tipo_atiende = "Estudio";
                    break;
                case 3:
                    actual.tipo_atiende = "Laboratorio";
                    break;
                default:
                    actual.tipo_atiende = "Todos";
                    break;
            }
        }

        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function agregar (req, res, next){
    try {
        await controlador.agregar(req.body);
        let message = '';
        if(req.body.sm_codigo == 0)
        {
            message = 'Guardado con éxito';
        }else{
            message = 'Item no guardado';
        }
        respuesta.success(req, res, message, 201);
    } catch (error) {
        next(error);
    }
}

async function eliminar (req, res, next){
    try {
        await controlador.eliminar(req.params.id);
        respuesta.success(req, res, 'Item eliminado satisfactoriamente!',200); 
    } catch (err) {
        next(err);
    }
}

async function abrircerrar (req, res, next){
    try {
        const datos = req.body;

        //Cerramos los demás boxes abiertos por el mismo usuario (en teoría de por sí solo puede tener uno abierto)
        await controlador.abrircerrar(0, 0, datos.user);
        //Abrimos este box
        await controlador.abrircerrar(datos.id, datos.estado, datos.user);
        //await controlador.abrircerrar(req.query.id, req.query.estado, parseInt(req.query.user));
        respuesta.success(req, res, 'Box actualizado satisfactoriamente!',200); 
    } catch (err) {
        next(err);
    }
}

async function getBox (req, res, next){
    try {
        const box = await controlador.getBoxByUser(req.query.user);
        respuesta.success(req, res, box, 200); 
    } catch (err) {
        next(err);
    }
}

module.exports = router;