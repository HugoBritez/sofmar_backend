const TABLA = 'auditoria';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function agregar(datos){
      const query = `INSERT INTO ${TABLA}
                    (entidad, accion, fecha, idReferencia, usuario, vendedor, obs)
                    VALUES
                    (${datos.entidad}, ${datos.accion}, NOW(), ${datos.idReferencia}, '${datos.usuario}', ${datos.vendedor}, '${datos.obs}')`;
      return db.sql(query);
  }

    return{
        agregar
    } 
}