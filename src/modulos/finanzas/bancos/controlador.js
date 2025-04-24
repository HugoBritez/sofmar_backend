const TABLA = "cotizaciones";

module.exports = function (dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require("../../../DB/mysql.js");
  }

  async function listarBancos() {
    return db.sql(
        `SELECT * FROM bancos where ba_estado = 1`,
    );
  }

  async function listarCuentasBancarias() {
    return db.sql(
        `SELECT * FROM cuentasbco where cb_estado = 1`,
    );
}

async function tarjetas() {
      return db.sql(
        `SELECT * FROM tarjetas where t_estado = 1`,
      );
}

  
  return {
    listarBancos,
    listarCuentasBancarias,
    tarjetas
  };
};
