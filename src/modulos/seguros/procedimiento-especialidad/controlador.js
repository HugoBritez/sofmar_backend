const TABLA = 'procedimientos_especialidades_visacion';

module.exports = function(dbInyectada) {
    let db = dbInyectada;

    if(!db){
        db = require('../../../DB/mysql.js');
    }

    function todos(string_busqueda){
      let query =
      `SELECT
        pev.pev_codigo AS codigo,
        esp.esp_descripcion AS especialidad,
        tc.tc_descripcion AS procedimiento
      FROM
        procedimientos_especialidades_visacion pev
        INNER JOIN especialidades esp ON esp.esp_codigo = pev.pev_especialidad
        INNER JOIN tipo_consulta tc ON tc.tc_codigo = pev.pev_procedimiento
      WHERE
        pev.pev_proc_tipo = 1
        AND (esp.esp_descripcion LIKE '%${string_busqueda}%' OR tc.tc_descripcion LIKE '%${string_busqueda}%')
        
      UNION ALL
      
      SELECT
        pev.pev_codigo AS codigo,
        esp.esp_descripcion AS especialidad,
        pro.proc_descripcion AS procedimiento
      FROM
        procedimientos_especialidades_visacion pev
        INNER JOIN especialidades esp ON esp.esp_codigo = pev.pev_especialidad
        INNER JOIN procedimientos pro ON pro.proc_codigo = pev.pev_procedimiento
      WHERE
        pev.pev_proc_tipo <> 1
        AND (esp.esp_descripcion LIKE '%${string_busqueda}%' OR pro.proc_descripcion LIKE '%${string_busqueda}%')`;

      return db.sql(query);
  }

  function agregar(datos){
      const primary_key_value = datos.pev_codigo;
      const primary_key_name = "pev_codigo";
      return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
  }

  function uno(id){
      const primary_key = `pev_codigo = ${id} `;
      const campos = " * "
      return db.uno(TABLA, primary_key, campos);
  }
  
  function eliminar(id){
    const query = `DELETE FROM procedimientos_especialidades_visacion WHERE pev_codigo = ${id}`
    return db.sql(query);
  }

  return{
      todos, agregar, uno, eliminar
  } 
}