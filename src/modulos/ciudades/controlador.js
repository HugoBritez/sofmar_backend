const TABLA = 'ciudades';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../DB/mysql.js');
    }

    function todos(){
        const campos = " ciu_codigo, ciu_descripcion, ciu_departamento "
        const where = ` ciu_estado = 1 AND ciu_cod_interno !=0 ORDER BY ciu_descripcion`
        return db.todos(TABLA, campos, where);
    }

    function agregar(datos){
        const primary_key_value = datos.ciu_codigo;
        const primary_key_name = "ciu_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `ciu_codigo = ${id} `;
        const campos = " * "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "ciu_codigo = " + id;
        const set_campo = " ciu_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    return{
        todos, agregar, uno, eliminar
    } 
}