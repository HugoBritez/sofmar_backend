const TABLA = ` disponibilidad d
                INNER JOIN doctor_especialidad de ON d.dis_especialista = de.e_codigo
                INNER JOIN especialidades esp ON de.e_especialidad = esp.esp_codigo
                INNER JOIN doctores doc ON de.e_doctor = doc.doc_codigo
                INNER JOIN consultorios con ON d.dis_consultorio = con.con_codigo `;

module.exports = function(dbInyectada) {
    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(p_fecha){
        const campos = ` d.*,
                        esp.esp_descripcion as especialidad,
                        concat(doc.doc_nombres,' ',doc.doc_apellidos) as doctordes,
                        con.con_descripcion as con_descripcion `
        const where = ` dis_estado = 1 and d.dis_fecha = ${p_fecha} `
        return db.todos(TABLA, campos, where);
    }

    function get_doctores(p_fecha, p_especialidad){
        const campos = `   de.e_codigo as  doctor_cod,
                            concat(doc.doc_nombres,' ',doc.doc_apellidos) as doctores_des,
                            con.con_descripcion as con_descripcion,
                            doc.doc_codigo as doctor_id `
        const where = ` dis_estado = 1 and d.dis_fecha = ${p_fecha} and de.e_especialidad = ${p_especialidad} and dis_tipo = 1   
                        GROUP BY doc.doc_codigo `
        return db.todos(TABLA, campos, where);
    }

    function get_doctores_horarios(p_fecha, p_doctor){
        const campos = ` *,  Date_Format(dis_fecha, '%m-%d-%Y') AS fecha, doc.doc_codigo as doctor_id  `
        const where = ` dis_estado = 1 and dis_fecha = ${p_fecha} and dis_especialista = ${p_doctor} and dis_tipo = 1
                        GROUP BY dis_codigo `
        return db.todos(TABLA, campos, where);
    }

    function get_especialidades(p_fecha){
        const campos = `   esp.esp_codigo,
                            esp.esp_descripcion,
                            esp.esp_simbolo `
        const where = ` dis_estado = 1 and d.dis_fecha = ${p_fecha} and dis_tipo = 1 
                        GROUP BY esp.esp_codigo `
        return db.todos(TABLA, campos, where);
    }

    function get_turnos_reservas(p_fecha, p_hora, p_doctor){
      const campos = ` 'Turno ocupado' as retorno `
      const where = ` rt.rt_estado = 1 AND rt.rt_procesado = 0 AND rt.rt_fecha = ${p_fecha} and rt.rt_hora = ${p_hora} and de.e_doctor = ${p_doctor} `
      const TABLA_2 = ` s_reserva_turno rt INNER JOIN doctor_especialidad de ON rt.rt_especialista = de.e_codigo `;
      return db.todos(TABLA_2, campos, where);
    }

    function get_turnos_consultas(p_fecha, p_hora, p_doctor){
      const campos = ` 'Turno ocupado' as retorno `
      const where = ` c.con_estado = 1 and c.con_fecha = ${p_fecha} and c.con_hora = ${p_hora} and de.e_doctor = ${p_doctor} `
      const TABLA_2 = ` consultas c INNER JOIN doctor_especialidad de ON c.con_doctor = de.e_codigo `;
      return db.todos(TABLA_2, campos, where);
    }    

    function get_turnos_estudios(p_fecha, p_hora, p_doctor){
        const campos = ` 'Turno ocupado' as retorno `
        const where = ` a.ate_estado = 1 and a.ate_fecha = ${p_fecha} and a.ate_hora = ${p_hora} and de.e_doctor = ${p_doctor} and a.ate_tipo in (3,4,5) `
        const TABLA_2 = ` atenciones a INNER JOIN doctor_especialidad de ON a.ate_doctor = de.e_codigo `;
        return db.todos(TABLA_2, campos, where);
    }

    return{
        todos, get_doctores, get_doctores_horarios, get_especialidades, get_turnos_reservas, get_turnos_consultas, get_turnos_estudios
    } 
}