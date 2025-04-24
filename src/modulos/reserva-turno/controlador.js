const TABLA = 's_reserva_turno';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

  //   function todos(fecha_desde, fecha_hasta, sucursal, paciente, doctor_especialidad){
  //     let where = "";
  //     if (paciente > 0){
  //         where += ` AND pac.pac_codigo = ${paciente}`;
  //     }
  //     if (doctor_especialidad > 0){
  //         where += ` AND de.e_codigo = ${doctor_especialidad}`;
  //     }

  //     let query1 =  `SELECT
  //                         ate.ate_codigo AS codigo,
  //                         Date_Format(ate.ate_fecha, '%Y-%m-%d') AS fecha,
  //                         ate.ate_hora AS hora,
  //                         CONCAT(pac.pac_nombres,' ',pac.pac_apellidos) AS paciente,
  //                         pac.pac_celular AS celular,
  //                         CONCAT(doc.doc_nombres,' ',doc.doc_apellidos) AS doctor,
  //                         esp.esp_descripcion AS especialidad,
  //                         'Atención' AS tipo,
  //                         ate.ate_confirm_est AS etapa
  //                     FROM
  //                         atenciones ate
  //                         INNER JOIN pacientes pac ON ate.ate_paciente = pac.pac_codigo
  //                         INNER JOIN doctor_especialidad de ON ate.ate_doctor = de.e_codigo
  //                         INNER JOIN doctores doc ON doc.doc_codigo = de.e_doctor
  //                         INNER JOIN especialidades esp ON esp.esp_codigo = de.e_especialidad
  //                     WHERE
  //                         ate.ate_estado = 1
  //                         AND ate.ate_atendido = 0
  //                         AND ate.ate_tipo IN (3,4,5) #Excluir Internación y Urgencias
  //                         AND ate.ate_sucursal = ${sucursal}
  //                         AND ate.ate_fecha >= '${fecha_desde}' AND ate.ate_fecha <= '${fecha_hasta}' ${where}`;

  //     let query2 =  `SELECT
  //                         c.con_codigo AS codigo,
  //                         Date_Format(c.con_fecha, '%Y-%m-%d') AS fecha,
  //                         c.con_hora AS hora,
  //                         CONCAT(pac.pac_nombres,' ',pac.pac_apellidos) AS paciente,
  //                         pac.pac_celular AS pac_cel,
  //                         CONCAT(doc.doc_nombres,' ',doc.doc_apellidos) AS doctor,
  //                         esp.esp_descripcion AS especialidad,
  //                         'Consulta' AS tipo,
  //                         c.con_confirm_est AS etapa
  //                     FROM
  //                         consultas c
  //                         INNER JOIN pacientes pac ON c.con_paciente = pac.pac_codigo
  //                         INNER JOIN doctor_especialidad de ON c.con_doctor = de.e_codigo
  //                         INNER JOIN doctores doc ON doc.doc_codigo = de.e_doctor
  //                         INNER JOIN especialidades esp ON esp.esp_codigo = de.e_especialidad
  //                     WHERE
  //                         c.con_estado = 1
  //                         AND c.con_atendido = 0
  //                         AND c.con_sucursal = ${sucursal}
  //                         AND c.con_fecha >= '${fecha_desde}' AND c.con_fecha <= '${fecha_hasta}' ${where}`;

  //     const query = query1 + " UNION " + query2 + " ORDER BY fecha, hora";
  //     return db.sql(query);
  // }

  // function actualizar_confirmacion(codigo, tipo, etapa){
  //   let tabla = "";
  //   let key = "";
  //   let estado_col = "";

  //   if (tipo === "Atención"){
  //       tabla = "atenciones";
  //       key = "ate_codigo";
  //       estado_col = "ate_confirm_est";
  //   }else if (tipo === "Consulta"){
  //       tabla = "consultas";
  //       key = "con_codigo";
  //       estado_col = "con_confirm_est";
  //   }

  //   const query = `UPDATE ${tabla} SET ${estado_col} = ${etapa} WHERE ${key} = ${codigo}`;
  //   return db.sql(query);
  // }

  function todos(fecha_desde, fecha_hasta, sucursal, paciente, doctor_especialidad){
    let where = "";
    if (paciente > 0){
        where += ` AND pac.pac_codigo = ${paciente}`;
    }
    if (doctor_especialidad > 0){
        where += ` AND de.e_codigo = ${doctor_especialidad}`;
    }

    let query =  `SELECT
                      rt.rt_codigo AS codigo,
                      Date_Format(rt.rt_fecha, '%Y-%m-%d') AS fecha,
                      rt.rt_hora AS hora,
                      CONCAT(pac.pac_nombres,' ',pac.pac_apellidos) AS paciente,
                      pac.pac_celular AS celular,
                      CONCAT(doc.doc_nombres,' ',doc.doc_apellidos) AS doctor,
                      esp.esp_descripcion AS especialidad,
                      rt.rt_tipo AS tiponum,
                      rt.rt_confirmado AS etapa
                    FROM
                      s_reserva_turno rt
                      INNER JOIN pacientes pac ON rt.rt_paciente = pac.pac_codigo
                      INNER JOIN doctor_especialidad de ON rt.rt_especialista = de.e_codigo
                      INNER JOIN doctores doc ON doc.doc_codigo = de.e_doctor
                      INNER JOIN especialidades esp ON esp.esp_codigo = de.e_especialidad
                      INNER JOIN disponibilidad dis ON dis.dis_codigo = rt.rt_disponibilidad
                    WHERE
                      rt.rt_estado = 1
                      AND rt.rt_procesado = 0 #Aún no se pasó a Consulta
                      AND rt.rt_fecha >= '${fecha_desde}' AND rt.rt_fecha <= '${fecha_hasta}'
                      AND dis.dis_sucursal = ${sucursal} ${where}`;
    
    return db.sql(query);
  }

  function actualizar_confirmacion(codigo, tipo, etapa){
    const query = `UPDATE ${TABLA} SET rt_confirmado = ${etapa} WHERE rt_codigo = ${codigo}`;
    return db.sql(query);
  }

  function reagendar(codigo, fecha, hora, doctor, consultorio, disponibilidad){
    const query = `UPDATE ${TABLA} SET rt_fecha = '${fecha}', rt_hora = '${hora}', rt_especialista = '${doctor}', rt_consultorio = ${consultorio}, rt_disponibilidad = ${disponibilidad} WHERE rt_codigo = ${codigo}`
    return db.sql(query);
  }

  function anular(id){
    const where_update = "rt_codigo = " + id;
    const set_campo = " rt_estado = 0 "
    return db.eliminar(TABLA, where_update, set_campo);
  }

  return{
    todos, actualizar_confirmacion, reagendar, anular
  } 
}