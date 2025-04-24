const CABECERA = 'seguro_visacion';
const DETALLES = 'seguro_visacion_detalle';

module.exports = function(dbInyectada) {
    let db = dbInyectada;

    if(!db){
        db = require('../../../DB/mysql.js');
    }

    async function uno(codigo){
        let query = `
        SELECT
            sv.sv_codigo,
            Concat(pa.pac_nombres, ' ', pa.pac_apellidos) AS aseguradodes,
            pa.pac_celular,
            sv.sv_fecha,
            Date_Format(sv.sv_fecha, '%d-%m-%Y') AS fecha,
            sv.sv_hora,
            ope.op_nombre,
            pla.pla_descripcion,
            If(sv.sv_tipo = 1, 'Titular', 'Adherente') As tipodes,
            pre.pr_descripcion,
            sv.sv_observacion,
            ifnull(Concat(d.doc_nombres, ' ', d.doc_apellidos),'') AS resp_nom,
            ifnull(Concat(ds.doc_nombres, ' ', ds.doc_apellidos),'') AS soli_nom,
            sc.sc_descripcion,
            pa.pac_documento,
            sv.sv_estado
        FROM
            seguro_visacion sv
            INNER JOIN pacientes pa ON sv.sv_paciente = pa.pac_codigo
            INNER JOIN operadores ope ON sv.sv_operador = ope.op_codigo
            INNER JOIN plan_seguro_cobertura psc ON sv.sv_plan = psc.psc_codigo
            INNER JOIN planes pla ON psc.psc_plan = pla.pla_codigo
            INNER JOIN seguro_categorias sc ON psc.psc_categoria = sc.sc_codigo
            INNER JOIN prestadores pre ON sv.sv_prestador = pre.pr_codigo
            LEFT JOIN  doctor_especialidad de ON sv.sv_doctor_responsable = de.e_codigo
            LEFT JOIN  doctores d ON de.e_doctor = d.doc_codigo
            LEFT JOIN  doctor_especialidad des ON sv.sv_doctor_solicitante = des.e_codigo
            LEFT JOIN  doctores ds ON des.e_doctor = ds.doc_codigo
        WHERE sv.sv_codigo = ${codigo}`
        return db.sql(query);
    }

    function buscarCabeceras(fecha_desde, fecha_hasta, paciente, prestadores){
        let where = "";
        
        if (fecha_desde != ""){
            where += ` AND sv.sv_fecha >= '${fecha_desde}'`
        }
        if (fecha_hasta != ""){
            where += ` AND sv.sv_fecha <= '${fecha_hasta}'`
        }
        if (paciente > 0){
            where += ` AND pa.pac_codigo = ${paciente}`
        }
        if (prestadores != ""){
            where += ` AND sv.sv_prestador IN (${prestadores})`
        }

        let query =
        `SELECT
            sv.sv_codigo,
            Concat(pa.pac_nombres, ' ', pa.pac_apellidos) AS aseguradodes,
            sv.sv_fecha,
            Date_Format(sv.sv_fecha, '%d-%m-%Y') AS fecha,
            sv.sv_hora,
            ope.op_nombre,
            pla.pla_descripcion,
            If(sv.sv_tipo = 1, 'Titular', 'Adherente') As tipodes,
            pre.pr_descripcion,
            sv.sv_observacion,
            ifnull(Concat(d.doc_nombres, ' ', d.doc_apellidos),'') AS resp_nom,
            ifnull(Concat(ds.doc_nombres, ' ', ds.doc_apellidos),'') AS soli_nom,
            sc.sc_descripcion,
            pa.pac_documento,
            sv.sv_estado  
        FROM
            seguro_visacion sv
            INNER JOIN pacientes pa ON sv.sv_paciente = pa.pac_codigo
            INNER JOIN operadores ope ON sv.sv_operador = ope.op_codigo
            INNER JOIN plan_seguro_cobertura psc ON sv.sv_plan = psc.psc_codigo
            INNER JOIN planes pla ON psc.psc_plan = pla.pla_codigo
            INNER JOIN seguro_categorias sc ON psc.psc_categoria = sc.sc_codigo
            INNER JOIN prestadores pre ON sv.sv_prestador = pre.pr_codigo
            LEFT JOIN  doctor_especialidad de ON sv.sv_doctor_responsable = de.e_codigo
            LEFT JOIN  doctores d ON de.e_doctor = d.doc_codigo
            LEFT JOIN  doctor_especialidad des ON sv.sv_doctor_solicitante = des.e_codigo
            LEFT JOIN  doctores ds ON des.e_doctor = ds.doc_codigo
        WHERE 1=1 ${where}
        ORDER BY sv.sv_fecha desc, sv.sv_numero DESC`

        return db.sql(query);
    }

    function getDetallesConsultas(codigo){
        let query = `
        SELECT
            svd.svd_codigo,
            tc.tc_descripcion AS descripcion,
            CAST(sda.sda_descripcion as char) as tiposervicio,
            svd.svd_porcob,
            svd.svd_montocobertura as monto,
            svd.svd_diasinternacion,
            svd.svd_medicamentos as insumos,
            svd.svd_cantidad
        FROM
            seguro_visacion_detalle svd
            INNER JOIN seguro_visacion sv ON svd.svd_visacion = sv.sv_codigo
            INNER JOIN tipo_consulta tc ON svd.svd_tipo = tc.tc_codigo
            INNER JOIN s_definicion_agrupaciones sda ON svd.svd_gruposervicio = sda.sda_codigo
        WHERE
            svd.svd_visacion = ${codigo}
            AND sv.sv_estado = 1 
            AND svd.svd_estado = 1
            AND svd.svd_tipoServicio = 1
        GROUP BY svd.svd_codigo`;

        return db.sql(query);
    }

    function getDetallesProcedimientos(codigo){
        let query = `
        SELECT
            svd.svd_codigo,
            pro.proc_descripcion AS descripcion,
            CAST(sda.sda_descripcion as char) AS tiposervicio,
            svd.svd_porcob,
            svd.svd_montocobertura as monto,
            svd.svd_diasinternacion,
            svd.svd_medicamentos as insumos,
            svd.svd_cantidad
        FROM
            seguro_visacion_detalle svd
            INNER JOIN seguro_visacion sv ON svd.svd_visacion = sv.sv_codigo
            INNER JOIN procedimientos pro ON svd.svd_tipo = pro.proc_codigo 
            INNER JOIN s_definicion_agrupaciones sda ON svd.svd_gruposervicio = sda.sda_codigo
        WHERE
            svd.svd_visacion = ${codigo}
            AND sv.sv_estado = 1 
            AND svd.svd_estado = 1
            AND svd.svd_tipoServicio = 2
        GROUP BY svd.svd_codigo`;

        return db.sql(query);
    }

    function agregarCabecera(datos){
        const primary_key_value = datos.sv_codigo;
        const primary_key_name = "sv_codigo";
        return db.agregar(CABECERA, datos, primary_key_value, primary_key_name);
    }

    function updateNumeroCabecera(codigo){
        return db.sql(`UPDATE ${CABECERA} SET sv_numero = ${codigo} WHERE sv_codigo = ${codigo}`);
    }

    function agregarDetalle(datos){
        const primary_key_value = datos.svd_codigo;
        const primary_key_name = "svd_codigo";
        return db.agregar(DETALLES, datos, primary_key_value, primary_key_name);
    }

    function eliminarCabecera(id){
        const where_update = "sv_codigo = " + id;
        const set_campo = " sv_estado = 0 "
        return db.eliminar(CABECERA, where_update, set_campo);
    }

    function eliminarDetalles(id){
        const where_update = "svd_visacion = " + id;
        const set_campo = " svd_estado = 0 "
        return db.eliminar(DETALLES, where_update, set_campo);
    }

    function getConfiguraciones(){
        return db.sql(`SELECT *, Date_Format(curdate(), '%d-%m-%Y') AS fecha, CURTIME() AS hora FROM configuraciones`);
    }

    return{
        uno, buscarCabeceras, getDetallesConsultas, getDetallesProcedimientos,
        agregarCabecera, updateNumeroCabecera, agregarDetalle,
        eliminarCabecera, eliminarDetalles,
        getConfiguraciones
    }
}