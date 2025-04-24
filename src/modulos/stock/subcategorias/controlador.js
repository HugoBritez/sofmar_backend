const TABLA = 'subcategorias sc';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(busqueda){
        console.log('### AQUI ESTA LA BUSQUEDA ###', busqueda);
        let busqueda_query = '';

        if(busqueda){
            busqueda_query += ` AND sc.sc_descripcion LIKE '%${busqueda}%'`;
        }

        const query = `SELECT sc.sc_codigo, sc.sc_descripcion, c.ca_descripcion as categoria
                        FROM subcategorias sc
                        INNER JOIN categorias c ON c.ca_codigo = sc.sc_categoria
                        WHERE sc.sc_estado = 1 ${busqueda_query}
                        ORDER BY sc.sc_descripcion`;

        return db.sql(query);
    }

    function agregar(datos){
        const primary_key_value = datos.sc_codigo;
        const primary_key_name = "sc_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `sc_codigo = ${id} `;
        const campos = " * "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "sc_codigo = " + id;
        const set_campo = " sc_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    return{
        todos, agregar, uno, eliminar
    } 
}