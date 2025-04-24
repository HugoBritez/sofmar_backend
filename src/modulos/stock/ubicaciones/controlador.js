const TABLA = 'ubicaciones u';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(){
        const campos = " ub_codigo, ub_descripcion "
        const where = ` ub_estado = 1 `
        return db.todos(TABLA, campos, where);
    }

    function agregar(datos){
        const primary_key_value = datos.ub_codigo;
        const primary_key_name = "ub_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `u.ub_codigo = ${id} `;
        const campos = " * "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "u.ub_codigo = " + id;
        const set_campo = " u.ub_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    return{
        todos, agregar, uno, eliminar
    } 
}