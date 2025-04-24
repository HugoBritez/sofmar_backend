const TABLA = 'dvl';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(busqueda){
      let where = ''

      if(busqueda){
        where += ` AND d.d_descripcion LIKE '%${busqueda}%'`;
      }

      const query = `SELECT d.d_codigo, d.d_descripcion
                      FROM dvl d
                      WHERE d.d_estado = 1 ${where}`;

      return db.sql(query);
    }

    function agregar(datos){
      const primary_key_value = datos.d_codigo;
      const primary_key_name = "d_codigo";
      return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
      const primary_key = `d_codigo = ${id} `;
      const campos = " * "
      return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "d_codigo = " + id;
        const set_campo = " d_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    return{
        todos, agregar, uno, eliminar
    } 
}