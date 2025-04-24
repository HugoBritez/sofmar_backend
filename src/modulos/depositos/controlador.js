const TABLA = `depositos de
                INNER JOIN operador_depositos od ON od.ode_deposito = de.dep_codigo `;

module.exports = function(dbInyectada) {
    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    async function todos_filtro(id_sucursal, operador){
      let query = `SELECT de.dep_codigo, de.dep_descripcion
      FROM depositos de
      INNER JOIN operador_depositos od ON od.ode_deposito = de.dep_codigo
      WHERE de.dep_estado = 1 AND od.ode_operador = ${operador}`
        
      let resultado = await db.sql(query);

      if (resultado.length <= 0){
        query = `SELECT de.dep_codigo, de.dep_descripcion FROM depositos de WHERE de.dep_estado = 1`
        resultado = await db.sql(query);
      }

      return resultado;
    }

    function todos_sucursal(sucursales){
        const query = `SELECT de.dep_codigo, de.dep_descripcion FROM depositos de WHERE de.dep_estado = 1 and de.dep_sucursal IN (${sucursales})`
        return db.sql(query);
    }

    function todos(){
        const query = "SELECT dep_codigo, dep_descripcion, dep_principal FROM depositos WHERE dep_estado = 1"

        
        return db.sql(query);
    }

    return{
        todos_filtro, todos_sucursal, todos
    } 
}

