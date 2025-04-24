const TABLA = 'bloques_articulos b';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(){
        const campos = " b_codigo, b_descripcion "
        const where = ` b_estado = 1 ORDER BY b_descripcion`
        return db.todos(TABLA, campos, where);
    }

    function agregar(datos){
        const primary_key_value = datos.b_codigo;
        const primary_key_name = "b_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `b_codigo = ${id} `;
        const campos = " * "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "b_codigo = " + id;
        const set_campo = " b_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    return{
        todos, agregar, uno, eliminar
    } 
}