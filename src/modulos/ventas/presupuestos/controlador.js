const CABECERA = "presupuesto";
const DETALLES = "detalle_presupuesto";

module.exports = function (dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require("../../../DB/mysql.js");
  }

  async function agregarPresupuesto(req, res) {
    const { presupuesto, detalle_presupuesto } = req.body;

    try {
      // Insert venta
      const presupuestoResult = await db.agregar(
        CABECERA,
        {
          pre_cliente: presupuesto.pre_cliente,
          pre_operador: presupuesto.pre_operador,
          pre_moneda: presupuesto.pre_moneda,
          pre_fecha: presupuesto.pre_fecha,
          pre_descuento: presupuesto.pre_descuento,
          pre_estado: presupuesto.pre_estado || 1,
          pre_confirmado: presupuesto.pre_confirmado || 0,
          pre_vendedor: presupuesto.pre_vendedor,
          pre_credito: presupuesto.pre_credito || 0,
          pre_hora: presupuesto.pre_hora,
          pre_obs: presupuesto.pre_obs || "",
          pre_flete: presupuesto.pre_flete || 0,
          pre_plazo: presupuesto.pre_plazo || 0,
          pre_validez: presupuesto.pre_validez || 0,
          pre_condicion: presupuesto.pre_condicion || 0,
          pre_sucursal: presupuesto.pre_sucursal,
          pre_deposito: presupuesto.pre_deposito || 0,
        },
        0,
        "pre_codigo"
      );

      const presupuestoId = presupuestoResult.insertId;

      // Insert detalle_ventas
      for (const item of detalle_presupuesto) {
        await db.agregar(
          DETALLES,
          {
            depre_presupuesto: presupuestoId,
            depre_articulo: item.depre_articulo,
            depre_cantidad: item.depre_cantidad,
            depre_precio: item.depre_precio,
            depre_descuento: item.depre_descuento,
            depre_exentas: item.depre_exentas || 0,
            depre_cinco: item.depre_cinco || 0,
            depre_diez: item.depre_diez || 0,
            depre_porcentaje: item.depre_porcentaje || 0,
            depre_altura: item.depre_altura || 0,
            depre_largura: item.depre_largura || 0,
            depre_mts2: item.depre_mts2 || 0,
            depre_listaprecio: item.depre_listaprecio || 1,
            depre_talle: item.depre_talle || "",
            depre_codlote: item.depre_codlote || 0,
            depre_lote: item.depre_codlote || "",
            depre_vence: item.depre_vence || "",
            depre_descripcio_art: item.depre_descripcio_art || "",
            depre_obs: item.depre_obs || "",
            depre_procesado: item.depre_procesado || 0,
          },
          0,
          "depre_codigo"
        );
      }

      return presupuestoId;
    } catch (error) {
      console.error("Error al agregar presupuesto:", error);
      res.status(500).json({
        success: false,
        message: "Error al agregar presupuesto",
        error: error.message,
      });
    }
  }

  function uno(cod) {
    const primary_key = `pre_codigo = ${cod} `;
    const campos = " *, DATE_FORMAT(pre_fecha, '%Y-%m-%d') AS fecha ";
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
    estado,
    busqueda
  ) {
    let where = "1 = 1 ";

    let limit = "";
    if (busqueda) {
      where += ` AND (pre.pre_codigo LIKE '%${busqueda}%' OR cli.cli_razon LIKE '%${busqueda}%')`;
    } else {
      if (fecha_desde) where += ` AND pre.pre_fecha >= '${fecha_desde}'`;
      if (fecha_hasta) where += ` AND pre.pre_fecha <= '${fecha_hasta}'`;
      if (sucursal) where += ` AND pre.pre_sucursal = '${sucursal}'`;
      if (cliente) where += ` AND pre.pre_cliente = '${cliente}'`;
      if (vendedor) where += ` AND pre.pre_vendedor = '${vendedor}'`;
      if (articulo)
        where += ` AND pre.pre_codigo IN (SELECT z.depre_presupuesto FROM detalle_presupuesto z WHERE depre_articulo = ${articulo})`;
      if (moneda) where += ` AND pre.pre_moneda = ${moneda}`;
      if (estado == 1) where += ` AND pre.pre_confirmado = 1`;
      if (estado == 0) where += ` AND pre.pre_confirmado = 0`;
    }

    if (busqueda) limit = ` LIMIT 10`;

    let query = `SELECT
                    pre.pre_codigo AS codigo,
                    cli.cli_codigo AS codcliente,
                    cli.cli_razon AS cliente,
                    mo.mo_descripcion AS moneda,
                    DATE_FORMAT(pre.pre_fecha, "%Y/%m/%d") AS fecha,
                    pre.pre_sucursal AS codsucursal,
                    s.descripcion AS sucursal,
                    v.op_nombre AS vendedor,
                    o.op_nombre AS operador,
                    FORMAT(SUM((depre.depre_precio - depre.depre_descuento) * depre.depre_cantidad) - pre.pre_descuento, 0, 'es_PY') AS total,
                    pre.pre_descuento AS descuento,
                    0 AS saldo,
                    IF (pre.pre_credito = 1, "Crédito", "Contado") AS condicion,
                    pre_validez AS vencimiento,
                    "" AS factura,
                    pre.pre_obs AS obs,
                    pre.pre_estado AS estado,
                    IF(pre.pre_confirmado = 1, "Confirmado", "Pendiente") AS estado_desc,

                    pre.pre_condicion,
                    pre.pre_plazo,
                    pre.pre_flete
                  FROM
                    presupuesto pre
                    INNER JOIN clientes cli ON pre.pre_cliente = cli.cli_codigo
                    INNER JOIN monedas mo ON pre.pre_moneda = mo.mo_codigo
                    INNER JOIN operadores v ON pre.pre_vendedor = v.op_codigo
                    INNER JOIN operadores o ON pre.pre_operador = o.op_codigo
                    INNER JOIN sucursales s ON pre.pre_sucursal = s.id
                    INNER JOIN detalle_presupuesto depre ON depre.depre_presupuesto = pre.pre_codigo
                  WHERE
                    ${where}
                  GROUP BY pre.pre_codigo
                  ORDER BY pre.pre_codigo DESC ${limit}`;
    console.log(query);
    return db.sql(query);
  }

  function getDetalles(presupuesto) {
    let query = `SELECT
                    depre.depre_codigo AS det_codigo,
                    depre.depre_articulo AS art_codigo,
                    ar.ar_codbarra AS codbarra,
                    ar.ar_descripcion AS descripcion,
                    ar.ar_editar_desc,
                    depre.depre_cantidad AS cantidad,
                    depre.depre_precio AS precio,
                    depre.depre_descuento AS descuento,
                    depre.depre_exentas AS exentas,
                    depre.depre_cinco AS cinco,
                    depre.depre_diez AS diez,
                    depre.depre_codlote AS codlote,
                    depre.depre_lote AS lote,
                    depre.depre_largura AS largura,
                    depre.depre_altura AS altura,
                    depre.depre_mts2 AS mt2,
                    depre_descripcio_art as descripcion_editada,
                    depre.depre_listaprecio AS listaprecio,
                    DATE_FORMAT(depre.depre_vence, "%Y-%m-%d") AS vence,
                    depre.depre_obs,
                    ar.ar_iva AS iva,
                    ar.ar_kilos AS kilos
                  FROM
                    detalle_presupuesto depre
                    INNER JOIN articulos ar ON ar.ar_codigo = depre.depre_articulo
                  WHERE
                    depre.depre_presupuesto = ${presupuesto}
                  AND depre.depre_cantidad > 0
                  ORDER BY
                    depre.depre_codigo`;
    return db.sql(query);
  }

  async function agregarCabecera(datos) {
    const primary_key_value = datos.pre_codigo;
    const primary_key_name = "pre_codigo";
    return db.agregar(CABECERA, datos, primary_key_value, primary_key_name);
  }

  function agregarDetalle(datos) {
    const primary_key_value = datos.depre_codigo;
    const primary_key_name = "depre_codigo";
    return db.agregar(DETALLES, datos, primary_key_value, primary_key_name);
  }

  function eliminarDetalle(id) {
    const query = `DELETE FROM ${DETALLES} WHERE depre_codigo = ${id}`;
    return db.sql(query);
  }

  async function actualizarPresupuestoParcial(presupuestoId, itemsEliminados) {
    try {
      console.log("Iniciando actualización parcial del presupuesto", {
        presupuestoId,
        itemsEliminados,
      });

      const detallesActuales = await getDetalles(presupuestoId);
      console.log("Detalles actuales del presupuesto:", detallesActuales);

      for (const detalleActual of detallesActuales) {
        const itemEliminado = itemsEliminados.find(
          (item) => item.art_codigo === detalleActual.art_codigo
        );

        if (itemEliminado) {
          const cantidadActual = parseFloat(detalleActual.cantidad);
          const cantidadEliminada = parseFloat(itemEliminado.cantidad);
          console.log(
            "Comparando cantidades para el item NO vendido completamente:",
            { cantidadActual, cantidadEliminada }
          );

          if (cantidadActual !== cantidadEliminada) {
            const nuevaCantidad = cantidadActual - cantidadEliminada;
            console.log(
              "Actualizando cantidad del item que no se vendió completamente. Nueva cantidad:",
              nuevaCantidad
            );

            await db.actualizar(
              DETALLES,
              { depre_cantidad: nuevaCantidad },
              detalleActual.det_codigo,
              "depre_codigo"
            );
            console.log(
              "Cantidad actualizada en la base de datos para el item:",
              detalleActual.art_codigo
            );
          } else {
            console.log(
              "Las cantidades son iguales, no se requiere actualización para el item:",
              detalleActual.art_codigo
            );
          }
        }
      }

      // Eliminar todos los detalles excepto el que está en itemsEliminados
      for (const detalle of detallesActuales) {
        const itemNoEliminar = itemsEliminados.find(
          (item) => item.art_codigo === detalle.art_codigo
        );

        if (!itemNoEliminar) {
          console.log(
            "Eliminando detalle de venta completamente vendido:",
            detalle.art_codigo
          );
          await db.actualizar(
            DETALLES,
            { depre_cantidad: 0 },
            detalle.det_codigo,
            "depre_codigo"
          );
        } else {
          console.log(
            "Este item no fue vendido completamente y no se elimina:",
            detalle.art_codigo
          );
        }
      }

      const detallesFinales = await getDetalles(presupuestoId);
      console.log(
        "Detalles finales después de la eliminación:",
        detallesFinales
      );

      // Verificar si todos los items tienen cantidad = 0
      const todosCero = detallesFinales.every(
        (detalle) => parseFloat(detalle.cantidad) === 0
      );

      if (todosCero) {
        console.log(
          "Todos los items tienen cantidad = 0, actualizando pre_confirmado a 1"
        );
        await db.actualizar(
          "presupuesto",
          { pre_confirmado: 1 },
          presupuestoId,
          "pre_codigo"
        );
        console.log(
          "Campo pre_confirmado actualizado a 1 en la tabla presupuesto"
        );
      }

      return { success: true, message: "Presupuesto actualizado parcialmente" };
    } catch (error) {
      console.error("Error al actualizar presupuesto parcialmente:", error);
      return {
        success: false,
        message: "Error al actualizar presupuesto",
        error: error.message,
      };
    }
  }

  async function confirmarPresupuesto(presupuestoId) {
    console.log("confirmarPresupuesto", presupuestoId);
    const primary_key_name = "pre_codigo";
    const primary_key_value = presupuestoId;
    const data = { pre_confirmado: 1 };
    return db.actualizar(CABECERA, data, primary_key_value, primary_key_name);
  }

  async function obtenerPresupuestosParaVenta(presupuestoId) {
    const query = `
      SELECT
        pre.pre_codigo as id,
        pre.pre_cliente as cliente,
        pre.pre_vendedor as vendedor,
        json_arrayagg(
          json_object(
            'codigo', depre.depre_codigo,
            'articulo', depre.depre_articulo,
            'cantidad', depre.depre_cantidad,
            'precio', depre.depre_precio,
            'descuento', depre.depre_descuento,
            'lote', depre.depre_lote,
            'loteid', depre.depre_codlote
          )
        ) as items
      FROM presupuesto pre
      INNER JOIN detalle_presupuesto depre ON pre.pre_codigo = depre.depre_presupuesto
      WHERE pre_codigo = ${presupuestoId}
    `;
    const datos = await db.sql(query);
    console.log(datos[0].items);
    return datos;
  }

  async function insertarPresupuesto(presupuesto, detalle_presupuesto) {
    try {
      console.log(presupuesto);
      console.log(detalle_presupuesto);

      let presupuestoId;

      // Función auxiliar para formatear fechas
      const formatearFecha = (fecha) => {
        if (!fecha || fecha === '') return '';
        
        // Si la fecha ya está en formato YYYY-MM-DD, la devolvemos tal cual
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
        
        // Si está en formato DD/MM/YYYY, la convertimos a YYYY-MM-DD
        const partes = fecha.split('/');
        if (partes.length === 3) {
          return `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
        
        return '';
      };
      
      if (presupuesto.pre_codigo) {
        presupuestoId = presupuesto.pre_codigo;
        const update_presupuestoQuery = `
          UPDATE presupuesto SET
            pre_cliente = ${presupuesto.pre_cliente},
            pre_operador = ${presupuesto.pre_operador},
            pre_moneda = ${presupuesto.pre_moneda},
            pre_fecha = '${presupuesto.pre_fecha}',
            pre_descuento = ${presupuesto.pre_descuento},
            pre_vendedor = ${presupuesto.pre_vendedor},
            pre_hora = '${presupuesto.pre_hora}',
            pre_obs = '${presupuesto.pre_obs || ""}', 
            pre_plazo = '${presupuesto.pre_plazo || ''}',
            pre_validez = '${presupuesto.pre_validez || ''}',
            pre_flete = "${presupuesto.pre_flete || ''}",
            pre_condicion = "${presupuesto.pre_condicion || ''}"
          WHERE pre_codigo = ${presupuesto.pre_codigo}
        `;
        await db.sql(update_presupuestoQuery);

        // Primero eliminar los detalles existentes
        const deleteDetallesQuery = `
          DELETE FROM detalle_presupuesto 
          WHERE depre_presupuesto = ${presupuesto.pre_codigo}
        `;
        await db.sql(deleteDetallesQuery);

        // Luego insertar los nuevos detalles
        for (const item of detalle_presupuesto) {
          const fechaVence = formatearFecha(item.depre_vence || '');
          
          const detallePresupuestoQuery = `
            INSERT INTO detalle_presupuesto
            (
              depre_presupuesto,
              depre_articulo,
              depre_cantidad,
              depre_precio,
              depre_descuento,
              depre_exentas,
              depre_cinco,
              depre_diez,
              depre_altura,
              depre_largura,
              depre_mts2,
              depre_listaprecio,
              depre_codlote,
              depre_lote,
              depre_vence,
              depre_descripcio_art,
              depre_obs,
              depre_procesado
            )
            VALUES
            (
              ${presupuesto.pre_codigo},
              ${item.depre_articulo},
              ${item.depre_cantidad},
              ${item.depre_precio},
              ${item.depre_descuento || 0},
              ${item.depre_exentas || 0},
              ${item.depre_cinco || 0},
              ${item.depre_diez || 0},
              ${item.depre_altura || 0},
              ${item.depre_largura || 0},
              ${item.depre_mts2 || 0},
              ${item.depre_listaprecio || 1},
              ${item.depre_codlote || 0},
              '${item.depre_lote || ""}',
              ${fechaVence ? `'${fechaVence}'` : 'NULL'},
              '${item.depre_descripcio_art || ""}',
              '${item.depre_obs || ""}',
              ${item.depre_procesado || 0}
            )
          `;
          await db.sql(detallePresupuestoQuery);
        }
        
        // Manejar detalle adicional
        if (presupuesto.detalle_adicional === 1 && presupuesto.detalle_adicional_texto) {
          // Primero verificar si ya existe una entrada para este presupuesto
          const checkObservacionQuery = `
            SELECT presupuesto FROM presupuesto_observacion 
            WHERE presupuesto = ${presupuesto.pre_codigo}
          `;
          const observacionExistente = await db.sql(checkObservacionQuery);
          
          if (observacionExistente && observacionExistente.length > 0) {
            // Actualizar observación existente
            const updateObservacionQuery = `
              UPDATE presupuesto_observacion 
              SET observaciones = '${presupuesto.detalle_adicional_texto}'
              WHERE presupuesto = ${presupuesto.pre_codigo}
            `;
            await db.sql(updateObservacionQuery);
          } else {
            // Insertar nueva observación
            const insertObservacionQuery = `
              INSERT INTO presupuesto_observacion (presupuesto, observaciones)
              VALUES (${presupuesto.pre_codigo}, '${presupuesto.detalle_adicional_texto}')
            `;
            await db.sql(insertObservacionQuery);
          }
        }
        
        return { success: true, message: "Presupuesto insertado con éxito" , id: presupuestoId };
      } else {
        const presupuestoQuery = `
          INSERT INTO presupuesto (
            pre_cliente,
            pre_operador,
            pre_moneda,
            pre_fecha,
            pre_descuento,
            pre_vendedor,
            pre_hora,
            pre_obs, 
            pre_plazo,
            pre_validez,
            pre_flete,
            pre_condicion,
            pre_sucursal,
            pre_deposito
          )
          VALUES
          (
            ${presupuesto.pre_cliente},
            ${presupuesto.pre_operador},
            ${presupuesto.pre_moneda},
            '${presupuesto.pre_fecha}',
            ${presupuesto.pre_descuento},
            ${presupuesto.pre_vendedor},
            '${presupuesto.pre_hora}',
            '${presupuesto.pre_obs || ""}',
            '${presupuesto.pre_plazo || ''}',
            '${presupuesto.pre_validez || ''}',
            '${presupuesto.pre_flete || ''}',
            '${presupuesto.pre_condicion || ''}',
            ${presupuesto.pre_sucursal},
            ${presupuesto.pre_deposito}
          )
        `;
        const presupuestoResult = await db.sql(presupuestoQuery);

        presupuestoId = presupuestoResult.insertId;

        for (const item of detalle_presupuesto) {
          const fechaVence = formatearFecha(item.depre_vence || '');
          
          const detallePresupuestoQuery = `
            INSERT INTO detalle_presupuesto
            (
              depre_presupuesto,
              depre_articulo,
              depre_cantidad,
              depre_precio,
              depre_descuento,
              depre_exentas,
              depre_cinco,
              depre_diez,
              depre_altura,
              depre_largura,
              depre_mts2,
              depre_listaprecio,
              depre_codlote,
              depre_lote,
              depre_vence,
              depre_descripcio_art,
              depre_obs,
              depre_procesado
            )
            VALUES
            (
              ${presupuestoId},
              ${item.depre_articulo},
              ${item.depre_cantidad},
              ${item.depre_precio},
              ${item.depre_descuento || 0},
              ${item.depre_exentas || 0},
              ${item.depre_cinco || 0},
              ${item.depre_diez || 0},
              ${item.depre_altura || 0},
              ${item.depre_largura || 0},
              ${item.depre_mts2 || 0},
              ${item.depre_listaprecio || 1},
              ${item.depre_codlote || 0},
              '${item.depre_lote || ""}',
              ${fechaVence ? `'${fechaVence}'` : 'NULL'},
              '${item.depre_descripcio_art || ""}',
              '${item.depre_obs || ""}',
              ${item.depre_procesado || 0}
            )
          `;
          await db.sql(detallePresupuestoQuery);
        }
        
        // Manejar detalle adicional para nuevo presupuesto
        if (presupuesto.detalle_adicional === 1 && presupuesto.detalle_adicional_texto) {
          const insertObservacionQuery = `
            INSERT INTO presupuesto_observacion (presupuesto, observaciones)
            VALUES (${presupuestoId}, '${presupuesto.detalle_adicional_texto}')
          `;
          await db.sql(insertObservacionQuery);
        }
      }
      return { success: true, message: "Presupuesto insertado con éxito" , id: presupuestoId };
    } catch (error) {
      console.error("Error al insertar presupuesto:", error);
      throw error;
    }
  }
  async function recuperarPresupuesto(id) {
    const query = `
      SELECT
        pre.pre_codigo,
        pre.pre_cliente,
        pre.pre_vendedor,
        pre.pre_moneda,
        pre.pre_descuento,
        pre.pre_operador,
        pre.pre_obs,
        pre.pre_plazo,
        pre.pre_validez,
        pre.pre_flete,
        pre.pre_condicion,
        pre.pre_deposito,
        pre.pre_sucursal,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'depre_articulo', depre.depre_articulo,
            'depre_cantidad', depre.depre_cantidad,
            'depre_precio', depre.depre_precio,
            'depre_descuento', depre.depre_descuento,
            'depre_exentas', depre.depre_exentas,
            'depre_cinco', depre.depre_cinco,
            'depre_diez', depre.depre_diez,
            'depre_altura', depre.depre_altura,
            'depre_largura', depre.depre_largura,
            'depre_mts2', depre.depre_mts2,
            'depre_listaprecio', depre.depre_listaprecio,
            'depre_codlote', depre.depre_codlote,
            'depre_lote', depre.depre_lote,
            'depre_vence', depre.depre_vence,
            'depre_descripcio_art', depre.depre_descripcio_art,
            'depre_obs', depre.depre_obs,
            'depre_procesado', depre.depre_procesado,
            'precio_original', ar.ar_pvg,
            'precio_dolares', ar.ar_pvd,
            'precio_pesos', ar.ar_pvp,
            'descripcion', ar.ar_descripcion,
            'cod_barra', ar.ar_codbarra,
            'editar_nombre', ar.ar_editar_desc
          )
        ) as items
      FROM presupuesto pre
      INNER JOIN detalle_presupuesto depre ON pre.pre_codigo = depre.depre_presupuesto
      INNER JOIN articulos ar ON depre.depre_articulo = ar.ar_codigo
      WHERE pre.pre_codigo = ${id}
    `;
    const result = await db.sql(query);
    return result[0];
  }

  async function imprimirPresupuesto(id) {
    const query =
    `
      SELECT
        pre.pre_codigo as id,
        cli.cli_razon as cliente_razon,
        cli.cli_ruc as cliente_ruc,
        cli.cli_dir as cliente_direccion,
        pre.pre_condicion as condicion_pago,
        pre.pre_plazo as plazo_entrega,
        pre.pre_flete as flete,
        pre.pre_obs as observacion,
        op.op_nombre as vendedor,
        FORMAT(sum(depre.depre_precio * depre.depre_cantidad), 0, 'es_PY') as subtotal,
        FORMAT(sum(depre.depre_exentas + depre.depre_cinco + depre.depre_diez), 0, 'es_PY') as total,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'codigo_barra', ar.ar_codbarra,
            'descripcion', IF(depre.depre_descripcio_art != '', depre.depre_descripcio_art, ar.ar_descripcion),
            'cantidad', depre.depre_cantidad,
            'precio', format(depre.depre_precio, 0, 'es_PY'),
            'marca', ma.ma_descripcion,
            'subtotal', format(depre.depre_precio * depre.depre_cantidad, 0, 'es_PY')
          )
        ) as items
      FROM presupuesto pre
      INNER JOIN clientes cli ON pre.pre_cliente = cli.cli_codigo
      INNER JOIN operadores op ON pre.pre_vendedor = op.op_codigo
      INNER JOIN detalle_presupuesto depre ON pre.pre_codigo = depre.depre_presupuesto
      INNER JOIN articulos ar ON depre.depre_articulo = ar.ar_codigo
      INNER JOIN marcas ma ON ar.ar_marca = ma.ma_codigo
      WHERE pre.pre_codigo = ${id}
    `
    const result = await db.sql(query);
    return result[0];
  }
  
  return {
    uno,
    getCabeceras,
    getDetalles,
    agregarCabecera,
    agregarDetalle,
    eliminarDetalle,
    agregarPresupuesto,
    confirmarPresupuesto,
    actualizarPresupuestoParcial,
    obtenerPresupuestosParaVenta,
    insertarPresupuesto,
    recuperarPresupuesto,
    imprimirPresupuesto,
  };
};
