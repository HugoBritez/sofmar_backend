const TABLA = `  disponibilidad d
INNER JOIN doctor_especialidad de ON d.dis_especialista = de.e_codigo
INNER JOIN especialidades esp ON de.e_especialidad = esp.esp_codigo
INNER JOIN doctores doc ON de.e_doctor = doc.doc_codigo `;

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(p_fecha){
        const campos = `   esp.esp_codigo,
                            esp.esp_descripcion `
        const where = ` dis_estado = 1 and d.dis_fecha = ${p_fecha} 
                        GROUP BY esp.esp_codigo`
        return db.todos(TABLA, campos, where);
    }

    return{
        todos
    } 
}