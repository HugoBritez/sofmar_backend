const CABECERA = "pedidos";
const DETALLES = "detalle_pedido";

module.exports = function (dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require("../../../DB/mysql.js");
  }

  async function getPedidosNuevo(
    fecha_desde,
    fecha_hasta,
    nro_pedido,
    articulo,
    clientes,
    vendedores,
    sucursales,
    estado, //1- pendiente, 2- procesado, 3- todos
    moneda,
    factura
  ){

    console.log('empezando getPedidosNuevo');
    let where = "1 = 1 ";
    if(nro_pedido) {
      where += ` AND p.p_codigo = '${nro_pedido}'`;
    } else {
      if(fecha_desde && fecha_hasta){
        where += ` AND p.p_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'`;
      } else if (fecha_desde){
        where += ` AND p.p_fecha >= '${fecha_desde}'`;
      } else if (fecha_hasta){
        where += ` AND p.p_fecha <= '${fecha_hasta}'`;
      }

      if(articulo) where += ` AND p.p_codigo IN (SELECT z.dp_pedido FROM detalle_pedido z WHERE dp_articulo = ${articulo})`;

      if(clientes) where += ` AND p.p_cliente IN (${clientes})`;

      if(vendedores) where += ` AND p.p_vendedor IN (${vendedores})`;

      if(sucursales) where += ` AND p.p_sucursal IN (${sucursales})`;

      if(moneda) where += ` AND p.p_moneda = ${moneda}`;

      if(factura && factura.length > 0) where += ` AND p.p_codigo IN (SELECT x.ve_pedido FROM ventas x WHERE ve_factura = '${factura}')`;
      
      if(estado === '1') where += ` AND p.p_estado = 1`;
      if(estado === '2') where += ` AND p.p_estado = 2`;
      if(estado === '3') where += ` AND (p.p_estado = 1 OR p.p_estado = 2)`;
    }

    let query = `
      SELECT
        p.p_codigo AS pedido_id,
        cli.cli_razon as cliente,
        m.mo_descripcion as moneda,
        p.p_fecha as fecha,
        IFNULL(vp.ve_factura, '') as factura,
        a.a_descripcion as area,
        IFNULL((SELECT
          area.a_descripcion AS descripcion
          FROM area_secuencia arse
          INNER JOIN area area ON arse.ac_secuencia_area = area.a_codigo
          WHERE arse.ac_area = p.p_area
        ), '-') as siguiente_area,
        IF(p.p_estado = 1, 'Pendiente', IF(p.p_estado = 2, 'Facturado', 'Todos')) as estado,
        IF(p.p_credito = 1, 'Crédito', 'Contado') as condicion,
        op.op_nombre as operador,
        ope.op_nombre as vendedor,
        dep.dep_descripcion as deposito,
        p.p_cantcuotas,
        p.p_entrega,
        p.p_autorizar_a_contado,
        p.p_imprimir as imprimir,
        p.p_imprimir_preparacion as imprimir_preparacion,
        p.p_cliente as cliente_id,
        p.p_cantidad_cajas as cantidad_cajas,
        IFNULL(p.p_obs, '') as obs,
        FORMAT(ROUND(SUM(dp.dp_cantidad  * (dp.dp_precio - dp.dp_descuento)), 0), 0) as total,
        IF(p.p_acuerdo = 1, 'Tiene acuerdo comercial', '') as acuerdo,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'codigo', dp.dp_articulo,
              'descripcion_articulo', IF(dp.dp_descripcion_art = '', ar.ar_descripcion, dp.dp_descripcion_art),
              'cantidad_vendida', dp.dp_cantidad - IFNULL(
              (
                SELECT SUM(dv.deve_cantidad)
                FROM detalle_ventas dv
                INNER JOIN ventas v ON dv.deve_venta = v.ve_codigo
                INNER JOIN detalle_ventas_vencimiento dvv ON dv.deve_codigo = dvv.id_detalle_venta
                WHERE
                  v.ve_pedido = dp.dp_pedido
                AND v.ve_estado = 1
                AND dv.deve_articulo = dp.dp_articulo
                AND dvv.loteid = dp.dp_codigolote
                ), 0),
              'bonificacion', IF(dp.dp_bonif = 0, 'V', 'B'),
              'd_cantidad', IFNULL(df.d_cantidad, 0),
              'precio', FORMAT(ROUND(dp.dp_precio, 0), 0),
              'ultimo_precio', FORMAT(ROUND(IFNULL(
                  (
                    SELECT
                      (dc.dc_precio + dc.dc_recargo) as dc_precio
                    FROM detalle_compras dc
                    INNER JOIN
                      compras c ON dc.dc_compra = c.co_codigo
                    WHERE
                      dc.dc_articulo = dp.dp_articulo
                    AND 
                      c.co_moneda = p.p_moneda
                    AND
                      c.co_estado = 1
                    AND 
                      c.co_fecha <= p.p_fecha
                    ORDER BY c.co_fecha DESC
                    LIMIT 1
                  ),
                  ar.ar_pcg
              ), 0), 0),
              'porc_costo', ROUND(IFNULL(((dp.dp_precio - 
                IFNULL((SELECT 
                          (dc.dc_precio + dc.dc_recargo) as dc_precio
                         FROM
                           detalle_compras dc
                           INNER JOIN
                             compras c ON dc.dc_compra = c.co_codigo
                         WHERE
                           dc.dc_articulo = dp.dp_articulo
                         AND
                           c.co_moneda = p.p_moneda
                         AND
                           c.co_estado = 1
                         AND
                           c.co_fecha <= p.p_fecha
                         ORDER BY c.co_fecha DESC
                         LIMIT 1
                         ),
                      ar.ar_pcg
                      ))*100)/
                          IFNULL((SELECT
                             (dc.dc_precio + dc.dc_recargo) as dc_precio
                           FROM
                             detalle_compras dc 
                             INNER JOIN compras c ON dc.dc_compra = c.co_codigo
                           WHERE
                             dc.dc_articulo = dp.dp_articulo AND
                             c.co_moneda = p.p_moneda AND
                             c.co_estado = 1 AND
                             c.co_fecha <= p.p_fecha
                           ORDER BY
                             dc.dc_compra DESC
                           LIMIT 1), ar.ar_pcg), 0), 2),
              'porcentaje', ROUND(IFNULL(((dp.dp_precio-
                    IFNULL((SELECT
                      (dc.dc_precio+dc.dc_recargo) as dc_precio
                    FROM
                      detalle_compras dc 
                      INNER JOIN compras c ON dc.dc_compra = c.co_codigo
                    WHERE
                      dc.dc_articulo = dp.dp_articulo AND
                      c.co_moneda = p.p_moneda AND
                      c.co_estado = 1 AND
                      c.co_fecha <= p.p_fecha
                    ORDER BY
                      dc.dc_compra DESC
                    LIMIT 1), ar.ar_pcg))*100)/dp.dp_precio,0), 2),
              'descuento', FORMAT(ROUND(dp.dp_descuento, 0), 0),
              'exentas', FORMAT(ROUND(dp.dp_exentas - IFNULL((
                SELECT SUM(dv.deve_exentas)
                FROM detalle_ventas dv
                INNER JOIN ventas v ON dv.deve_venta = v.ve_codigo
                INNER JOIN detalle_ventas_vencimiento t ON dv.deve_codigo = t.id_detalle_venta
                WHERE v.ve_pedido = dp.dp_pedido
                AND v.ve_estado = 1
                AND t.loteid = dp.dp_codigolote
              ), 0), 0), 0),
              'cinco', FORMAT(ROUND(dp.dp_cinco - IFNULL((
                SELECT SUM(dv.deve_cinco)
                FROM detalle_ventas dv
                INNER JOIN ventas v ON dv.deve_venta = v.ve_codigo
                INNER JOIN detalle_ventas_vencimiento t ON dv.deve_codigo = t.id_detalle_venta
                WHERE v.ve_pedido = dp.dp_pedido
                AND v.ve_estado = 1
                AND t.loteid = dp.dp_codigolote
              ), 0), 0), 0),
              'diez', FORMAT(ROUND(dp.dp_diez - IFNULL((
                SELECT SUM(dv.deve_diez)
                FROM detalle_ventas dv
                INNER JOIN ventas v ON dv.deve_venta = v.ve_codigo
                INNER JOIN detalle_ventas_vencimiento t ON dv.deve_codigo = t.id_detalle_venta
                WHERE v.ve_pedido = dp.dp_pedido
                AND v.ve_estado = 1
                AND t.loteid = dp.dp_codigolote
              ), 0), 0), 0),
              'dp_lote', IFNULL(dp.dp_lote, ''),
              'vencimiento', IF(dp.dp_vence = '0001-01-01', '', DATE_FORMAT(dp.dp_vence, '%d/%m/%Y')),
              'comision', IF(dp.dp_porcomision = 0, dp.dp_porcomision, ar.ar_comision),
              'actorizado', dp.dp_actorizado,
              'obs', IFNULL(dp.dp_obs, ''),
              'cant_stock',
                  IFNULL(
                  IF(dp.dp_codigolote = 0,
                      (SELECT ad.artdep_cantidad
                       FROM articulos_depositos ad
                       WHERE ad.artdep_articulo = ar.ar_codigo
                       AND ad.artdep_deposito = p.p_deposito),
                      (SELECT al.al_cantidad
                       FROM articulos_lotes al
                       WHERE al.al_articulo = ar.ar_codigo
                       AND al.al_deposito = p.p_deposito
                       AND al.al_codigo = dp.dp_codigolote)
                  ), 0
              ),
              'dp_codigolote', dp.dp_codigolote,
              'cant_pendiente',
                  IFNULL((
                    SELECT
                      SUM(g.dp_cantidad) as cantpendiente
                    FROM
                      detalle_pedido g
                    INNER JOIN pedidos s ON g.dp_pedido = s.p_codigo
                    WHERE
                      s.p_estado = 1
                      AND g.dp_articulo = dp.dp_articulo
                      AND g.dp_codigolote = dp.dp_codigolote
                    ), 0),
              'cantidad_verificada',
                IF(
                    dp.dp_cantidad = (dp.dp_cantidad - IFNULL((
                      SELECT 
                        SUM(dv.deve_cantidad)
                      FROM
                        detalle_ventas dv
                      INNER JOIN ventas v ON dv.deve_venta = v.ve_codigo
                      INNER JOIN detalle_ventas_vencimiento t ON dv.deve_codigo = t.id_detalle_venta
                      WHERE
                        v.ve_pedido = dp.dp_pedido AND
                        v.ve_estado = 1 AND
                        t.loteid = dp.dp_codigolote
                      ), 0)
                    ), 1, 0)
            )
          )
          FROM detalle_pedido dp
          INNER JOIN articulos ar ON dp.dp_articulo = ar.ar_codigo
          LEFT JOIN detalle_faltante df ON dp.dp_codigo = df.d_detalle_pedido
          INNER JOIN sub_ubicacion su ON ar.ar_sububicacion = su.s_codigo
          WHERE dp.dp_pedido = p.p_codigo
          AND dp.dp_cantidad > 0
        ) as detalles
      FROM pedidos p
      LEFT JOIN clientes cli ON p.p_cliente = cli.cli_codigo
      LEFT JOIN monedas m ON p.p_moneda = m.mo_codigo
      LEFT JOIN operadores op ON p.p_operador = op.op_codigo
      LEFT JOIN operadores ope ON p.p_vendedor = ope.op_codigo
      LEFT JOIN area a ON p.p_area = a.a_codigo
      LEFT JOIN depositos dep ON p.p_deposito = dep.dep_codigo
      LEFT JOIN ventas vp ON p.p_codigo = vp.ve_pedido
      LEFT JOIN detalle_pedido dp ON p.p_codigo = dp.dp_pedido
      WHERE  ${where}
      GROUP BY p.p_codigo
      ORDER BY p.p_cliente DESC
    `;
    console.log(query);
    return await db.sql(query);
  }

  function uno(cod) {

    const primary_key = `p_codigo = ${cod} `;
    const campos = " *, DATE_FORMAT(p_fecha, '%Y-%m-%d') AS fecha ";
    return db.uno(CABECERA, primary_key, campos);
  }

  function getCabeceras(
    fecha_desde,
    fecha_hasta,
    sucursal,
    cliente,
    vendedor,
    articulo,
    moneda,
    factura,
    limit
) {
    let where = "1 = 1";
    if (fecha_desde) where += ` AND p.p_fecha >= '${fecha_desde}'`;
    if (fecha_hasta) where += ` AND p.p_fecha <= '${fecha_hasta}'`;
    if (sucursal) where += ` AND p.p_sucursal = '${sucursal}'`;
    if (cliente) where += ` AND p.p_cliente = '${cliente}'`;
    if (vendedor) where += ` AND p.p_vendedor = '${vendedor}'`;
    if (articulo)
        where += ` AND p.p_codigo IN (SELECT z.dp_pedido FROM detalle_pedido z WHERE dp_articulo = ${articulo})`;
    if (moneda) where += ` AND p.p_moneda = ${moneda}`;
    if (factura && factura.length > 0)
        where += ` AND p.p_codigo IN (SELECT x.ve_pedido FROM ventas x WHERE ve_factura = '${factura}')`;

    let query = `SELECT
                  p.p_codigo AS codigo,
                  cli.cli_codigo AS codcliente,
                  cli.cli_razon AS cliente,
                  mo.mo_descripcion AS moneda,
                  DATE_FORMAT(p.p_fecha, "%d/%m/%Y") AS fecha,
                  p.p_sucursal AS codsucursal,
                  s.descripcion AS sucursal,
                  v.op_nombre AS vendedor,
                  o.op_nombre AS operador,
                  SUM((dp.dp_precio - dp.dp_descuento) * dp.dp_cantidad) - p.p_descuento AS total,
                  p.p_descuento AS descuento,
                  0 AS saldo,
                  IF (p.p_credito = 1, "Crédito", "Contado") AS condicion,
                  "0000-00-00" AS vencimiento, #Pedidos no tienen vencimiento
                  IF(ve.ve_factura, ve.ve_factura, "") AS factura,
                  p.p_obs AS obs,
                  p.p_estado AS estado,
                  tp.tp_descripcion AS estado_desc,
                  aac.a_descripcion AS area_actual,
                  ast.a_descripcion AS area_sgte
                FROM
                  pedidos p
                  INNER JOIN clientes cli ON p.p_cliente = cli.cli_codigo
                  INNER JOIN monedas mo ON p.p_moneda = mo.mo_codigo
                  INNER JOIN operadores v ON p.p_vendedor = v.op_codigo
                  INNER JOIN operadores o ON p.p_operador = o.op_codigo
                  INNER JOIN sucursales s ON p.p_sucursal = s.id
                  INNER JOIN tipo_estado tp ON tp.tp_codigo = p.p_tipo_estado
                  INNER JOIN detalle_pedido dp ON dp.dp_pedido = p.p_codigo
                  LEFT JOIN ventas ve ON ve.ve_pedido = p.p_codigo
                  LEFT JOIN area aac ON p.p_area = aac.a_codigo
                  LEFT JOIN area_secuencia ON area_secuencia.ac_area = p.p_area
                  LEFT JOIN area ast ON area_secuencia.ac_secuencia_area = ast.a_codigo
                WHERE
                  ${where}
                GROUP BY p.p_codigo
                ORDER BY p.p_codigo DESC`;

    if (limit) {
        query += ` LIMIT ${limit}`;
    }

    return db.sql(query);
}

  function getDetalles(pedido) {
    let query = `SELECT
                  dp.dp_codigo AS det_codigo,
                  ar.ar_codigo AS art_codigo,
                  ar.ar_codbarra AS codbarra,
                  ar.ar_descripcion AS descripcion,
                  ar.ar_pcg as costo,
                  dp.dp_cantidad AS cantidad,
                  dp.dp_precio AS precio,
                  dp.dp_descuento AS descuento,
                  dp.dp_exentas AS exentas,
                  dp.dp_cinco AS cinco,
                  dp.dp_diez AS diez,
                  dp.dp_codigolote AS codlote,
                  dp.dp_lote AS lote, 
                  ar.ar_editar_desc,
                  dp.dp_bonif as bonificacion,                
                  "" AS largura,
                  "" AS altura,
                  "" AS mt2,
                  (SELECT dc.dc_precio 
                   FROM detalle_compras dc 
                   INNER JOIN compras c ON dc.dc_compra = c.co_codigo
                   WHERE dc.dc_articulo = dp.dp_articulo 
                     AND c.co_fecha <= p.p_fecha
                   ORDER BY c.co_fecha DESC 
                   LIMIT 1) AS precio_compra
                FROM
                  detalle_pedido dp
                  INNER JOIN articulos ar ON ar.ar_codigo = dp.dp_articulo
                  INNER JOIN pedidos p ON p.p_codigo = dp.dp_pedido
                WHERE
                  dp.dp_pedido = ${pedido}
                  AND dp_cantidad > 0
                ORDER BY
                  dp.dp_codigo`;
    console.log(query);
    return db.sql(query);
  }

  async function primeraSecuenciaArea() {
    const query = `SELECT * FROM area_secuencia ORDER BY ac_codigo LIMIT 1`;
    return db.sql(query);
  }

  async function agregarCabecera(datos) {
    const primary_key_value = datos.p_codigo;
    const primary_key_name = "p_codigo";
    return db.agregar(CABECERA, datos, primary_key_value, primary_key_name);
  }

  function agregarDetalle(datos) {
    const primary_key_value = datos.dp_codigo;
    const primary_key_name = "dp_codigo";
    return db.agregar(DETALLES, datos, primary_key_value, primary_key_name);
  }

  function eliminarDetalle(id) {
    const query = `DELETE FROM ${DETALLES} WHERE dp_codigo = ${id}`;
    return db.sql(query);
  }

  async function autorizar(pedido, user_name, username, password) {

    const loginResult =
      await require("../../usuarios/controlador.js")().login(
        username,
        password
      );

    if (!loginResult || loginResult.length === 0) {
      return {
        success: false,
        message: "Usuario o contraseña incorrectos",
      };
    }

    // Validar permisos
    if (loginResult[0].op_autorizar !== 1) {
      console.log("No tiene permisos para autorizar");
      return {
        success: false,
        message: "No tiene permisos para autorizar",
      };
    }

    console.log("Tiene permisos para autorizar");
    const area_actual_query = `SELECT p_area FROM pedidos WHERE p_codigo = ${pedido}`;
    const area_actual = await db.sql(area_actual_query);


    const sgte_area_query = `SELECT * FROM area_secuencia WHERE ac_area = ${area_actual[0].p_area} ORDER BY ac_codigo LIMIT 1`;
    const sgte_area = await db.sql(sgte_area_query);

    if (sgte_area.length > 0) {
      const sgte = sgte_area[0].ac_secuencia_area;

      const update = `UPDATE pedidos SET p_area = ${sgte} WHERE p_codigo = ${pedido}`;
      db.sql(update);

      const insert = `INSERT INTO pedidos_estados (pe_codigo, pe_pedido, pe_area, pe_operador, pe_fecha_urev) VALUES (0, ${pedido}, ${area_actual[0].p_area}, '${user_name}', now())`;
      db.sql(insert);
    }
    return;
  }

  async function pedido_estados(id) {
    const tabla_query = `SELECT
                          @can := @can + 1 AS fila,
                          pe.pe_operador,
                          IFNULL(a.a_descripcion, "-") AS area,
                          DATE_FORMAT(pe.pe_fecha_urev, "%Y-%m-%d : %H:%i:%s") AS fecha
                        FROM
                          pedidos_estados pe
                          LEFT JOIN area a ON pe.pe_area = a.a_codigo,
                          (SELECT @can := 0) r
                        WHERE pe_pedido = ${id}`;
    let tabla = await db.sql(tabla_query);

    const areas_query = `SELECT
                          arse.ac_codigo,
                          arac.a_descripcion
                        FROM
                          area_secuencia arse
                          INNER JOIN area arac ON arse.ac_area = arac.a_codigo
                        ORDER BY arse.ac_codigo ASC`;
    let areas = await db.sql(areas_query);

    for (t in tabla) {
      const area = areas.find((area) => area.ac_codigo === tabla[t].fila); //Buscamos el área por orden de secuencia, según fila
      if (tabla[t].area === "-") tabla[t].area = area.a_descripcion; 
    }

    return tabla;
  }

  async function agregarPedido(req, res) {
    const { pedido, detalle_pedido } = req.body;

    console.log("pedidos", pedido);
    console.log("detalle_pedido", detalle_pedido);

    try {
      const pedidoResult = await db.agregar(
        CABECERA,
        {
          p_fecha: pedido.p_fecha,
          p_nropedido: pedido.p_nropedido,
          p_cliente: pedido.p_cliente,
          p_operador: pedido.p_operador,
          p_moneda: pedido.p_moneda,
          p_deposito: pedido.p_deposito,
          p_sucursal: pedido.p_sucursal,
          p_descuento: pedido.p_descuento,
          p_obs: pedido.p_obs,
          p_estado: pedido.p_estado,
          p_vendedor: pedido.p_vendedor,
          p_area: pedido.p_area,
          p_tipo_estado: pedido.p_tipo_estado,
          p_credito: pedido.p_credito,
          p_imprimir: pedido.p_imprimir,
          p_interno: pedido.p_interno,
          p_latitud: pedido.p_latitud,
          p_longitud: pedido.p_longitud,
          p_tipo: pedido.p_tipo,
          p_entrega: pedido.p_entrega,
          p_cantcuotas: pedido.p_cantcuotas,
          p_consignacion: pedido.p_consignacion,
          p_autorizar_a_contado: pedido.p_autorizar_a_contado,
          p_zona: pedido.p_zona,
          p_acuerdo: pedido.p_acuerdo,
        },
        0,
        "p_codigo"
      );

      const pedidoId = pedidoResult.insertId;

      for (const item of detalle_pedido) {
        await db.agregar(
          DETALLES,
          {
            dp_pedido: pedidoId,
            dp_articulo: item.dp_articulo,
            dp_cantidad: item.dp_cantidad,
            dp_precio: item.dp_precio,
            dp_descuento: item.dp_descuento,
            dp_exentas: item.dp_exentas,
            dp_cinco: item.dp_cinco,
            dp_diez: item.dp_diez,
            dp_codigolote: item.dp_codigolote,
            dp_lote: item.dp_lote,
            dp_vence: item.dp_vencimiento,
            dp_vendedor: item.dp_vendedor,
            dp_codigolote: item.dp_codigolote,
            dp_facturado: item.dp_facturado,
            dp_porcomision: item.dp_porcomision,
            dp_actorizado: item.dp_actorizado,
            dp_habilitar: item.dp_habilitar,
            dp_bonif: item.dp_bonif,
          },
          0,
          "dp_codigo"
        );
      }
      res
        .status(201)
        .json({ message: "Pedido creado correctamente", body: pedidoId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al crear el pedido" });
    }
  }

  async function confirmarPedido(pedidoId) {
    const primary_key_name = "p_codigo";
    const primary_key_value = pedidoId;
    const data = { p_tipo_estado: 2 };
    return db.actualizar(CABECERA, data, primary_key_value, primary_key_name);
  }

  async function actualizarPedidoParcial(pedidoId, itemsEliminados) {
    try {
      console.log(
        "Iniciando la actualización parcial del pedido",
        itemsEliminados
      );
      const detallesActuales = await getDetalles(pedidoId);

      console.log("Detalles actuales del pedido", detallesActuales);

      for (const detalleActual of detallesActuales) {
        const itemEliminado = itemsEliminados.find(
          (item) => item.art_codigo === detalleActual.art_codigo
        );

        if (itemEliminado) {
          const cantidadActual = parseFloat(detalleActual.cantidad);
          const cantidadEliminada = parseFloat(itemEliminado.cantidad);
          console.log(
            "comparando cantidades entre los items eliminados y los detalles actuales",
            cantidadActual,
            cantidadEliminada
          );

          if (cantidadActual !== cantidadEliminada) {
            const nuevaCantidad = cantidadActual - cantidadEliminada;
            console.log("nueva cantidad", nuevaCantidad);

            await db.actualizar(
              DETALLES,
              { dp_cantidad: nuevaCantidad },
              detalleActual.det_codigo,
              "dp_codigo"
            );
            console.log(
              "Cantidad actualizada para el item",
              detalleActual.det_codigo
            );
          } else {
            console.log(
              "las cantidades son iguales, no se actualiza la cantidad"
            );
          }
        }
      }
      for (const detalle of detallesActuales) {
        const itemNoEliminar = itemsEliminados.find(
          (item) => item.art_codigo === detalle.art_codigo
        );

        if (!itemNoEliminar) {
          console.log(
            "eliminando el detalle de la venta completamente vendida",
            detalle.art_codigo
          );
          await db.actualizar(
            DETALLES,
            { dp_cantidad: 0 },
            detalle.det_codigo,
            "dp_codigo"
          );
        } else {
          console.log("No se elimina el detalle", detalle.art_codigo);
        }
      }

      const detallesFinales = await getDetalles(pedidoId);
      console.log("Detalles finales del pedido", detallesFinales);

      const todosCero = detallesFinales.every(
        (detalle) => parseFloat(detalle.cantidad) === 0
      );

      if (todosCero) {
        console.log(
          "Todos los detalles del pedido están en 0, se procede a eliminar el pedido"
        );
        await db.actualizar(CABECERA, { p_tipo_estado: 2 }, pedidoId, "p_codigo");
        console.log("Pedido marcado como finiquitado");
      }

      return { success: true, message: "Pedido actualizado correctamente" };
    } catch (error) {
      console.error(error);
      return { success: false, message: "Error al actualizar el pedido" };
    }
  }
  async function updateObservacionPedido(pedidoId, observacion) {
    const query = `UPDATE pedidos SET p_obs = '${observacion}' WHERE p_codigo = ${pedidoId}`;
    return db.sql(query);
  }
  async function prepararPedido(pedidoId, consolidar, cliente, fecha_desde, fecha_hasta, estado) {
    let where = "1 = 1";
    if(consolidar === '1'){
      where += ` AND p.p_cliente = ${cliente} AND p.p_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}' AND p.p_estado = ${estado}`;
    }else{
      where += ` AND p.p_codigo = ${pedidoId}`;
    }
    const query = `
      SELECT
        p.p_codigo as id_pedido,
        DATE_FORMAT(p.p_fecha, '%d/%m/%Y') as fecha,
        dep.dep_descripcion as deposito,
        suc.descripcion as sucursal,
        cli.cli_razon as cliente,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'cod_interno', ar.ar_cod_interno,
            'cod_barras', ar.ar_codbarra,
            'descripcion', ar.ar_descripcion,
            'vencimiento', al.al_vencimiento,
            'lote', al.al_lote,
            'cantidad', dp.dp_cantidad,
            'ubicacion', ub.ub_descripcion,
            'sububicacion', su.s_descripcion,
            'stock', al.al_cantidad
          )
        ) as articulos
      FROM
        pedidos p
        INNER JOIN clientes cli ON p.p_cliente = cli.cli_codigo
        INNER JOIN detalle_pedido dp ON p.p_codigo = dp.dp_pedido
        INNER JOIN articulos ar ON dp.dp_articulo = ar.ar_codigo
        LEFT JOIN articulos_lotes al ON dp.dp_codigolote = al.al_codigo
        LEFT JOIN ubicaciones ub ON ar.ar_ubicacicion = ub.ub_codigo
        LEFT JOIN sub_ubicacion su ON ar.ar_sububicacion = su.s_codigo
        INNER JOIN depositos dep ON p.p_deposito = dep.dep_codigo
        INNER JOIN sucursales suc ON p.p_sucursal = suc.id
      WHERE
        ${where}
      GROUP BY p.p_codigo, p.p_fecha, dep.dep_descripcion, suc.descripcion, cli.cli_razon
      ORDER BY p.p_fecha DESC
    `;
    console.log(query);
    console.log( await db.sql(query));
    return db.sql(query)
  }

  async function iniciarPreparacionPedido(pedidoIds, preparadoPor) {

    console.log(pedidoIds);
    console.log(preparadoPor);
    if (!Array.isArray(pedidoIds)) {
      throw new Error("Se esperaba un array de IDs de pedidos");
    }

    let preparadoPorQuery = '';
    if(preparadoPor){
      preparadoPorQuery = `, p_preparado_por = ${preparadoPor}`
    }

    const query = `
        UPDATE pedidos 
        SET p_imprimir_preparacion = 1 ${preparadoPorQuery}
        WHERE p_codigo IN (${pedidoIds.join(',')})
    `;

    console.log(query);
    return db.sql(query);
  }

  async function traerPedidosAPreparar(deposito_id){
    let where = ''
    if(deposito_id){
      where += ` AND p.p_deposito = ${deposito_id}`;
    }
    const query = 
    `
      SELECT
        p.p_codigo as id_pedido,
        DATE_FORMAT(p.p_fecha, '%d/%m/%Y') as fecha,
        dep.dep_descripcion as deposito,
        cli.cli_razon as cliente,
        p.p_preparado_por as preparado_por
      FROM pedidos p
      INNER JOIN depositos dep ON p.p_deposito = dep.dep_codigo
      INNER JOIN clientes cli ON p.p_cliente = cli.cli_codigo
      WHERE p.p_estado = 1
      AND p.p_imprimir_preparacion = 1
      AND p.p_cantidad_cajas = 0
      ${where}
    `
    console.log(query);
    return db.sql(query);
  }

  async function traerItemsPorPedido(pedidoId, buscar){
    let where = ''

    if (buscar) {
      const palabras = buscar.split(" ").filter((p) => p.length > 0);
      const condiciones = palabras.map(

        (palabra) =>
          `(ar.ar_descripcion LIKE '%${palabra}%' OR ar.ar_codbarra = '${palabra}' OR al.al_lote = '${palabra}' OR al.al_codigo = '${palabra}')`
      );
      where += ` AND (${condiciones.join(" AND ")})`;
    }

    const query = `
      SELECT
        dp.dp_codigo as id_detalle,
        ar.ar_codigo,
        ar.ar_codbarra,
        ar.ar_descripcion,
        dp.dp_cantidad as al_cantidad,
        al.al_codigo,
        al.al_vencimiento,
        ar.ar_ubicacicion,
        ar.ar_sububicacion,
        al.al_lote,
        ar.ar_vencimiento
      FROM detalle_pedido dp
      INNER JOIN articulos ar ON dp.dp_articulo = ar.ar_codigo
      LEFT JOIN articulos_lotes al ON dp.dp_codigolote = al.al_codigo
      WHERE dp_pedido = ${pedidoId}
      AND dp.cantidad_cargada = 0
      ${where}
    `
    console.log(query);
    return db.sql(query);
  }

  async function cargarPedidoPreparado(pedidoId, cantidad){
    const query =
      `
        UPDATE detalle_pedido
        SET cantidad_cargada = ${cantidad}
        WHERE dp_codigo = ${pedidoId}
      `
    return db.sql(query);
  }

  async function insertarCantidadDeCajas(pedidoId, cantidad, verificadoPor){
    const query = 
      `
        UPDATE
          pedidos
        SET
          p_cantidad_cajas = ${cantidad},
          p_verificado_por = ${verificadoPor}
        WHERE
          p_codigo = ${pedidoId}
      `
    console.log(query);
    return db.sql(query);
  }

  const getNumeroCajas = async (pedidoId) => {
    const query = `
      SELECT
        p.p_codigo as pedido_id,
        p.p_cantidad_cajas as cantidad_cajas,
        cli.cli_razon as cliente,
        cli.cli_codigo as cliente_id,
        cli.cli_ciudad as ciudad,
        cli.cli_dir as direccion,
        cli.cli_barrio as barrio,
        z.zo_descripcion as zona,
        IF(p.p_verificado_por = 0, 'N/A',
          (
            SELECT
              op.op_nombre
            FROM operadores op
            WHERE op.op_codigo = p.p_verificado_por
          )
        ) as verificado_por,
        IF(p.p_preparado_por = 0, 'N/A',
          (
            SELECT
              op.op_nombre
            FROM operadores op
            WHERE op.op_codigo = p.p_preparado_por
          ) 
        ) as preparado_por
      FROM pedidos p
      INNER JOIN clientes cli ON p.p_cliente = cli.cli_codigo
      INNER JOIN zonas z ON cli.cli_zona = z.zo_codigo
      WHERE p_codigo = ${pedidoId}
    `
    return db.sql(query);
  }

  async function obtenerPedidosParaVenta(pedidoId){
    const query = `
      SELECT
        p.p_codigo as id,
        p.p_cliente as cliente,
        p.p_vendedor as vendedor,
        json_arrayagg(
          json_object(
            'codigo', dp.dp_codigo,
            'articulo', dp.dp_articulo,
            'cantidad', dp.dp_cantidad,
            'precio', dp.dp_precio,
            'descuento', dp.dp_descuento,
            'lote', dp.dp_lote,
            'loteid', dp.dp_codigolote,
            'cod_barras', ar.ar_codbarra,
            'vencimiento', al.al_vencimiento
          )
        ) as items
      FROM pedidos p
      INNER JOIN detalle_pedido dp ON p.p_codigo = dp.dp_pedido
      INNER JOIN articulos ar ON dp.dp_articulo = ar.ar_codigo
      LEFT JOIN articulos_lotes al ON dp.dp_codigolote = al.al_codigo
      WHERE p_codigo = ${pedidoId}
    `
    console.log( await db.sql(query));
    return db.sql(query);
  }

async function reportePreparacionPedidos(fecha_desde, fecha_hasta) {
  const query = `
    SELECT
      p.p_codigo as id_pedido,
      DATE_FORMAT(p.p_fecha, '%d/%m/%Y') as fecha_pedido,
      dep.dep_descripcion as deposito,
      suc.descripcion as sucursal,
      cli.cli_razon as cliente,
      p.p_cantidad_cajas as cantidad_cajas,
      IF(p.p_verificado_por = 0, 'N/A',
        (
          SELECT
            op.op_nombre
          FROM operadores op
          WHERE op.op_codigo = p.p_verificado_por
        )
      ) as verificado_por,
      IF(p.p_preparado_por = 0, 'N/A',
        (
          SELECT
            op.op_nombre
          FROM operadores op
          WHERE op.op_codigo = p.p_preparado_por
        )
      ) as preparado_por,
      SUM(dp.dp_cantidad) as cantidad_items,
      FLOOR(SUM(dp.dp_cantidad * dp.dp_precio)) as total_pedido,
      IFNULL(vp.ve_factura, '') as factura,
      IFNULL(DATE_FORMAT(vp.ve_fecha, '%d/%m/%Y'), '') as fecha_factura
    FROM pedidos p
    INNER JOIN detalle_pedido dp ON p.p_codigo = dp.dp_pedido
    INNER JOIN depositos dep ON p.p_deposito = dep.dep_codigo
    INNER JOIN sucursales suc ON p.p_sucursal = suc.id
    INNER JOIN clientes cli ON p.p_cliente = cli.cli_codigo
    LEFT JOIN ventas vp ON p.p_codigo = vp.ve_pedido
    WHERE p.p_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'
    AND p.p_estado = 1
    AND p.p_imprimir_preparacion = 1
    GROUP BY 
      p.p_codigo,
      p.p_fecha,
      dep.dep_descripcion,
      suc.descripcion,
      cli.cli_razon,
      p.p_cantidad_cajas,
      p.p_verificado_por,
      p.p_preparado_por,
      vp.ve_factura,
      vp.ve_fecha
    ORDER BY p.p_codigo DESC`;

  console.log(query);
  return db.sql(query);
}

const getPedidosParaAgenda = async (vendedor, cliente, busqueda) => {
  let where = "";
  if (busqueda) {
    const palabras = busqueda.split(" ").filter((p) => p.length > 0);
    const condiciones = palabras.map(
      (palabra) =>
        `(ar.ar_descripcion LIKE '%${palabra}%' OR ar.ar_codbarra = '${palabra}' OR al.al_lote = '${palabra}' OR al.al_codigo = '${palabra}' )`
    );
    where += ` AND (${condiciones.join(" AND ")})`;
  }
  const query = `
      SELECT
        p.p_codigo as id,
        date_format(p.p_fecha, '%d/%m/%Y') as fecha,
        ( JSON_ARRAYAGG(
          JSON_OBJECT(
            'codigo', dp.dp_codigo,
            'cod_barras', ar.ar_codbarra,
            'descripcion', ar.ar_descripcion,
            'precio', dp.dp_precio,
            'cantidad', dp.dp_cantidad,
            'total', dp.dp_cantidad * dp.dp_precio
          )
        )) as articulos
      FROM pedidos p
      INNER JOIN detalle_pedido dp ON p.p_codigo = dp.dp_pedido
      INNER JOIN articulos ar ON dp.dp_articulo = ar.ar_codigo
      LEFT JOIN articulos_lotes al ON ar.ar_codigo = al.al_codigo
      WHERE  p.p_cliente = ${cliente} ${where}
      GROUP BY p.p_codigo
      ORDER BY p.p_fecha DESC
      LIMIT 5 
    `;
  console.log(query);

  return db.sql(query);
};

  async function getPedidosFaltantes(filtros){
    let where = ''

    if(filtros.fecha_desde && filtros.fecha_hasta){
      where += ` AND p.p_fecha BETWEEN '${filtros.fecha_desde}' AND '${filtros.fecha_hasta}'`
    }

    if(filtros.fecha_desde && !filtros.fecha_hasta){
      where += ` AND p.p_fecha >= '${filtros.fecha_desde}'`
    }

    if(!filtros.fecha_desde && filtros.fecha_hasta){
      where += ` AND p.p_fecha <= '${filtros.fecha_hasta}'`
    }

    if(filtros.cliente && filtros.cliente !== '0'){
      where += ` AND p.p_cliente = ${filtros.cliente}`
    }
    
    if(filtros.vendedor && filtros.vendedor !== '0'){
      where += ` AND p.p_vendedor = ${filtros.vendedor}`
    }

    if(filtros.articulo && filtros.articulo !== '0'){
      where += ` AND ar.ar_codigo = ${filtros.articulo}`
    }

    if(filtros.dvl && filtros.dvl !== '0'){
      where += ` AND ar.ar_dvl = ${filtros.dvl}`
    }

    if(filtros.marca && filtros.marca !== '0'){
      where += ` AND ar.ar_marca = ${filtros.marca}`
    }

    if(filtros.linea && filtros.linea !== '0'){
      where += ` AND ar.ar_linea = ${filtros.linea}`
    }

    if(filtros.categoria && filtros.categoria !== '0'){
      where += ` AND sc.sc_categoria = ${filtros.categoria}`
    }

    if(filtros.subcategoria && filtros.subcategoria !== '0'){
      where += ` AND ar.ar_subcategoria = ${filtros.subcategoria}`
    }
    
    const query = 
    `
      SELECT
        dp.dp_codigo as id_detalle,
        p.p_codigo as id_pedido,
        DATE_FORMAT(p.p_fecha, '%d/%m/%Y') as fecha,
        cli.cli_razon as cliente,
        ar.ar_codbarra as cod_barra,
        ar.ar_descripcion as descripcion,
        ma.ma_descripcion as marca,
        ROUND(df.d_cantidad) as cantidad_faltante,
        df.d_cantidad as cantidad_faltante_num,
        FORMAT(dp.dp_precio, 0) as p_unitario,
        dp.dp_precio as p_unitario_num,
        FORMAT(ROUND(df.d_cantidad * dp.dp_precio), 0) as subtotal,
        df.d_cantidad * dp.dp_precio as subtotal_num,
        IFNULL(op.op_nombre, '') as operador,
        IFNULL(op2.op_nombre, '') as vendedor,
        ROUND(dp.dp_cantidad) as cantidad_pedido,
        dp.dp_cantidad as cantidad_pedido_num,
        dp.dp_codigolote as id_lote,
        dep.dep_descripcion as deposito,
        df.obs as observacion,
        IF(
          EXISTS(
            SELECT 1 
            FROM articulos_lotes al 
            WHERE al.al_articulo = ar.ar_codigo 
            AND al.al_cantidad > 0 
            AND al.al_deposito = p.p_deposito
          ), 
          'SI', 
          'NO'
        ) as tiene_lotes_disponibles,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id_lote', al.al_codigo,
              'lote', al.al_lote,
              'vencimiento', DATE_FORMAT(al.al_vencimiento, '%d/%m/%Y'),
              'cantidad', al.al_cantidad,
              'deposito', d.dep_descripcion,
              'id_deposito', d.dep_codigo 
            )
          )
          FROM articulos_lotes al
          INNER JOIN depositos d ON al.al_deposito = d.dep_codigo
          WHERE al.al_articulo = ar.ar_codigo
          AND al.al_cantidad > 0
        ) as lotes_disponibles
      FROM detalle_pedido dp
      INNER JOIN pedidos p ON dp.dp_pedido = p.p_codigo
      LEFT JOIN detalle_faltante df ON dp.dp_codigo = df.d_detalle_pedido
      LEFT JOIN articulos ar ON dp.dp_articulo = ar.ar_codigo
      LEFT JOIN operadores op ON p.p_operador = op.op_codigo
      LEFT JOIN operadores op2 ON p.p_vendedor = op2.op_codigo
      LEFT JOIN clientes cli ON p.p_cliente = cli.cli_codigo
      LEFT JOIN depositos dep ON p.p_deposito = dep.dep_codigo
      LEFT JOIN marcas ma ON ar.ar_marca = ma.ma_codigo
      LEFT JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
      LEFT JOIN categorias ca ON sc.sc_categoria = ca.ca_codigo
      LEFT JOIN lineas li ON ar.ar_linea = li.li_id
      LEFT JOIN articulos_lotes al ON dp.dp_codigolote = al.al_codigo
      LEFT JOIN dvl dvl ON ar.ar_dvl = dvl.d_codigo
      WHERE 1=1
      ${where}
      AND p.p_estado = 1
      AND df.d_cantidad > 0
    `
    console.log(query);
    const result = await db.sql(query);
    console.log(result.length);
    return result;
  }

  async function insertarDetalleFaltante(datos){
    console.log(datos);
    const query = 
    `
      INSERT INTO detalle_faltante
        ( d_detalle_pedido, d_cantidad, d_situacion, obs)
      VALUES (${datos.detalle_id}, ${datos.cantidad}, 0 , '${datos.observacion}')
    `
    console.log(query);
    return db.sql(query);
  }

  async function rehacerPedidoConFaltantes({ pedido_id, detalles = [] }) {
    try {
      console.log('Parámetros recibidos:', {
        pedido_id,
        detalles
      });

      if (!detalles || detalles.length === 0) {
        console.log('Detalles vacíos o undefined');
        throw new Error('Debe proporcionar al menos un detalle con su lote correspondiente');
      }

      // 1. Obtener los detalles con faltantes
      const queryFaltantes = `
        SELECT 
          df.d_detalle_pedido,
          df.d_cantidad as cantidad_faltante,
          dp.dp_articulo,
          dp.dp_precio,
          dp.dp_descuento,
          dp.dp_exentas,
          dp.dp_cinco,
          dp.dp_diez,
          dp.dp_bonif,
          dp.dp_obs,
          dp.dp_descripcion_art,
          dp.dp_porcomision,
          dp.dp_actorizado,
          dp.dp_habilitar
        FROM detalle_faltante df
        INNER JOIN detalle_pedido dp ON df.d_detalle_pedido = dp.dp_codigo
        WHERE df.d_detalle_pedido IN (${detalles.map(d => d.detalle_id).join(',')})
        AND df.d_cantidad > 0
      `;
      console.log('Query de faltantes:', queryFaltantes);
      const faltantes = await db.sql(queryFaltantes);
      console.log('Resultado de faltantes:', faltantes);

      if (!faltantes || faltantes.length === 0) {
        throw new Error('No hay faltantes para estos detalles');
      }

      // 2. Obtener datos del pedido original
      const queryPedido = `
        SELECT 
          p_fecha,
          p_nropedido,
          p_cliente,
          p_operador,
          p_moneda,
          p_deposito,
          p_sucursal,
          p_descuento,
          p_obs,
          p_estado,
          p_vendedor,
          p_area,
          p_tipo_estado,
          p_credito,
          p_imprimir,
          p_interno,
          p_latitud,
          p_longitud,
          p_tipo,
          p_entrega,
          p_cantcuotas,
          p_consignacion,
          p_autorizar_a_contado,
          p_zona,
          p_acuerdo
        FROM pedidos
        WHERE p_codigo = ${pedido_id}
      `;
      const pedidoOriginal = await db.sql(queryPedido);

      // 3. Insertar nuevo pedido
      const insertPedido = `
        INSERT INTO pedidos (
          p_fecha,
          p_nropedido,
          p_cliente,
          p_operador,
          p_moneda,
          p_deposito,
          p_sucursal,
          p_descuento,
          p_obs,
          p_estado,
          p_vendedor,
          p_area,
          p_tipo_estado,
          p_credito,
          p_imprimir,
          p_interno,
          p_latitud,
          p_longitud,
          p_tipo,
          p_entrega,
          p_cantcuotas,
          p_consignacion,
          p_autorizar_a_contado,
          p_zona,
          p_acuerdo
        ) VALUES (
          '${new Date().toISOString().split('T')[0]}',
          '${pedidoOriginal[0].p_nropedido}',
          ${pedidoOriginal[0].p_cliente},
          ${pedidoOriginal[0].p_operador},
          ${pedidoOriginal[0].p_moneda},
          ${pedidoOriginal[0].p_deposito},
          ${pedidoOriginal[0].p_sucursal},
          ${pedidoOriginal[0].p_descuento},
          'Pedido rehacer del pedido ${pedido_id} por faltantes',
          ${pedidoOriginal[0].p_estado},
          ${pedidoOriginal[0].p_vendedor},
          ${pedidoOriginal[0].p_area},
          ${pedidoOriginal[0].p_tipo_estado},
          ${pedidoOriginal[0].p_credito},
          ${pedidoOriginal[0].p_imprimir},
          '${pedidoOriginal[0].p_interno}',
          '${pedidoOriginal[0].p_latitud}',
          '${pedidoOriginal[0].p_longitud}',
          ${pedidoOriginal[0].p_tipo},
          ${pedidoOriginal[0].p_entrega},
          ${pedidoOriginal[0].p_cantcuotas},
          ${pedidoOriginal[0].p_consignacion},
          ${pedidoOriginal[0].p_autorizar_a_contado},
          ${pedidoOriginal[0].p_zona},
          ${pedidoOriginal[0].p_acuerdo}
        )
      `;
      const resultadoPedido = await db.sql(insertPedido);
      const nuevoPedidoId = resultadoPedido.insertId;

      // 4. Obtener datos de los lotes
      const queryLotes = `
        SELECT al_codigo, al_lote
        FROM articulos_lotes
        WHERE al_codigo IN (${detalles.map(d => d.lote_id).join(',')})
      `;
      const lotes = await db.sql(queryLotes);

      if (!lotes || lotes.length === 0) {
        throw new Error('No se encontraron los lotes especificados');
      }

      // 5. Insertar los detalles con las cantidades faltantes
      for (const faltante of faltantes) {
        const detalle = detalles.find(d => d.detalle_id === faltante.d_detalle_pedido);
        const lote = lotes.find(l => l.al_codigo === detalle.lote_id);

        const insertDetalle = `
          INSERT INTO detalle_pedido (
            dp_pedido,
            dp_articulo,
            dp_cantidad,
            dp_precio,
            dp_descuento,
            dp_exentas,
            dp_cinco,
            dp_diez,
            dp_lote,
            dp_codigolote,
            dp_bonif,
            dp_obs,
            dp_descripcion_art,
            dp_porcomision,
            dp_actorizado,
            dp_habilitar
          ) VALUES (
            ${nuevoPedidoId},
            ${faltante.dp_articulo},
            ${faltante.cantidad_faltante},
            ${faltante.dp_precio},
            ${faltante.dp_descuento},
            ${faltante.dp_exentas},
            ${faltante.dp_cinco},
            ${faltante.dp_diez},
            '${lote.al_lote}',
            ${lote.al_codigo},
            ${faltante.dp_bonif},
            '${faltante.dp_obs}',
            '${faltante.dp_descripcion_art}',
            ${faltante.dp_porcomision},
            ${faltante.dp_actorizado},
            ${faltante.dp_habilitar}
          )
        `;
        await db.sql(insertDetalle);

        // 6. Actualizar la cantidad del detalle faltante a cero
        const updateFaltante = `
          UPDATE detalle_faltante 
          SET d_cantidad = 0 
          WHERE d_detalle_pedido = ${faltante.d_detalle_pedido}
        `;
        await db.sql(updateFaltante);
      }

      return {
        success: true,
        message: 'Pedido rehacer creado exitosamente',
        nuevoPedidoId: nuevoPedidoId
      };
    } catch (error) {
      console.error('Error al rehacer pedido:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }


  return {
    obtenerPedidosParaVenta,
    uno,
    getCabeceras,
    getDetalles,
    primeraSecuenciaArea,
    autorizar,
    agregarCabecera,
    agregarDetalle,
    eliminarDetalle,
    pedido_estados,
    agregarPedido,
    confirmarPedido,
    actualizarPedidoParcial,
    getPedidosNuevo,
    updateObservacionPedido,
    prepararPedido,
    iniciarPreparacionPedido,
    traerPedidosAPreparar,
    traerItemsPorPedido,
    cargarPedidoPreparado,
    insertarCantidadDeCajas,
    getNumeroCajas,
    reportePreparacionPedidos,
    getPedidosParaAgenda,
    getPedidosFaltantes,
    insertarDetalleFaltante,
    rehacerPedidoConFaltantes,
  };
};
