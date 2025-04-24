const TABLA = 'bloques';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(){
        const query = `SELECT blo_codigo, TRIM(blo_descripcion) as blo_descripcion, blo_piso, blo_estado FROM ${TABLA} WHERE blo_estado = 1`;
        return db.sql(query);
    }

    function usuario(user){
        const query = `SELECT blo_codigo FROM ${TABLA} WHERE blo_oper_turnero = ${user}`;
        return db.sql(query);
    }

    return{
        todos, usuario
    } 
}