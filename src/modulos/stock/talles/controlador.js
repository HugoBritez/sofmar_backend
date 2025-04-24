const TABLA = 'talles r';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(tipo){
        let tipo_where = "";
        if (tipo){
            tipo_where = `AND t_tipo = ${tipo}`
        }

        const campos = " t_codigo, t_descripcion, t_tipo "
        const where = ` t_estado = 1 ${tipo_where} ORDER BY t_descripcion`
        return db.todos(TABLA, campos, where);
    }

    function agregar(datos){
        const primary_key_value = datos.t_codigo;
        const primary_key_name = "t_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `t_codigo = ${id} `;
        const campos = " * "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "t_codigo = " + id;
        const set_campo = " t_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    return{
        todos, agregar, uno, eliminar
    } 
}