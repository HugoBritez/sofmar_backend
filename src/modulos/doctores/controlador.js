const TABLA = 'doctores';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(operador){
        let tabla = ` doctor_especialidad de
        INNER JOIN doctores d ON de.e_doctor = d.doc_codigo
        INNER JOIN especialidades esp ON de.e_especialidad = esp.esp_codigo `;
        const campos = "de.e_codigo, CONCAT(d.doc_nombres,' ', d.doc_apellidos,' - ', esp.esp_descripcion) AS docnom";
        let where = " d.doc_estado = 1 AND de.e_estado = 1 "
        
        if (operador){
            tabla += ` INNER JOIN relacion_operacion_doctores r ON r.rod_doctor = d.doc_codigo`;
            where += ` AND r.rod_operador = ${operador}`;
        }
        
        return db.todos(tabla, campos, where);
    }

    return{
        todos
    } 
}