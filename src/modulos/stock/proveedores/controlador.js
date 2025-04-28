const TABLA = 'proveedores p';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(busqueda){
        let where = '';

        if(busqueda) {
            where += ` AND pro_razon LIKE '%${busqueda}%'`;
        }

        const query = `SELECT pro_codigo, pro_razon, zo.zo_descripcion as pro_zona FROM proveedores p
        LEFT JOIN zonas zo ON zo.zo_codigo = p.pro_zona
        WHERE 1=1 ${where} limit 25`;
        return db.sql(query);
    }

    function agregar(datos){
        const primary_key_value = datos.pro_codigo;
        const primary_key_name = "pro_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `pro_codigo = ${id} `;
        const campos = " * "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "pro_codigo = " + id;
        const set_campo = " pro_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    return{
        todos, agregar, uno, eliminar
    } 
}