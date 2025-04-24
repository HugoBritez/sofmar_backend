const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')


router.get('/',seguridad(), todos)
router.post('/agenda',seguridad(), agregar)
router.post('/buscar',seguridad(), buscar)
router.get('/listar',seguridad(), listar)
router.post('/atender',seguridad(), atender)
router.post('/descartar',seguridad(), descartar)
router.get('/modificar',seguridad(), modificar)
router.post('/cargar-cola',seguridad(), cargar_cola)
router.get('/buscar-cola',seguridad(), buscar_cola)
router.get('/esp_preag',seguridad(), esp_preag)


async function todos (req, res, next){
    try {
        const items = await controlador.todos();
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function atender (req, res, next){
    try {
        const items = await controlador.atender(req.query.codigo, req.query.box);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function descartar (req, res, next){
    try {
        const items = await controlador.descartar(req.query.codigo);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function modificar (req, res, next){
    try {
        const items = await controlador.modificar(req.query.codigo, req.query.campo, req.query.valor);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function listar (req, res, next){
    try {
        let tipo = "";
        let etapa = "";
        let especialidad = "";

        if (req.query.tipo != 'Tod'){
            let tipos_barra = req.query.tipo.replace(/,/g, '|');
            tipos_barra = tipos_barra.replace(/'/g, '');

            tipo = ` AND coalesce(p.preag_reasignado IN (${req.query.tipo}), p.preag_id REGEXP '^${tipos_barra}')`;
        }

        if (req.query.etapa != -1){
            etapa += ` AND p.preag_est_atend = ${req.query.etapa}`;
        }

        if (req.query.esp != ''){
            especialidad += ` AND p.preag_especialidad IN (${req.query.esp})`;
        }

        const sqlquery = `SELECT p.*, coalesce(e.esp_descripcion, 'OTRAS ESPECIALIDADES') as esp_descripcion, b.box_descripcion, Date_Format(p.preag_fecha, '%d-%m-%Y') as preag_fecha
        FROM preagendamientos p
        LEFT JOIN especialidades e ON p.preag_especialidad = e.esp_codigo
        LEFT JOIN boxes b ON p.preag_box_atend = b.box_codigo
        WHERE p.preag_est_reg IN (${req.query.act})
        AND p.preag_fecha = '${req.query.fch}' 
        AND p.preag_sucursal = ${req.query.suc}` + tipo + etapa + especialidad;

        let items = await controlador.sql(sqlquery);

        for (registro in items){
            //Recuperamos nombre, sea paciente o contribuyente
            let nombre_buscado = '';

            let actual = items[registro];          
            
            if (actual.preag_paciente != 0){
                const paciente = await controlador.traer_paciente(actual.preag_paciente);
                if (paciente.length > 0){
                    nombre_buscado = paciente[0].nombre;
                }
            }else{
                const paciente = await controlador.buscar_paciente(actual.preag_documento);
                if (paciente.length > 0){
                    nombre_buscado = paciente[0].nombre;
                    controlador.modificar(actual.preag_codigo, `preag_paciente`, paciente[0].pac_codigo);
                }else{
                    const contribuyente = await controlador.buscar_contribuyente(actual.preag_documento);
                    if (contribuyente.length > 0){
                        nombre_buscado = contribuyente[0].cst_razon;
                    }
                }
            }

            actual.nombre = nombre_buscado;

            //Escribimos el servicio completo dependiendo de su código
            if (actual.preag_reasignado){ //Si fue reasignado, esto toma precedente ya que es lo más reciente
                if (actual.preag_reasignado === 'Con'){
                    actual.servicio = 'Consulta';
                }else if (actual.preag_reasignado === 'Lab'){
                    actual.servicio = 'Laboratorio';
                }else if (actual.preag_reasignado === 'Est'){
                    actual.servicio = 'Estudio';
                }
            }else{ //Si no fue reasignado, tomamos su base
                if (actual.preag_id.slice(0, 3) === 'Con'){
                    actual.servicio = 'Consulta';
                }else if (actual.preag_id.slice(0, 3) === 'Lab'){
                    actual.servicio = 'Laboratorio';
                }else if (actual.preag_id.slice(0, 3) === 'Est'){
                    actual.servicio = 'Estudio';
                }
            }

            if (actual.preag_est_reg === 1){
                actual.estado = "Activo";
            }else if (actual.preag_est_reg === 0){
                actual.estado = "Descartado";
            }

            if (actual.preag_est_atend === 0){
                actual.etapa = "Pendiente";
            }else if (actual.preag_est_atend > 0){
                actual.etapa = "Etapa " + actual.preag_est_atend;
            }

            actual.reasignando = false; //Usamos como flag en el Listado que usa para llamar y atender
        }

        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function buscar (req, res, next){
    try {
        const paciente = await controlador.buscar_paciente(req.query.documento);
        
        let persona = {
            per_pac_cod: 0,
            per_nombre: ''
        }

        if (paciente.length === 0){ //No encontró paciente, debemos buscar entre contribuyentes
            const contribuyente = await controlador.buscar_contribuyente(req.query.documento);

            if (contribuyente.length > 0){ //Si encontró contribuyente
                persona.per_pac_cod = 0;
                persona.per_nombre = contribuyente[0].cst_razon;
            }
        }else{
            persona.per_pac_cod = paciente[0].pac_codigo;
            persona.per_nombre = paciente[0].nombre;
        }

        return respuesta.success(req, res, persona, 201);
    } catch (error) {
        next(error);
    }
}

async function agregar (req, res, next){
    try {
        const bod = req.body;
        const datos = req.body.datos;
        
        const ultimo = await controlador.get_ultimo(req.body.tipo_age_cod, datos.preag_fecha);
        let agendamiento_actual = 0;

        if (ultimo.length === 0) {
            agendamiento_actual = 1;
        }else{
            agendamiento_actual = parseInt(ultimo[0].preag_id.replace(/[^0-9]/g, ''));
            agendamiento_actual += 1;
        }
        datos.preag_id = req.body.tipo_age_cod + String(agendamiento_actual).padStart(4, '0');

        const agregado = await controlador.agregar(datos); //Devuelve registro nuevo
        datos.preag_codigo = agregado.insertId; //Estiramos el código (auto-incrementado) del registro nuevo

        //Impresión
        // const items = await controlador.get_config();
        
        let seg = '';

        if (datos.preag_paciente > 0){
            const resp_seg = await
                controlador.sql(`SELECT s.se_descripcion FROM pacientes p LEFT JOIN seguros s ON p.pac_seguro = s.se_codigo WHERE p.pac_codigo = ${datos.preag_paciente}`)
            seg = resp_seg[0].se_descripcion;
        }else{
            seg = 'S/D';
        }

        bod.seguro = seg;

        // const info = {
        //     //Fila 0 (id 1) es correspondiente a empresa
        //     empresa: items[0].valor,
        //     //Fila 30 (id 31) es correspondiente a RUC
        //     ruc: items[30].valor,
        //     seguro: seg
        // }

        bod.datos = datos;
        // bod.resp = info;

        return respuesta.success(req, res, bod, 201);
    } catch (error) {
        next(error);
    }
}

async function cargar_cola (req, res, next){
    try {
        const items = await controlador.cargar_cola(req.body);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function buscar_cola (req, res, next){
    try {
        const item = await controlador.buscar_cola();

        if (item.length > 0){
            //Si no tiene nombre, buscamos de nuevo a ver si ya se cargó ficha de paciente
            if (!item[0].nombre){
                let paciente = await controlador.buscar_paciente(`'${item[0].documento}'`);
                if (paciente.length > 0){
                    item[0].nombre = paciente[0].nombre;
                }else{
                    item[0].nombre = "Sin Registro";
                }
            }

            //Sacamos de la cola al que estiramos
            await controlador.eliminar_cola(item[0].preag_id, item[0].sucursal);
            respuesta.success(req, res, item, 200);
        }else{
            respuesta.success(req, res, "-", 200);
        }
    } catch (err) {
        next(err);
    }
}

async function esp_preag (req, res, next){
    try {
        const items = await controlador.esp_preag();
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

module.exports = router;