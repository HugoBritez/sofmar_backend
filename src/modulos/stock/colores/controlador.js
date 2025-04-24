const TABLA = 'colores c';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(){
        const campos = " c_codigo, c_descripcion "
        const where = ` c_estado = 1 ORDER BY c_descripcion`
        return db.todos(TABLA, campos, where);
    }

    function agregar(datos){
        const primary_key_value = datos.c_codigo;
        const primary_key_name = "c_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `c_codigo = ${id} `;
        const campos = " * "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "c_codigo = " + id;
        const set_campo = " c_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    return{
        todos, agregar, uno, eliminar
    } 
}