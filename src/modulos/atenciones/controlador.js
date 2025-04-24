const TABLA = 'atenciones';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function anular(id){
        const where_update = "ate_codigo = " + id;
        const set_campo = " ate_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    function reagendar(codigo, fecha, hora, doctor, consultorio){
        const query = `UPDATE ${TABLA} SET ate_fecha = '${fecha}', ate_hora = '${hora}', ate_doctor = '${doctor}', ate_consultorio = ${consultorio} WHERE ate_codigo = ${codigo}`
        return db.sql(query);
    }

    return{
        anular, reagendar
    } 
}