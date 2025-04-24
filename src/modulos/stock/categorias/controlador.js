const TABLA = 'categorias c';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(busqueda){
        let where = '';
        if(busqueda){
            where = ` AND ca_descripcion LIKE '%${busqueda}%' `;
        }
        const query = `
            SELECT ca_codigo, ca_descripcion 
            FROM categorias 
            WHERE ca_estado = 1 
            ${where}
            ORDER BY ca_descripcion 
        `;
        return db.sql(query);
    }

    function agregar(datos){
        const primary_key_value = datos.ca_codigo;
        const primary_key_name = "ca_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `ca_codigo = ${id} `;
        const campos = " * "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "ca_codigo = " + id;
        const set_campo = " ca_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    return{
        todos, agregar, uno, eliminar
    } 
}