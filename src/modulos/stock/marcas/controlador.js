const TABLA = 'marcas m';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(busqueda){
        let where = '';

        if(busqueda){
            where = ` AND ma_descripcion LIKE '%${busqueda}%' `;
        }

        const query = `SELECT ma_codigo, ma_descripcion FROM marcas WHERE 1=1 ${where} ORDER BY ma_descripcion`;
        return db.sql(query);
    }

    function agregar(datos){
        const primary_key_value = datos.ma_codigo;
        const primary_key_name = "ma_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `ma_codigo = ${id} `;
        const campos = " * "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "ma_codigo = " + id;
        const set_campo = " ma_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    return{
        todos, agregar, uno, eliminar
    } 
}