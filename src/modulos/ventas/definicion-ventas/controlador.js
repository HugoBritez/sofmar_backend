const os = require("os");

const TABLA = "definicion_ventas dv";
const TABLA_SUC =
  "definicion_ventas dv LEFT JOIN sucursales su ON dv.d_sucursal = su.id LEFT JOIN tipo_comprobante tc ON dv.d_comprobante = tc.t_codigo";

const QUERY_TIMBRADO_GENERAL = `SELECT * FROM definicion_ventas WHERE d_activo = 1 LIMIT 1`;

module.exports = function (dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require("../../DB/mysql.js");
  }

  async function obtenerTimbrado(usuario) {
    let query = "";

    const terminal = os.hostname();

    console.log(terminal);
    console.log("buscando timbrado por medio de terminal");

    if (terminal) {
      query = `
        SELECT 
          dt.t_codigo, dt.t_descripcion, dv.d_descripcion, dv.d_nrotimbrado, dv.d_fecha_vence, dv.d_comprobante, dv.d_p_emision, dv.d_establecimiento, dv.d_nroDesde, dv.d_nroHasta, dv.d_nro_secuencia 
        FROM definicion_terminales dt 
        INNER JOIN 
          definicion_ventas dv ON t_definicion = d_codigo WHERE t_estado = 1 
        AND t_descripcion 
        LIKE '%${terminal}%'`;
      let result = await db.sql(query);
      if (result.length > 0) {
        console.log("timbrado encontrado por medio de terminal");
        return result;
      }
    }

    console.log("buscando timbrado por medio de usuario");

    if (usuario) {
      query = `SELECT du.d_codigo, op.op_nombre, op.op_codigo,dv.d_descripcion, dv.d_nrotimbrado, dv.d_fecha_vence, dv.d_comprobante, dv.d_p_emision, dv.d_establecimiento, dv.d_nroDesde, dv.d_nroHasta, dv.d_nro_secuencia FROM definir_usuario du LEFT JOIN operadores op ON du.d_usuario = op.op_codigo LEFT JOIN definicion_ventas dv ON du.d_definicion = dv.d_codigo WHERE d_activo = 1 AND op.op_codigo = ${usuario}`;
      let result = await db.sql(query);
      if (result.length > 0) {
        console.log("timbrado encontrado por medio de usuario");
        return result;
      }
    }

    console.log(query);
    query = QUERY_TIMBRADO_GENERAL;
    console.log("buscando timbrado por medio de general");
    console.log(query);
    return await db.sql(query);
  }

  function uno(id) {
    const primary_key = `dv.d_codigo = ${id} `;
    const campos = " * ";
    return db.uno(TABLA, primary_key, campos);
  }

  function todos(string_busqueda) {
    const campos = " * ";
    const where = ` dv.d_activo = 1 AND (dv.d_descripcion LIKE '%${string_busqueda}%')`;
    return db.todos(TABLA_SUC, campos, where);
  }

  function agregar(datos) {
    const primary_key_value = datos.d_codigo;
    const primary_key_name = "dv.d_codigo";
    return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
  }

  function buscar(timbrado, factura) {
    const nroemisio = factura.substring(0, 3);
    const nroestable = factura.substring(4, 7);
    let query = `
        SELECT
          d.d_codigo,
          d.d_nrotimbrado,
          DATE_FORMAT(d.d_fecha_in, '%Y-%m-%d') AS d_fecha_in,
          DATE_FORMAT(d.d_fecha_vence, '%Y-%m-%d') AS d_fecha_vence,
          d.d_p_emision,
          d.d_establecimiento
        FROM
          operadores a
          LEFT JOIN sucursales b ON a.op_sucursal = b.id
          INNER JOIN definicion_ventas d ON d.d_sucursal = b.id
        WHERE
          d.d_nrotimbrado = '${timbrado}' and 
          d.d_p_emision = '${nroemisio}' and 
          d.d_establecimiento = '${nroestable}'`;

    return db.sql(query);
  }

  function eliminar(id) {
    const where_update = "dv.d_codigo = " + id;
    const set_campo = " dv.d_activo = 0 ";
    return db.eliminar(TABLA, where_update, set_campo);
  }

  async function actualizarUltFactura(numero, codigo) {
    console.log("Actualizando última factura");
    console.log("Número:", numero);
    console.log("Código:", codigo);
    const query = `UPDATE definicion_ventas SET d_nro_secuencia = ${codigo} WHERE d_codigo = ${numero}`;
    console.log("Query:", query);
    return db.sql(query);
  }

  return {
    uno,
    buscar,
    todos,
    agregar,
    eliminar,
    actualizarUltFactura,
    obtenerTimbrado,
  };
};
