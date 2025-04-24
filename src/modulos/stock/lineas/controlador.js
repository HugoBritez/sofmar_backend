const TABLA = 'lineas l';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(busqueda){
        let where = ''

        if(busqueda){
            where += ` AND l.li_descripcion LIKE '%${busqueda}%'`;
        }
        
        const query = `SELECT l.li_id, l.li_descripcion
                        FROM lineas l
                        WHERE l.li_estado = 1 ${where}
                        ORDER BY l.li_descripcion`;

        return db.sql(query);
    }

    function agregar(datos){
        const primary_key_value = datos.li_id;
        const primary_key_name = "li_id";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `li_id = ${id} `;
        const campos = " * "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "li_id = " + id;
        const set_campo = " li_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    return{
        todos, agregar, uno, eliminar
    } 
}