const TABLA = 'prestadores';
const OPER_PREST = 'operador_prestadores opre LEFT JOIN prestadores pr ON opre.opre_prestador = pr.pr_codigo LEFT JOIN operadores op ON opre_operador = op.op_codigo';

module.exports = function(dbInyectada) {
    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(){
        let query = `SELECT * FROM ${TABLA} WHERE pr_estado = 1`;
        return db.sql(query);
    }

    function operador(user, prestador=0){
        let query = `SELECT * FROM ${OPER_PREST} WHERE pr_estado = 1 AND opre_operador = ${user} AND opre_estado = 1`;
        if (prestador > 0){
            query += ` AND opre_prestador = ${prestador}`;
        }
        return db.sql(query);
    }

    function getOperadoresPrestadores(string_busqueda){
        let query = `SELECT * FROM ${OPER_PREST} WHERE opre_estado = 1 AND (op.op_nombre LIKE '%${string_busqueda}%' OR pr.pr_descripcion LIKE '%${string_busqueda}%')`;
        return db.sql(query);
    }

    function unoOperadoresPrestadores(id){
        const primary_key = `opre_codigo = ${id} `;
        const campos = "* "
        return db.uno(OPER_PREST, primary_key, campos);
    }

    function agregarOperadoresPrestadores(datos){
        const primary_key_value = datos.opre_codigo;
        const primary_key_name = "opre_codigo";
        return db.agregar("operador_prestadores", datos, primary_key_value, primary_key_name);
    }

    function agregarOperadoresPrestadoresTodos(datos){
        let query = `SELECT * FROM `
        const primary_key_name = "opre_codigo";
        return db.agregar("operador_prestadores", datos, primary_key_value, primary_key_name);
    }

    function eliminarOperadoresPrestadores(id){
        const where_update = "opre_codigo = " + id;
        const set_campo = " opre_estado = 0 "
        return db.eliminar(OPER_PREST, where_update, set_campo);
    }

    return{
        todos, operador, getOperadoresPrestadores, unoOperadoresPrestadores, eliminarOperadoresPrestadores, agregarOperadoresPrestadores, agregarOperadoresPrestadoresTodos
    }
}