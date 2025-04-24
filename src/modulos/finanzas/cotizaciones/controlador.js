const TABLA = "cotizaciones";

module.exports = function (dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require("../../../DB/mysql.js");
  }

  async function listar() {
    let query = `SELECT
    fecha,
    MAX(CASE WHEN moneda = 'DOLAR' THEN venta END) as usd_venta,
    MAX(CASE WHEN moneda = 'DOLAR' THEN compra END) as usd_compra,
    MAX(CASE WHEN moneda = 'REAL' THEN venta END) as brl_venta,
    MAX(CASE WHEN moneda = 'REAL' THEN compra END) as brl_compra,
    MAX(CASE WHEN moneda = 'PESO' THEN venta END) as ars_venta,
    MAX(CASE WHEN moneda = 'PESO' THEN compra END) as ars_compra
FROM (
    SELECT
        DATE(co.co_fecha) as fecha,
        mo.mo_descripcion as moneda,
        co.co_monto as venta,
        co.co_monto_c as compra
    FROM cotizaciones co
    LEFT JOIN monedas mo ON mo.mo_codigo = co.co_moneda
) t
GROUP BY fecha
ORDER BY fecha DESC
LIMIT 1;`;
    return db.sql(query);
  }

  function agregarCotizacion(datos) {
    const primary_key_value = datos.co_codigo;
    const primary_key_name = "co_codigo";
    return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
  }

  function modificarCotizacion(datos) {
    return db.sql(
      `UPDATE cotizaciones SET co_monto = ${datos.co_monto}, co_monto_c = ${datos.co_monto_c} WHERE co_moneda = ${datos.co_moneda} AND co_fecha = '${datos.co_fecha}'`
    );
  }

  return {
    listar,
    agregarCotizacion,
    modificarCotizacion,
  };
};
