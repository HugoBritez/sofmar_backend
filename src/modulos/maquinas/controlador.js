const TABLA = 's_maquinas';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../../DB/mysql.js');
    }

    function todos(string_busqueda){
        const campos = "*, DATE_FORMAT(sm_fecha_nro_ser, '%d-%m-%Y') as fecha "
        const where = ` sm_estado = 1 and (sm_nombre like '%${string_busqueda}%' or sm_descripcion like '%${string_busqueda}%') `
        return db.todos(TABLA, campos, where);
    }

    function agregar(datos){
        const primary_key_value = datos.sm_codigo;
        const primary_key_name = "sm_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `sm_codigo = ${id} `;
        const campos = "sm_codigo, sm_nombre, sm_descripcion, DATE_FORMAT(sm_fecha_nro_ser, '%Y-%m-%d') as sm_fecha_nro_ser, sm_nro_serie "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "sm_codigo = " + id;
        const set_campo = " sm_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    return{
        todos, agregar, uno, eliminar
    } 
}