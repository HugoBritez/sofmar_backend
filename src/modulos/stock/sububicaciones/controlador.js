const TABLA = 'sub_ubicacion su';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(){
        const campos = " * "
        const where = ` su.s_estado = 1 `
        return db.todos(TABLA, campos, where);
    }

    function agregar(datos){
        const primary_key_value = datos.s_codigo;
        const primary_key_name = "s_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `su.s_codigo = ${id} `;
        const campos = " * "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "su.s_codigo = " + id;
        const set_campo = " su.s_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    return{
        todos, agregar, uno, eliminar
    } 
}