const TABLA = `  disponibilidad d
                INNER JOIN doctor_especialidad de ON d.dis_especialista = de.e_codigo
                INNER JOIN especialidades esp ON de.e_especialidad = esp.esp_codigo
                INNER JOIN doctores doc ON de.e_doctor = doc.doc_codigo `;

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(p_fecha, p_especialidad){
        const campos = `   de.e_codigo as  doctor_cod,
                            concat(doc.doc_nombres,' ',doc.doc_apellidos) as doctores_des `
        const where = ` dis_estado = 1 and d.dis_fecha = ${p_fecha} and de.e_especialidad = ${p_especialidad}
                        GROUP BY doc.doc_codigo `
        return db.todos(TABLA, campos, where);
    }

    return{
        todos
    } 
}