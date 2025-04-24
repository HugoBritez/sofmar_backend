

const TABLA = "configuraciones";

module.exports = function (dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require("../../../DB/mysql.js");
  }

  function getConfiguraciones() {
    const query = `SELECT * FROM configuraciones`;
    return db.sql(query);
  }

  function todosSinQuery() {
    const campos = "* ";
    const where = ` 1 = 1 `;
    return db.todos(TABLA, campos, where);
  }

  function todos(string_busqueda) {
    const campos = "* ";
    const where = ` descripcion LIKE '%${string_busqueda}%' `;
    return db.todos(TABLA, campos, where);
  }

  function por_id(id) {
    const query = `SELECT * FROM configuraciones WHERE id = ${id}`;
    console.log(query);
    return db.sql(query);
  }

  function modificar(id, valor) {
    const query = `UPDATE ${TABLA} SET valor = ${valor} WHERE id = ${id}`;
    return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
  }

  function getConfiguraciones() {
    return db.sql(
      `SELECT *, Date_Format(curdate(), '%d-%m-%Y') AS fecha, CURTIME() AS hora FROM configuraciones`
    );
  }

  return {
    todos,
    por_id,
    modificar,
    getConfiguraciones,
    todosSinQuery,
    getConfiguraciones,
  };
};