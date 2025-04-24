
module.exports = function(dbInyectada) {
    let db = dbInyectada;

    if(!db){
        db = require('../../../DB/mysql.js');
    }


    async function consultarRemisiones(fecha_desde, fecha_hasta){
      const query = `
        SELECT
          r.id,
          DATE_FORMAT(r.fecha, '%d/%m/%Y') as fecha,
          op.op_nombre as operador,
          op.op_nombre as chofer,
          cli.cli_razon as cliente,
          dep.dep_descripcion as deposito,
          r.comprobante as nro_remision,
          tr.descripcion as tipo_remision,
          r.factura,
          r.timbrado,
          r.vehiculo,
          DATE_FORMAT(r.fecha_d, '%d/%m/%Y') as fecha_salida,
          DATE_FORMAT(r.fecha_h, '%d/%m/%Y') as fecha_llegada,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', dr.id,
              'cantidad', dr.cantidad,
              'articulo_id', ar.ar_codigo,
              'cod_barras', ar.ar_codbarra,
              'articulo_descripcion', ar.ar_descripcion,
              'lote', dr.lote,
              'lote_id', dr.codlote,
              'vencimiento', dr.vence
            )
          ) as items
        FROM remisiones r
        INNER JOIN operadores op ON r.operador = op.op_codigo
        LEFT JOIN operadores op2 ON r.chofer = op2.op_codigo
        INNER JOIN clientes cli ON r.cliente = cli.cli_codigo
        INNER JOIN depositos dep ON r.deposito = dep.dep_codigo
        INNER JOIN tipos_remision tr ON r.tipo = tr.id
        INNER JOIN remisiones_items dr ON r.id = dr.remision
        INNER JOIN articulos ar ON dr.articulo = ar.ar_codigo
        WHERE r.fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'
        GROUP BY r.id
        ORDER BY r.fecha DESC
      `
      console.log(query)
      const datos = await db.sql(query)
      return datos
    }

    async function obtenerRemisionesParaVenta(remisionId, cliente){

      let clienteQuery = ''

      if(cliente){
        clienteQuery = ` AND r.cliente = '${cliente}'`
      }

      const query = 
      `
        SELECT
          r.cliente,
          r.operador,
          r.id,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'codigo', dr.id,
              'articulo', dr.articulo,
              'cantidad', dr.cantidad,
              'precio', dr.precio,
              'decuento', 0,
              'lote', dr.lote,
              'lote_id', dr.codlote
            )
          ) as items
        FROM remisiones r
        INNER JOIN remisiones_items dr ON r.id = dr.remision
        WHERE r.id = ${remisionId} ${clienteQuery}
      `
      return db.sql(query)
    }
   
  return{
    consultarRemisiones,
    obtenerRemisionesParaVenta
  }
}