module.exports = function (dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require("../../DB/mysql.js");
  }

  const telegramBot = require("../../../services/telegram");

  async function resumenRepartos(
    fecha_desde,
    fecha_hasta,
    sucursales,
    choferes,
    camiones,
    tipos,
    id_entrega
  ) {
    let where = "";

    // Si hay id_entrega, solo filtramos por ese ID y no aplicamos otros filtros
    if (id_entrega) {
      where = ` AND r.r_codigo = ${id_entrega}`;
    } else {
      // Solo aplicamos los demás filtros si no hay id_entrega
      if (fecha_desde && fecha_hasta) {
        if (fecha_desde === fecha_hasta) {
          where += ` AND r.r_fecha = '${fecha_desde}'`;
        } else {
          where += ` AND r.r_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'`;
        }
      }

      if (sucursales) {
        where += ` AND r.r_sucursal IN (${sucursales})`;
      }

      if (choferes) {
        where += ` AND r.r_chofer IN (${choferes})`;
      }

      if (camiones) {
        where += ` AND r.r_camion IN (${camiones})`;
      }

      if (tipos && tipos.length > 0) {
        where += " AND (";
        let condiciones = [];

        if (tipos.includes("1")) {
          condiciones.push("(r.r_hora_s IS NULL OR r.r_hora_s = '')");
        }
        if (tipos.includes("2")) {
          condiciones.push(
            "(r.r_hora_s IS NOT NULL AND r.r_hora_s != '' AND (r.r_hora_l IS NULL OR r.r_hora_l = ''))"
          );
        }

        if (tipos.includes("3")) {
          condiciones.push(
            "(r.r_hora_s IS NOT NULL AND r.r_hora_s != '' AND r.r_hora_l IS NOT NULL AND r.r_hora_l != '')"
          );
        }

        if (tipos.includes("4")) {
          condiciones.push("1=1"); // Permite todos
        }

        where += condiciones.join(" OR ") + ")";
      }
    }

    const query = `
    SELECT
    r.r_codigo as codigo_ruteo,
    DATE_FORMAT(r.r_fecha, '%d/%m/%Y') as fecha_ruteo,

    r.r_hora_s as hora_salida_ruteo,

    r.r_hora_l as hora_llegada_ruteo,
    op.op_nombre as chofer,
    c.c_descripcion as camion,
    s.descripcion as sucursal,
    CASE
      WHEN r.r_hora_s IS NULL OR r.r_hora_s = '' THEN 'Pendiente'
      WHEN (r.r_hora_l IS NULL OR r.r_hora_l = '') AND (r.r_hora_s IS NOT NULL AND r.r_hora_s != '') THEN 'En camino'
      WHEN (r.r_hora_l IS NOT NULL AND r.r_hora_l != '') AND (r.r_hora_s IS NOT NULL AND r.r_hora_s != '') THEN 'Completado'
      ELSE 'Pendiente'
    END as estado_ruteo,
    m.mo_descripcion as moneda,
    r.r_km_actual as km_actual,
    r.r_ult_km as km_ultimo,
    (SELECT COUNT(*) FROM detalle_ruteamientos dr WHERE dr.d_ruteamiento = r.r_codigo) as total_detalles,
    (SELECT COUNT(*) FROM detalle_ruteo_venta drv WHERE drv.dd_venta = r.r_codigo) as total_ventas,
    (SELECT COUNT(*) FROM detalle_ruteo_pedido drp WHERE drp.dd_pedido = r.r_codigo) as total_pedidos,
    (SELECT COUNT(*) FROM detalle_ruteo_pago drp WHERE drp.d_proveedor = r.r_codigo) as total_pagos,
    (SELECT COUNT(*) FROM detalle_ruteo_cobro drc WHERE drc.d_cliente = r.r_codigo) as total_cobros,
    (SELECT FORMAT(SUM(d_monto), 0) FROM detalle_ruteamientos dr WHERE dr.d_ruteamiento = r.r_codigo) as total_monto,
    (SELECT SUM(d_monto) FROM detalle_ruteamientos dr WHERE dr.d_ruteamiento = r.r_codigo) as total_monto_num,
    CASE 
      WHEN r.r_hora_s IS NOT NULL AND r.r_hora_s != '' AND r.r_hora_l IS NOT NULL AND r.r_hora_l != '' THEN
        CONCAT(
          FLOOR(TIME_TO_SEC(TIMEDIFF(r.r_hora_l, r.r_hora_s))/3600), 'h ',
          FLOOR((TIME_TO_SEC(TIMEDIFF(r.r_hora_l, r.r_hora_s)) % 3600)/60), 'm'
        )
      ELSE NULL
    END as tiempo_total,
    (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', dr.d_codigo,
          'monto', FORMAT(dr.d_monto, 0),
          'estado', dr.d_estado,
          'observacion', dr.d_obs,
          'hora_entrada', dr.d_hora_e,
          'hora_salida', dr.d_hora_s,
          'diferencia_horas', CASE 
            WHEN dr.d_hora_s IS NOT NULL AND dr.d_hora_e IS NOT NULL THEN
              CONCAT(
                FLOOR(TIME_TO_SEC(TIMEDIFF(dr.d_hora_s, dr.d_hora_e))/3600), 'h ',
                FLOOR((TIME_TO_SEC(TIMEDIFF(dr.d_hora_s, dr.d_hora_e)) % 3600)/60), 'm'
              )
            ELSE NULL
          END,
          'nro_factura', (
            SELECT v3.ve_factura 
            FROM detalle_ruteo_venta drv3
            LEFT JOIN ventas v3 ON v3.ve_codigo = drv3.dd_venta
            WHERE drv3.dd_detalle = dr.d_codigo
            LIMIT 1
          ),
          'cliente', (
            SELECT 
            CASE
              WHEN drp.d_proveedor IS NOT NULL THEN pr.pro_razon
              WHEN drc.d_cliente IS NOT NULL THEN cli.cli_razon  
              WHEN drped.dd_pedido IS NOT NULL THEN cli_ped.cli_razon
              WHEN drv.dd_venta IS NOT NULL THEN cli_ven.cli_razon
            END
            FROM detalle_ruteamientos dr1
            LEFT JOIN detalle_ruteo_pago drp ON drp.d_detalle = dr1.d_codigo
            LEFT JOIN detalle_ruteo_cobro drc ON drc.d_detalle = dr1.d_codigo
            LEFT JOIN detalle_ruteo_pedido drped ON drped.dd_detalle = dr1.d_codigo
            LEFT JOIN detalle_ruteo_venta drv ON drv.dd_detalle = dr1.d_codigo
            LEFT JOIN proveedores pr ON pr.pro_codigo = drp.d_proveedor
            LEFT JOIN clientes cli ON cli.cli_codigo = drc.d_cliente
            LEFT JOIN pedidos p2 ON p2.p_codigo = drped.dd_pedido
            LEFT JOIN clientes cli_ped ON cli_ped.cli_codigo = p2.p_cliente
            LEFT JOIN ventas v2 ON v2.ve_codigo = drv.dd_venta
            LEFT JOIN clientes cli_ven ON cli_ven.cli_codigo = v2.ve_cliente
            WHERE dr1.d_codigo = dr.d_codigo
            LIMIT 1
          ),
          'tipo_reparto', (
            SELECT 
            CASE
              WHEN drp.d_proveedor IS NOT NULL THEN 'Pago a Proveedor'
              WHEN drc.d_cliente IS NOT NULL THEN 'Cobro a Cliente'
              WHEN drped.dd_pedido IS NOT NULL THEN 'Pedido'
              WHEN drv.dd_venta IS NOT NULL THEN 'Venta'
            END
            FROM detalle_ruteamientos dr1
            LEFT JOIN detalle_ruteo_pago drp ON drp.d_detalle = dr1.d_codigo
            LEFT JOIN detalle_ruteo_cobro drc ON drc.d_detalle = dr1.d_codigo
            LEFT JOIN detalle_ruteo_pedido drped ON drped.dd_detalle = dr1.d_codigo
            LEFT JOIN detalle_ruteo_venta drv ON drv.dd_detalle = dr1.d_codigo
            LEFT JOIN ventas v ON v.ve_codigo = drv.dd_venta
            WHERE dr1.d_codigo = dr.d_codigo
            LIMIT 1
          )
        )
      )
      FROM detalle_ruteamientos dr
      WHERE dr.d_ruteamiento = r.r_codigo
    ) as detalles
    FROM ruteamientos r
    LEFT JOIN camiones c ON c.c_codigo = r.r_camion
    LEFT JOIN sucursales s ON s.id = r.r_sucursal
    LEFT JOIN monedas m ON m.mo_codigo = r.r_moneda
    LEFT JOIN operadores op ON op.op_codigo = r.r_chofer
    WHERE r.r_estado = 1
    ${where}
    ORDER BY r.r_fecha DESC
  `;
    const result = await db.sql(query);
    return result;
  }

  async function insertarReparto(datos) {
    try {
      // 1. Insertar el ruteo principal
      const queryRuteo = `
            INSERT INTO ruteamientos (
                r_fecha, r_hora_s, r_hora_l, r_chofer, 
                r_oprador, r_camion, r_sucursal, r_moneda, 
                r_km_actual, r_ult_km, r_estado
            ) VALUES (
                '${datos.ruteo.fecha}', '${datos.ruteo.hora_s}', 
                '${datos.ruteo.hora_l}', ${datos.ruteo.chofer},
                ${datos.ruteo.oprador}, ${datos.ruteo.camion}, 
                ${datos.ruteo.sucursal}, ${datos.ruteo.moneda},
                ${datos.ruteo.km_actual}, ${datos.ruteo.ult_km}, 
                ${datos.ruteo.estado}
            )
        `;
      const resultRuteo = await db.sql(queryRuteo);
      const ruteoId = resultRuteo.insertId;

      // 2. Insertar cada detalle del ruteo
      for (const detalle of datos.detalle_ruteo) {
        const queryDetalleRuteo = `
                INSERT INTO detalle_ruteamientos (
                    d_ruteamiento, d_monto, d_estado,
                    d_obs, d_hora_e, d_hora_s
                ) VALUES (
                    ${ruteoId}, ${detalle.monto}, ${detalle.estado},
                    '${detalle.obs}', '${detalle.hora_e}', '${detalle.hora_s}'
                )
            `;

        const resultDetalle = await db.sql(queryDetalleRuteo);
        const detalleRuteoId = resultDetalle.insertId;

        // 3. Insertar los detalles relacionados si existen
        if (detalle.detalle_pedidos) {
          const queryPedidos = `
                    INSERT INTO detalle_ruteo_pedido (dd_pedido, dd_detalle) 
                    VALUES (${detalle.detalle_pedidos.pedido}, ${detalleRuteoId})
                `;
          await db.sql(queryPedidos);
        }

        if (detalle.detalle_ventas) {
          const queryVentas = `
                    INSERT INTO detalle_ruteo_venta (dd_venta, dd_detalle) 
                    VALUES (${detalle.detalle_ventas.venta}, ${detalleRuteoId})
                `;
          await db.sql(queryVentas);
        }

        if (detalle.detalle_pagos) {
          const queryPagos = `
                    INSERT INTO detalle_ruteo_pago (d_proveedor, d_detalle) 
                    VALUES (${detalle.detalle_pagos.pago}, ${detalleRuteoId})
                `;
          await db.sql(queryPagos);
        }

        if (detalle.detalle_cobros) {
          const queryCobros = `
                    INSERT INTO detalle_ruteo_cobro (d_cliente, d_detalle) 
                    VALUES (${detalle.detalle_cobros.cobro}, ${detalleRuteoId})
                `;
          await db.sql(queryCobros);
        }
      }

      return {
        success: true,
        mensaje: "Reparto insertado correctamente",
        ruteoId: ruteoId,
      };
    } catch (error) {
      console.error("Error al insertar reparto:", error);
      return {
        success: false,
        mensaje: "Error al insertar el reparto",
        error: error.message,
      };
    }
  }

  async function listarRutas(query) {
    const fecha = query.fecha;
    const vendedor = query.vendedor;

    let whereVendedor = "";

    if (vendedor && vendedor.trim() !== "" && vendedor.length > 0) {
      whereVendedor = ` AND r.r_chofer = ${vendedor}`;
    }

    const querySql = `
      SELECT
      r.r_codigo as id,
      r.r_fecha as fecha,
      r.r_hora_s as hora_salida,
      r.r_hora_l as hora_llegada,
      r.r_chofer as chofer_id,
      op.op_nombre as chofer,
      c.c_descripcion as camion,
      c.c_chapa as camion_chapa,
      s.descripcion as sucursal,
      m.mo_descripcion as moneda,
      r.r_km_actual as km_actual,
      r.r_ult_km as km_ultimo,
      (SELECT 
        CASE
          WHEN drp.d_proveedor IS NOT NULL THEN pr.pro_razon
          WHEN drc.d_cliente IS NOT NULL THEN cli.cli_razon
          WHEN drped.dd_pedido IS NOT NULL THEN cli_ped.cli_razon  
          WHEN drv.dd_venta IS NOT NULL THEN cli_ven.cli_razon
        END
        FROM detalle_ruteamientos dr2
        LEFT JOIN detalle_ruteo_pago drp ON drp.d_detalle = dr2.d_codigo
        LEFT JOIN detalle_ruteo_cobro drc ON drc.d_detalle = dr2.d_codigo
        LEFT JOIN detalle_ruteo_pedido drped ON drped.dd_detalle = dr2.d_codigo
        LEFT JOIN detalle_ruteo_venta drv ON drv.dd_detalle = dr2.d_codigo
        LEFT JOIN proveedores pr ON pr.pro_codigo = drp.d_proveedor
        LEFT JOIN clientes cli ON cli.cli_codigo = drc.d_cliente
        LEFT JOIN pedidos p2 ON p2.p_codigo = drped.dd_pedido
        LEFT JOIN clientes cli_ped ON cli_ped.cli_codigo = p2.p_cliente
        LEFT JOIN ventas v2 ON v2.ve_codigo = drv.dd_venta 
        LEFT JOIN clientes cli_ven ON cli_ven.cli_codigo = v2.ve_cliente
        WHERE (dr2.d_hora_e IS NOT NULL AND dr2.d_hora_e != '' AND dr2.d_hora_e != '00:00:00')
        AND (dr2.d_hora_s IS NULL OR dr2.d_hora_s = '' OR dr2.d_hora_s = '00:00:00')
        AND dr2.d_ruteamiento = r.r_codigo
        LIMIT 1
      ) as cliente_actual,
      CASE 
        WHEN r.r_hora_s IS NULL OR r.r_hora_s = '' THEN 'Pendiente'
        WHEN r.r_hora_l IS NULL OR r.r_hora_l = '' THEN 'En camino'
        ELSE 'Completado'
      END as estado
      FROM ruteamientos r
      LEFT JOIN operadores op ON op.op_codigo = r.r_chofer
      LEFT JOIN camiones c ON c.c_codigo = r.r_camion
      LEFT JOIN sucursales s ON s.id = r.r_sucursal
      LEFT JOIN monedas m ON m.mo_codigo = r.r_moneda
      WHERE r.r_estado = 1
      AND r.r_fecha = '${fecha}'
      ${whereVendedor}
    `;

    const result = await db.sql(querySql);


    return result;
  }

  async function listarReparto(id) {
    const query = `
      SELECT 
          dr.d_codigo as id,
          dr.d_monto as monto_detalle,
          dr.d_obs as observacion_detalle,
          r.r_fecha as fecha_ruteamiento,
          dr.d_hora_e as hora_entrada,
          dr.d_hora_s as hora_salida,
          op.op_nombre as operador,
          c.c_descripcion as camion_nombre,
          c.c_chapa as camion_chapa,
          s.descripcion as sucursal,
          m.mo_descripcion as moneda,
          p.p_codigo as pedido_codigo,
          p.p_cliente as cliente_pedido,
          cli_pedido.cli_razon as cliente_pedido_nombre,
          v.ve_codigo as venta_codigo,
          v.ve_factura as factura_venta,
          v.ve_obs as observacion_venta,
          v.ve_cliente as cliente_venta,
          pr.pro_razon as proveedor_cobro,
          cli_cobro.cli_razon as cliente_cobro,
          cli_venta.cli_razon as cliente_venta_nombre,
          CASE 
            WHEN v.ve_codigo IS NOT NULL THEN 'Venta'
            WHEN p.p_codigo IS NOT NULL THEN 'Pedido'
            WHEN pr.pro_razon IS NOT NULL THEN 'Pago a Proveedor'
            WHEN cli_cobro.cli_razon IS NOT NULL THEN 'Cobro a Cliente'
      END as tipo_reparto
      FROM detalle_ruteamientos dr
      LEFT JOIN detalle_ruteo_pago drp ON drp.d_detalle = dr.d_codigo
      LEFT JOIN detalle_ruteo_cobro drc ON drc.d_detalle = dr.d_codigo
      LEFT JOIN detalle_ruteo_pedido drped ON drped.dd_detalle = dr.d_codigo
      LEFT JOIN detalle_ruteo_venta drv ON drv.dd_detalle = dr.d_codigo
      LEFT JOIN ruteamientos r ON r.r_codigo = dr.d_ruteamiento
      LEFT JOIN operadores op ON op.op_codigo = r.r_oprador
      LEFT JOIN camiones c ON c.c_codigo = r.r_camion
      LEFT JOIN sucursales s ON s.id = r.r_sucursal
      LEFT JOIN monedas m ON m.mo_codigo = r.r_moneda
      LEFT JOIN pedidos p ON p.p_codigo = drped.dd_pedido
      LEFT JOIN ventas v ON v.ve_codigo = drv.dd_venta
      LEFT JOIN proveedores pr ON pr.pro_codigo = drp.d_proveedor
      LEFT JOIN clientes cli_cobro ON cli_cobro.cli_codigo = drc.d_cliente
      LEFT JOIN clientes cli_venta ON cli_venta.cli_codigo = v.ve_cliente
      LEFT JOIN clientes cli_pedido ON cli_pedido.cli_codigo = p.p_cliente
      WHERE r.r_codigo = ${id}
      AND (dr.d_hora_s IS NULL OR dr.d_hora_s = '')
    `;
    const result = await db.sql(query);
    return result;

  }

  async function listarDetalleReparto(query) {
    const id_pedido = query.id_pedido;
    const id_venta = query.id_venta;
    let sqlQuery = "";

    if (id_pedido) {
      sqlQuery = `
            SELECT
                dp.dp_articulo AS item_codigo,
                ar.ar_descripcion AS item_descripcion,
                dp.dp_cantidad AS item_cantidad,
                dp.dp_precio AS item_precio,
                dp.dp_descuento AS item_descuento,
                (dp.dp_precio * dp.dp_cantidad) - dp.dp_descuento AS item_total
            FROM detalle_pedidos dp
            LEFT JOIN articulos ar ON ar.ar_codigo = dp.dp_articulo
            LEFT JOIN pedidos p ON p.p_codigo = dp.dp_pedido
            WHERE dp.dp_pedido = ${id_pedido}
        `;
    } else if (id_venta) {
      sqlQuery = `
            SELECT 
                dv.deve_articulo AS item_codigo,
                ar.ar_descripcion AS item_descripcion,
                dv.deve_cantidad AS item_cantidad,
                dv.deve_precio AS item_precio,
                dv.deve_descuento AS item_descuento,
                v.ve_total AS item_total
            FROM detalle_ventas dv
            LEFT JOIN articulos ar ON ar.ar_codigo = dv.deve_articulo
            LEFT JOIN ventas v ON v.ve_codigo = dv.deve_venta
            WHERE dv.deve_venta = ${id_venta}
        `;
    } else {
      throw new Error("Se requiere id_pedido o id_venta");
    }

    const result = await db.sql(sqlQuery);
    return result;
  }

  async function marcarSalidaRuta(query) {
    const id = query.id;
    const km = query.km;
    const querySql = `
      UPDATE ruteamientos SET r_hora_s = TIME(NOW()), r_km_actual = ${km} WHERE r_codigo = ${id}
    `;
    const result = await db.sql(querySql);
    return result;
  }

  async function marcarLlegadaRuta(query) {
    const id = query.id;
    const km = query.km;
    const querySql = `
      UPDATE ruteamientos SET r_hora_l = TIME(NOW()), r_ult_km = ${km} WHERE r_codigo = ${id}
    `;
    const result = await db.sql(querySql);
    return result;
  }

  async function marcarLlegadaEntrega(id, chat_id, latitud, longitud) {
    try {
      // Obtenemos la información del reparto y cliente
      const queryInfo = `
      SELECT
        dr.d_codigo,
        op.op_nombre as chofer,
        CASE 
          WHEN drp.d_proveedor IS NOT NULL THEN pr.pro_razon
          WHEN drc.d_cliente IS NOT NULL THEN cli.cli_razon
          WHEN drped.dd_pedido IS NOT NULL THEN cli_ped.cli_razon  
          WHEN drv.dd_venta IS NOT NULL THEN cli_ven.cli_razon
        END as cliente
      FROM detalle_ruteamientos dr
      LEFT JOIN ruteamientos r ON r.r_codigo = dr.d_ruteamiento
      LEFT JOIN operadores op ON op.op_codigo = r.r_chofer
      LEFT JOIN detalle_ruteo_pago drp ON drp.d_detalle = dr.d_codigo
      LEFT JOIN detalle_ruteo_cobro drc ON drc.d_detalle = dr.d_codigo
      LEFT JOIN detalle_ruteo_pedido drped ON drped.dd_detalle = dr.d_codigo
      LEFT JOIN detalle_ruteo_venta drv ON drv.dd_detalle = dr.d_codigo
      LEFT JOIN proveedores pr ON pr.pro_codigo = drp.d_proveedor
      LEFT JOIN clientes cli ON cli.cli_codigo = drc.d_cliente
      LEFT JOIN pedidos p ON p.p_codigo = drped.dd_pedido
      LEFT JOIN clientes cli_ped ON cli_ped.cli_codigo = p.p_cliente
      LEFT JOIN ventas v ON v.ve_codigo = drv.dd_venta
      LEFT JOIN clientes cli_ven ON cli_ven.cli_codigo = v.ve_cliente
      WHERE dr.d_codigo = ${id}
    `;

      const infoResult = await db.sql(queryInfo);
      const info = infoResult[0];

      // Actualizamos la hora de llegada
      const query = `
      UPDATE detalle_ruteamientos SET d_hora_e = TIME(NOW()) WHERE d_codigo = ${id}
    `;
      await db.sql(query);

      const horaLocal = new Date().toLocaleTimeString("es-PY", {
        timeZone: "America/Asuncion",
        hour: "2-digit",
        minute: "2-digit",
      });

      const mensaje = `🚚 <b>Llegada a Cliente</b>\n\n👨‍✈️ Chofer: ${
        info.chofer
      }\n👥 Cliente: ${
        info.cliente
      }\n🕒 Hora: ${horaLocal}`;

      const chatIds = Array.isArray(chat_id) ? chat_id : [chat_id];

      console.log(chatIds);
      console.log(mensaje);
      console.log("enviando mensaje");

      const notificationPromises = chatIds.map((chatId) =>
        telegramBot.enviarMensajeConUbicacion(
          chatId,
          mensaje,
          latitud,
          longitud
        )
      )

      await Promise.all(notificationPromises);
      return {
        success: true,
        mensaje: "Llegada registrada y notificación enviada",
      };


    } catch (error) {
      console.error("Error al marcar llegada:", error);
      return {
        success: false,
        mensaje: "Error al registrar llegada",
        error: error.message,
      };
    }
  }

  async function marcarSalidaEntrega(id, chat_id, latitud, longitud) {
    try {
      const queryInfo = `
      SELECT 
        dr.d_codigo,
        op.op_nombre as chofer,
        CASE 
          WHEN drp.d_proveedor IS NOT NULL THEN pr.pro_razon
          WHEN drc.d_cliente IS NOT NULL THEN cli.cli_razon
          WHEN drped.dd_pedido IS NOT NULL THEN cli_ped.cli_razon  
          WHEN drv.dd_venta IS NOT NULL THEN cli_ven.cli_razon
        END as cliente
      FROM detalle_ruteamientos dr
      LEFT JOIN ruteamientos r ON r.r_codigo = dr.d_ruteamiento
      LEFT JOIN operadores op ON op.op_codigo = r.r_chofer
      LEFT JOIN detalle_ruteo_pago drp ON drp.d_detalle = dr.d_codigo
      LEFT JOIN detalle_ruteo_cobro drc ON drc.d_detalle = dr.d_codigo
      LEFT JOIN detalle_ruteo_pedido drped ON drped.dd_detalle = dr.d_codigo
      LEFT JOIN detalle_ruteo_venta drv ON drv.dd_detalle = dr.d_codigo
      LEFT JOIN proveedores pr ON pr.pro_codigo = drp.d_proveedor
      LEFT JOIN clientes cli ON cli.cli_codigo = drc.d_cliente
      LEFT JOIN pedidos p ON p.p_codigo = drped.dd_pedido
      LEFT JOIN clientes cli_ped ON cli_ped.cli_codigo = p.p_cliente
      LEFT JOIN ventas v ON v.ve_codigo = drv.dd_venta
      LEFT JOIN clientes cli_ven ON cli_ven.cli_codigo = v.ve_cliente
      WHERE dr.d_codigo = ${id}
    `;

      const infoResult = await db.sql(queryInfo);
      const info = infoResult[0];

      // Actualizamos la hora de llegada
      const query = `
      UPDATE detalle_ruteamientos SET d_hora_S = TIME(NOW()) WHERE d_codigo = ${id}
    `;
      await db.sql(query);

      const horaLocal = new Date().toLocaleTimeString("es-PY", {
        timeZone: "America/Asuncion",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Enviamos la notificación por WhatsApp usando Twilio
      const mensaje = `🚚 <b>Salida del cliente</b>\n\n👨‍✈️ Chofer: ${
        info.chofer
      }\n👥 Cliente: ${
        info.cliente
      }\n🕒 Hora: ${horaLocal}`;


      const chatIds = Array.isArray(chat_id) ? chat_id : [chat_id];


      console.log(chatIds);
      console.log(mensaje);
      console.log("enviando mensaje");

      const notificationPromises = chatIds.map((chatId) =>
        telegramBot.enviarMensajeConUbicacion(
          chatId,
          mensaje,
          latitud,
          longitud
        )
      );

      await Promise.all(notificationPromises);
      return {
        success: true,
        mensaje: "Salida registrada y notificación enviada",
      };
    } catch (error) {
      console.error("Error al marcar llegada:", error);
      return {
        success: false,
        mensaje: "Error al registrar llegada",
        error: error.message,
      };
    }
  }

  async function fetchVentas(filtro) {
    const fecha_desde = filtro.fecha_desde;
    const fecha_hasta = filtro.fecha_hasta;
    const cliente = filtro.cliente;
    let whereCliente = "";

    if (cliente && cliente.trim() !== "" && cliente.length > 0) {
      whereCliente = ` AND cli.cli_codigo = ${cliente}`;
    }

    const query = `
      SELECT
      ve_codigo as id,
      DATE_FORMAT(ve_fecha, '%d/%m/%Y') as fecha,
      ve_factura as factura,
      cli.cli_razon as cliente,
      IF(ve_credito = 1, 'Credito', 'Contado') as condicion,
      m.mo_descripcion as moneda,
      ve_total as monto,
      ve_obs as observacion,
      op.op_nombre as vendedor
      FROM ventas v
      LEFT JOIN clientes cli ON cli.cli_codigo = v.ve_cliente
      LEFT JOIN monedas m ON m.mo_codigo = v.ve_moneda
      LEFT JOIN operadores op ON op.op_codigo = v.ve_vendedor
      WHERE v.ve_estado = 1 AND v.ve_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'
      ${whereCliente}
      AND NOT EXISTS (
        SELECT 1 FROM detalle_ruteo_venta drv 
        INNER JOIN detalle_ruteamientos dr ON dr.d_codigo = drv.dd_detalle
        WHERE drv.dd_venta = v.ve_codigo
      )

      ORDER BY v.ve_fecha DESC

    `;
    const result = await db.sql(query);
    return result;
  }

  async function fetchDetalleVentas(id_venta) {
    const query = `
      SELECT
      deve_articulo as item,
      ar.ar_descripcion as descripcion,
      deve_cantidad as cantidad,
      deve_precio as precio,
      deve_descuento as descuento,
      (deve_precio - deve_descuento) * deve_cantidad as total
      FROM detalle_ventas dv
      LEFT JOIN articulos ar ON ar.ar_codigo = dv.deve_articulo
      WHERE deve_venta = ${id_venta}
    `;
    const result = await db.sql(query);
    return result;
  }

  async function fetchPedidos(filtro) {
    const fecha_desde = filtro.fecha_desde;
    const fecha_hasta = filtro.fecha_hasta;
    const cliente = filtro.cliente;
    let whereCliente = "";

    if (cliente && cliente.trim() !== "" && cliente.length > 0) {
      whereCliente = ` AND cli.cli_codigo = ${cliente}`;
    }

    const query = `
      SELECT
      p_codigo as id,
      DATE_FORMAT(p_fecha, '%d/%m/%Y') as fecha,
      cli.cli_razon as cliente,
      IF(p_credito = 1, 'Credito', 'Contado') as condicion,

      m.mo_descripcion as moneda,
      p_obs as observacion,
      op.op_nombre as vendedor,
      (SELECT SUM((dp_precio - dp_descuento) * dp_cantidad)  FROM detalle_pedido WHERE dp_pedido = p.p_codigo) as monto
      FROM pedidos p
      LEFT JOIN monedas m ON m.mo_codigo = p.p_moneda
      LEFT JOIN clientes cli ON cli.cli_codigo = p.p_cliente
      LEFT JOIN operadores op ON op.op_codigo = p.p_operador
      WHERE p.p_estado = 1 
      AND p.p_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'
      ${whereCliente}
      AND NOT EXISTS (
        SELECT 1 FROM detalle_ruteo_pedido drp 
        INNER JOIN detalle_ruteamientos dr ON dr.d_codigo = drp.dd_detalle
        WHERE drp.dd_pedido = p.p_codigo
      )
      ORDER BY p.p_fecha DESC
    `;
    const result = await db.sql(query);

    return result;
  }

  async function fetchDetallePedidos(id_pedido) {
    const query = `
      SELECT
      dp_articulo as item,
      ar.ar_descripcion as descripcion,
      dp_cantidad as cantidad,
      dp_precio as precio,
      dp_descuento as descuento,
      (dp_precio - dp_descuento) * dp_cantidad as total
      FROM detalle_pedido dp
      LEFT JOIN articulos ar ON ar.ar_codigo = dp.dp_articulo
      WHERE dp_pedido = ${id_pedido}
    `;
    const result = await db.sql(query);
    return result;
  }

  async function fetchCamiones() {
    const query = `
      SELECT c.c_codigo as id , c.c_descripcion as descripcion, c.c_chapa as chapa FROM camiones c where c.c_estado = 1 order by c.c_descripcion asc;
    `;
    const result = await db.sql(query);
    return result;
  }

  async function fetchChoferes() {
    const query = `
      SELECT op.op_codigo as id, op.op_nombre as nombre , op.op_documento as ci, r.rol_descripcion as rol 
      FROM operador_roles o
      INNER JOIN operadores op ON op.op_codigo = o.or_operador
      INNER JOIN roles r ON r.rol_codigo = o.or_rol
      WHERE (o.or_rol = 9 or o.or_rol=6)  AND op.op_estado = 1
    `;
    const result = await db.sql(query);
    return result;
  }

  return {
    insertarReparto,
    listarReparto,
    listarDetalleReparto,
    listarRutas,
    marcarSalidaRuta,
    marcarLlegadaRuta,
    marcarLlegadaEntrega,
    marcarSalidaEntrega,
    fetchVentas,
    fetchDetalleVentas,
    fetchPedidos,
    fetchDetallePedidos,
    fetchCamiones,
    fetchChoferes,
    resumenRepartos,
  };
};
