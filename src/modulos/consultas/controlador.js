const TABLA = 'consultas';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function agregar(datos){
        const primary_key_value = datos.con_codigo;
        const primary_key_name = "con_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function anular(id){
        const where_update = "con_codigo = " + id;
        const set_campo = " con_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    function reagendar(codigo, fecha, hora, doctor, consultorio){
        const query = `UPDATE ${TABLA} SET con_fecha = '${fecha}', con_hora = '${hora}', con_doctor = '${doctor}', con_consultorio = ${consultorio} WHERE con_codigo = ${codigo}`
        return db.sql(query);
    }

    function buscar_cola(hoy, bloque){
        let comando = ` AND consultas.con_fecha = '${hoy}' `;
        if (bloque != 0){
            comando += ` AND (SELECT TRIM(con_bloque) FROM consultorios c2 WHERE consultas.con_consultorio = c2.con_codigo) = ${bloque}`
        }

        let query = `
        SELECT
            consultas.con_nroorden AS ticket,
            con_numero AS numero,
            IFNULL((SELECT con_descripcion FROM consultorios c3 WHERE consultas.con_consultorio = c3.con_codigo ), "") AS consultorio,
            IFNULL((SELECT b.blo_descripcion FROM bloques b INNER JOIN consultorios c ON c.con_bloque = b.blo_codigo WHERE c.con_estado=1 AND b.blo_estado=1 AND c.con_codigo=consultas.con_consultorio LIMIT 1), "") AS bloque,
            IFNULL((SELECT CONCAT(TRIM(pac_nombres), " ", TRIM(pac_apellidos)) FROM pacientes WHERE consultas.con_paciente = pac_codigo), "") AS paciente,
            cargos.car_decripcion AS cargo_doctor,
            doctores.doc_sexo AS genero_doctor,
            CONCAT(TRIM(doctores.doc_apellidos), " ", TRIM(doctores.doc_nombres)) AS doctor,
            IF(con_estadoturnero=1, "Llamando", "En atención") AS estado,
            con_estadoturnero,
            consultas.con_codigo AS codigo,
            con_horallamado
        FROM
            consultas 
            INNER JOIN doctor_especialidad  ON consultas.con_doctor = doctor_especialidad.e_codigo 
            INNER JOIN doctores             ON doctores.doc_codigo  = doctor_especialidad.e_doctor
            INNER JOIN cargos               ON doctores.doc_cargo   = cargos.car_codigo
            LEFT JOIN  consultorios c1      ON consultas.con_consultorio = c1.con_codigo
        WHERE
            (con_estadoturnero > 0 AND con_estadoturnero < 3)
            ${comando}
            
        UNION ALL
        
        SELECT
            "" 			AS ticket,
            ""          AS numero,
			consultorio AS consultorio,
			"" 			AS bloque,
			paciente  	AS paciente, 
			"" 			AS cargo_doctor, 
			"" 			AS genero_doctor, 
			doctor 		AS doctor, 
			"Llamando"  AS estado, 
			pro_estado  AS con_estadoturnero, 
			CAST(0 as decimal) AS codigo,
			"" 			AS con_horallamado
        FROM  procedi_llamada
        WHERE pro_estado = 1
        LIMIT 10`;
        
        return db.sql(query);
    }

    return{
        agregar, anular, buscar_cola, reagendar
    } 
}