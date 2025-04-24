const TABLA = `  disponibilidad `;

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(p_fecha, p_especialidad, p_doctor){
        const campos = ` *,  Date_Format(dis_fecha, '%d-%m-%Y') AS fecha `
        const where = ` dis_estado = 1 and dis_fecha = ${p_fecha} and dis_especialista = ${p_doctor}
                        GROUP BY dis_codigo `
        return db.todos(TABLA, campos, where);
    }

    return{
        todos
    } 
}