module.exports = function (dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require("../../DB/mysql");
  }

  async function crear_inventario(inventario) {
    try {
      console.log("inventario_inside", inventario);

      const operador = inventario.operador;
      const sucursal = inventario.sucursal;
      const deposito = inventario.deposito;
      const estado = 0;
      const obs = inventario.obs;
      const nro_inventario = inventario.nro_inventario;

      const inventarioQuery = `
        INSERT INTO inventario_auxiliar (fecha, hora, operador, sucursal, deposito, estado, obs, nro_inventario)
        VALUES (NOW(), NOW(), ${operador}, ${sucursal}, ${deposito}, ${estado}, '${obs}', ${nro_inventario})`;

      const inventarioResult = await db.sql(inventarioQuery);
      const inventarioId = inventarioResult.insertId;
      return inventarioId;
    } catch (error) {
      console.error("Error al insertar inventario auxiliar:", error);
      throw error;
    }
  }

  async function get_inventario(
    inventario_id,
    nro_inventario,
    deposito,
    sucursal
  ) {
    try {
      let where = "WHERE 1=1";
      let esConsultaEspecifica = false;

      if (inventario_id) {
        where += ` AND id = ${inventario_id}`;
        esConsultaEspecifica = true;
      } else if (nro_inventario) {
        where += ` AND nro_inventario = ${nro_inventario} AND deposito = ${deposito} AND sucursal = ${sucursal}`;
        esConsultaEspecifica = true;
      } else if (deposito && sucursal) {
        // Si no hay ID ni nro_inventario, pero sí tenemos depósito y sucursal,
        // traemos el último inventario para esa combinación
        where += ` AND deposito = ${deposito} AND sucursal = ${sucursal}`;
        // No marcamos como consulta específica porque queremos mantener el ORDER BY y LIMIT 1
      } else {
        // Si no tenemos ningún criterio de filtrado específico, traemos todos los inventarios
        // pero ordenados por fecha descendente
      }

      const query = `SELECT 
           ia.id,
           ia.fecha as fecha_inicio,
           ia.hora as hora_inicio,
           ia.fecha_cierre,
           ia.hora_cierre,
           ia.operador as operador_id,
           op.op_nombre as operador_nombre,
           ia.sucursal as sucursal_id,
           su.descripcion as sucursal_nombre,
           ia.deposito as deposito_id,
           de.dep_descripcion as deposito_nombre,
           ia.nro_inventario,
           ia.estado,
           ia.autorizado,
           (
             SELECT JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', cat.ca_codigo,
                 'descripcion', cat.ca_descripcion,
                 'cantidad_items', cat.cantidad_items
               )
             )
             FROM (
               SELECT 
                 ca.ca_codigo,
                 ca.ca_descripcion,
                 COUNT(DISTINCT iai.id_articulo) as cantidad_items
               FROM categorias ca
               INNER JOIN subcategorias sc ON sc.sc_categoria = ca.ca_codigo
               INNER JOIN articulos ar ON ar.ar_subcategoria = sc.sc_codigo
               INNER JOIN inventario_auxiliar_items iai ON iai.id_articulo = ar.ar_codigo
               WHERE iai.id_inventario = ia.id
               GROUP BY ca.ca_codigo, ca.ca_descripcion
               ORDER BY ca.ca_descripcion
             ) cat
           ) as categorias,
           (
             SELECT JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', marc.ma_codigo,
                 'descripcion', marc.ma_descripcion,
                 'cantidad_items', marc.cantidad_items
               )
             )
             FROM (
               SELECT 
                 ma.ma_codigo,
                 ma.ma_descripcion,
                 COUNT(DISTINCT iai.id_articulo) as cantidad_items
               FROM marcas ma
               INNER JOIN articulos ar ON ar.ar_marca = ma.ma_codigo
               INNER JOIN inventario_auxiliar_items iai ON iai.id_articulo = ar.ar_codigo
               WHERE iai.id_inventario = ia.id
               GROUP BY ma.ma_codigo, ma.ma_descripcion
               ORDER BY ma.ma_descripcion
             ) marc
           ) as marcas,
           (
             SELECT JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', sec.s_codigo,
                 'descripcion', sec.s_descripcion,
                 'cantidad_items', sec.cantidad_items
               )
             )
             FROM (
               SELECT 
                 s.s_codigo,
                 s.s_descripcion,
                 COUNT(DISTINCT iai.id_articulo) as cantidad_items
               FROM secciones s
               INNER JOIN articulos ar ON ar.ar_seccion = s.s_codigo
               INNER JOIN inventario_auxiliar_items iai ON iai.id_articulo = ar.ar_codigo
               WHERE iai.id_inventario = ia.id
               GROUP BY s.s_codigo, s.s_descripcion
               ORDER BY s.s_descripcion
             ) sec
           ) as secciones
         FROM inventario_auxiliar ia
         INNER JOIN operadores op ON ia.operador = op.op_codigo
         INNER JOIN sucursales su ON ia.sucursal = su.id
         INNER JOIN depositos de ON ia.deposito = de.dep_codigo
         ${where}
         ORDER BY ia.fecha DESC${
           !esConsultaEspecifica && (deposito || sucursal) ? " LIMIT 1" : ""
         }`;

      console.log(query);
      const result = await db.sql(query);

      // Si es consulta específica por ID o nro_inventario, O si es consulta por depósito/sucursal
      // devolvemos solo el primer elemento
      if (
        esConsultaEspecifica ||
        (deposito && sucursal && !inventario_id && !nro_inventario)
      ) {
        return result.length > 0 ? result[0] : null;
      }

      // En otro caso, devolvemos todos los resultados
      return result;
    } catch (error) {
      console.error("Error al obtener inventario:", error);
      throw error;
    }
  }
  // Esta función obtiene un inventario con opciones de filtrado más amplias
  async function get_inventarios(estado, deposito, sucursal, nro_inventario) {
    try {
      let where = "WHERE 1=1";

      if (estado !== undefined) {
        where += ` AND estado = ${estado}`;
      }

      if (deposito) {
        where += ` AND deposito = ${deposito}`;
      }

      if (sucursal) {
        where += ` AND sucursal = ${sucursal}`;
      }

      if (nro_inventario) {
        where += ` AND nro_inventario = ${nro_inventario}`;
      }

      where += ` AND ia.estado != 2`;

      const query = `SELECT  
           ia.id,
           ia.fecha as fecha_inicio,
           ia.hora as hora_inicio,
           ia.fecha_cierre,
           ia.hora_cierre,
           ia.operador as operador_id,
           op.op_nombre as operador_nombre,
           ia.sucursal as sucursal_id,
           su.descripcion as sucursal_nombre,
           ia.deposito as deposito_id,
           de.dep_descripcion as deposito_nombre,
           ia.nro_inventario,
           ia.estado,
           ia.autorizado,
           (
             SELECT JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', cat.ca_codigo,
                 'descripcion', cat.ca_descripcion,
                 'cantidad_items', cat.cantidad_items
               )
             )
             FROM (
               SELECT 
                 ca.ca_codigo,
                 ca.ca_descripcion,
                 COUNT(DISTINCT iai.id_articulo) as cantidad_items
               FROM categorias ca
               INNER JOIN subcategorias sc ON sc.sc_categoria = ca.ca_codigo
               INNER JOIN articulos ar ON ar.ar_subcategoria = sc.sc_codigo
               INNER JOIN inventario_auxiliar_items iai ON iai.id_articulo = ar.ar_codigo
               WHERE iai.id_inventario = ia.id
               GROUP BY ca.ca_codigo, ca.ca_descripcion
               ORDER BY ca.ca_descripcion
             ) cat
           ) as categorias,
           (
             SELECT JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', marc.ma_codigo,
                 'descripcion', marc.ma_descripcion,
                 'cantidad_items', marc.cantidad_items
               )
             )
             FROM (
               SELECT 
                 ma.ma_codigo,
                 ma.ma_descripcion,
                 COUNT(DISTINCT iai.id_articulo) as cantidad_items
               FROM marcas ma
               INNER JOIN articulos ar ON ar.ar_marca = ma.ma_codigo
               INNER JOIN inventario_auxiliar_items iai ON iai.id_articulo = ar.ar_codigo
               WHERE iai.id_inventario = ia.id
               GROUP BY ma.ma_codigo, ma.ma_descripcion
               ORDER BY ma.ma_descripcion
             ) marc
           ) as marcas,
           (
             SELECT JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', sec.s_codigo,
                 'descripcion', sec.s_descripcion,
                 'cantidad_items', sec.cantidad_items
               )
             )
             FROM (
               SELECT 
                 s.s_codigo,
                 s.s_descripcion,
                 COUNT(DISTINCT iai.id_articulo) as cantidad_items
               FROM secciones s
               INNER JOIN articulos ar ON ar.ar_seccion = s.s_codigo
               INNER JOIN inventario_auxiliar_items iai ON iai.id_articulo = ar.ar_codigo
               WHERE iai.id_inventario = ia.id
               GROUP BY s.s_codigo, s.s_descripcion
               ORDER BY s.s_descripcion
             ) sec
           ) as secciones
         FROM inventario_auxiliar ia
         INNER JOIN operadores op ON ia.operador = op.op_codigo
         INNER JOIN sucursales su ON ia.sucursal = su.id
         INNER JOIN depositos de ON ia.deposito = de.dep_codigo
         ${where}
         ORDER BY ia.fecha DESC, ia.hora DESC`;
      console.log(query);

      return await db.sql(query);
    } catch (error) {
      console.error("Error al obtener inventarios:", error);
      throw error;
    }
  }

  async function insertar_items_inventario(inventario_id, deposito, filtros) {
    try {
      console.log("Generando e insertando inventario auxiliar items:", filtros);

      // Validar parámetros básicos
      if (!inventario_id || !filtros || !deposito) {
        return {
          error: true,
          mensaje: "El ID del inventario y el depósito son obligatorios",
        };
      }

      // Verificar que el inventario existe y no está cerrado
      const inventarioExiste = await db.sql(`
        SELECT id, estado 
        FROM inventario_auxiliar 
        WHERE id = ${inventario_id}
        AND estado = 0
      `);

      if (inventarioExiste.length === 0) {
        return {
          error: true,
          mensaje: "El inventario no existe",
        };
      }

      if (inventarioExiste[0].estado > 1) {
        return {
          error: true,
          mensaje: "El inventario está cerrado o anulado",
        };
      }

      console.log("inventarioExiste", inventarioExiste);

      // Iniciar transacción
      await db.sql("START TRANSACTION");

      // Construir condiciones de filtro
      let condiciones = `al.al_deposito = ${deposito}`;
      condiciones += " AND ar.ar_estado = 1";

      // Aplicar filtros si existen
      if (filtros.categorias && filtros.categorias.length > 0) {
        condiciones += ` AND ca.ca_codigo IN (${filtros.categorias.join(",")})`;
      }

      if (filtros.marcas && filtros.marcas.length > 0) {
        condiciones += ` AND ar.ar_marca IN (${filtros.marcas.join(",")})`;
      }

      if (filtros.secciones && filtros.secciones.length > 0) {
        condiciones += ` AND ar.ar_seccion IN (${filtros.secciones.join(",")})`;
      }

      // Modificación importante: Manejar tanto array como número único
      if (filtros.articulos) {
        if (Array.isArray(filtros.articulos)) {
          if (filtros.articulos.length > 0) {
            condiciones += ` AND ar.ar_codigo IN (${filtros.articulos.join(",")})`;
          }
        } else if (typeof filtros.articulos === 'number') {
          condiciones += ` AND ar.ar_codigo = ${filtros.articulos}`;
        } else {
          await db.sql("ROLLBACK");
          return {
            error: true,
            mensaje: "El formato de artículos no es válido",
          };
        }
      }

      // Excluir artículos que ya están en el inventario
      condiciones += ` AND NOT EXISTS (
        SELECT 1 FROM inventario_auxiliar_items iai 
        WHERE iai.id_inventario = ${inventario_id} 
        AND iai.id_articulo = ar.ar_codigo 
        AND iai.id_lote = al.al_codigo
      )`;

      console.log("condiciones", condiciones);

      // Contar artículos a insertar
      const conteoQuery = `
        SELECT COUNT(*) as total
        FROM articulos_lotes al
        INNER JOIN articulos ar ON al.al_articulo = ar.ar_codigo
        INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
        INNER JOIN categorias ca ON sc.sc_categoria = ca.ca_codigo
        WHERE ${condiciones}
      `;

      const conteoResultado = await db.sql(conteoQuery);
      const totalArticulosNuevos = conteoResultado[0].total;

      if (totalArticulosNuevos === 0) {
        await db.sql("ROLLBACK");
        return {
          error: true,
          mensaje: "No hay nuevos artículos para agregar con estos filtros",
        };
      }

      // Ejecutar inserción
      const insertQuery = `
        INSERT INTO inventario_auxiliar_items
        (id_articulo, id_lote, id_inventario, lote, fecha_vencimiento, cantidad_inicial)
        SELECT
          ar.ar_codigo,
          al.al_codigo,
          ${inventario_id},
          al.al_lote,
          al.al_vencimiento,
          al.al_cantidad
        FROM articulos_lotes al
        INNER JOIN articulos ar ON al.al_articulo = ar.ar_codigo
        INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
        INNER JOIN categorias ca ON sc.sc_categoria = ca.ca_codigo
        WHERE ${condiciones}
      `;

      console.log("Ejecutando inserción de artículos");
      console.log(insertQuery);
      await db.sql(insertQuery);

      // Confirmar transacción
      await db.sql("COMMIT");

      return {
        error: false,
        mensaje: `Se agregaron ${totalArticulosNuevos} artículos al inventario`,
        articulos_agregados: totalArticulosNuevos,
      };
    } catch (error) {
      try {
        await db.sql("ROLLBACK");
      } catch (e) {}

      console.error("Error al generar inventario:", error);
      return {
        error: true,
        mensaje: `Error: ${error.message}`,
      };
    }
  }

  const scannear_item_inventario = async (
    id_articulo,
    id_lote,
    cantidad,
    lote = "",
    talle_id,
    color_id,
    vencimiento,
    codigo_barras = "",
    id_inventario,
    ubicacion_id,
    sub_ubicacion_id
  ) => {
    try {
      console.log("Datos recibidos:", {
        id_articulo,
        id_lote,
        cantidad,
        lote,
        codigo_barras,
        id_inventario,
        ubicacion_id,
        sub_ubicacion_id,
        talle_id,
        color_id,
        vencimiento 
      });

      // Verificar que el inventario no esté cerrado
      const inventarioResult = await db.sql(`
          SELECT estado FROM inventario_auxiliar WHERE id = ${id_inventario}
        `);

      // if (inventarioResult.length === 0 || inventarioResult[0].estado > 0) {
      //   await db.sql("ROLLBACK");
      //   return {
      //     error: true,
      //     mensaje:
      //       "No se puede modificar un inventario cerrado o que no existe",
      //   };
      // }

      // Iniciar transacción para asegurar consistencia
      await db.sql("START TRANSACTION");

      // Actualizar código de barras si se proporciona
      if (codigo_barras && codigo_barras.trim().length > 0) {
        // Sanear el código de barras para evitar problemas con comillas
        const codigoBarrasSaneado = codigo_barras.replace(/'/g, "''");

        console.log('cambiando codigo de barras a', codigoBarrasSaneado)

        // Actualizar en articulos_lotes
        await db.sql(`UPDATE articulos_lotes 
                       SET al_codbarra = '${codigoBarrasSaneado}' 
                       WHERE al_codigo = ${id_lote}`);

        // Actualizar en articulos
        await db.sql(`UPDATE articulos 
                       SET ar_codbarra = '${codigoBarrasSaneado}' 
                       WHERE ar_codigo = ${id_articulo}`);
      }

      if (ubicacion_id && ubicacion_id != 0 ) {

        console.log('cambiando ubicacion a', ubicacion_id)
        await db.sql(`UPDATE articulos 
                       SET ar_ubicacicion = ${ubicacion_id} 
                       WHERE ar_codigo = ${id_articulo}`);
      }

      if (sub_ubicacion_id && sub_ubicacion_id != 0) {
        console.log('cambiando sububicacion a', sub_ubicacion_id)
        await db.sql(`UPDATE articulos 
                       SET ar_sububicacion = ${sub_ubicacion_id} 
                       WHERE ar_codigo = ${id_articulo}`);
      }

      if(talle_id && talle_id != 0) {
        console.log('cambiando talle a', talle_id)
        await db.sql(`UPDATE articulos_lotes 
                       SET al_talle = ${talle_id} 
                       WHERE al_codigo = ${id_lote}`);
      }

      if(color_id && color_id != 0) {
        console.log('cambiando color a', color_id)
        await db.sql(`UPDATE articulos_lotes 
                       SET al_color = ${color_id} 
                       WHERE al_codigo = ${id_lote}`);
      }

      if(vencimiento && vencimiento.trim().length > 0) {
        console.log('cambiando vencimiento a', vencimiento)
        
        await db.sql(`UPDATE articulos_lotes 
                      SET al_vencimiento = '${vencimiento}' 
                      WHERE al_codigo = ${id_lote}`);
      } 

      console.log('cambiando lote a', lote)
      // Actualizar lote si se proporciona
      if (lote && lote.trim().length > 0) {
        // Sanear el lote para evitar problemas con comillas
        const loteSaneado = lote.replace(/'/g, "''");

        await db.sql(`UPDATE articulos_lotes 
                       SET al_lote = '${loteSaneado}' 
                       WHERE al_codigo = ${id_lote}`);
      }

      // Actualizar cantidad scanner en el inventario
      // Usamos IS NULL para manejar correctamente valores nulos en la consulta
      const cantidadSQL =
        cantidad !== undefined && cantidad !== null ? cantidad : "NULL";

      const resultadoUpdate = await db.sql(`
          UPDATE inventario_auxiliar_items 
          SET cantidad_scanner = ${cantidadSQL}
          WHERE id_articulo = ${id_articulo} 
          AND id_lote = ${id_lote} 
          AND id_inventario = ${id_inventario}
        `);

      // Confirmar transacción
      await db.sql("COMMIT");

      return {
        error: false,
        mensaje: "Artículo actualizado correctamente",
        codigo_barras_actualizado:
          codigo_barras && codigo_barras.trim().length > 0,
        lote_actualizado: lote && lote.trim().length > 0,
        cantidad_actualizada: cantidad !== undefined && cantidad !== null,
        filas_afectadas: resultadoUpdate.affectedRows || 0,
      };
    } catch (error) {
      // Revertir cambios en caso de error
      try {
        await db.sql("ROLLBACK");
      } catch (e) {
        console.error("Error en rollback:", e);
      }

      console.error("Error en scannear_item_inventario:", error);
      return {
        error: true,
        mensaje: `Error al actualizar el artículo: ${error.message}`,
      };
    }
  };

  // Función para cerrar un inventario (solo cambia el estado)
  async function cerrar_inventario(id) {
    try {
      // Iniciar transacción
      await db.sql("START TRANSACTION");

      // Verificar que el inventario existe y no está ya cerrado
      const inventarioResult = await db.sql(`
        SELECT id, estado 
        FROM inventario_auxiliar 
        WHERE id = ${id}
      `);

      if (inventarioResult.length === 0) {
        await db.sql("ROLLBACK");
        return {
          error: true,
          mensaje: "El inventario no existe",
        };
      }

      if (inventarioResult[0].estado > 0) {
        await db.sql("ROLLBACK");
        return {
          error: true,
          mensaje: "El inventario ya está cerrado o anulado",
        };
      }

      // Actualizar estado del inventario a cerrado (1)
      await db.sql(`
        UPDATE inventario_auxiliar 
        SET estado = 1,
            fecha_cierre = NOW(),
            hora_cierre = TIME_FORMAT(NOW(), '%H:%i')
        WHERE id = ${id}
      `);

      // Confirmar transacción
      await db.sql("COMMIT");

      return {
        error: false,
        mensaje: "Inventario cerrado exitosamente",
      };
    } catch (error) {
      // Revertir en caso de error
      try {
        await db.sql("ROLLBACK");
      } catch (e) {
        console.error("Error en rollback:", e);
      }

      console.error("Error al cerrar inventario:", error);
      return {
        error: true,
        mensaje: `Error al cerrar inventario: ${error.message}`,
      };
    }
  }

  // Función para autorizar y actualizar el stock según el inventario
  async function autorizar_inventario(
    id,
    operador,
    sucursal,
    deposito,
    nro_inventario
  ) {
    try {
      console.log("autorizando inventario", id, operador, sucursal, deposito, nro_inventario);
      // Iniciar transacción
      await db.sql("START TRANSACTION");

      // Verificar que el inventario existe y está cerrado
      const inventarioResult = await db.sql(`
        SELECT id, estado, autorizado, fecha, hora, fecha_cierre, hora_cierre
        FROM inventario_auxiliar 
        WHERE id = ${id}
      `);

      if (inventarioResult.length === 0) {
        await db.sql("ROLLBACK");
        return {
          error: true,
          mensaje: "El inventario no existe",
        };
      }

      if (inventarioResult[0].estado !== 1) {
        await db.sql("ROLLBACK");
        return {
          error: true,
          mensaje: "El inventario debe estar cerrado antes de autorizarlo",
        };
      }

      if (inventarioResult[0].autorizado === 1) {
        await db.sql("ROLLBACK");
        return {
          error: true,
          mensaje: "El inventario ya fue autorizado anteriormente",
        };
      }

      const inventario = inventarioResult[0];

      // Actualizar cantidades en articulos_lotes basado en la diferencia
      const updateLotesQuery = `
        UPDATE articulos_lotes al
        INNER JOIN inventario_auxiliar_items iai ON al.al_codigo = iai.id_lote
        INNER JOIN articulos ar ON al.al_articulo = ar.ar_codigo
        INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
        SET al.al_cantidad = CASE 
            WHEN iai.cantidad_scanner IS NULL AND al.al_cantidad != 0 THEN 0
            WHEN iai.cantidad_scanner IS NULL THEN 0
            ELSE al.al_cantidad + (
              COALESCE(iai.cantidad_scanner, 0) - iai.cantidad_inicial
            )
        END
        WHERE iai.id_inventario = ${id}
      `;

      console.log(updateLotesQuery);
      await db.sql(updateLotesQuery);

      // Agregar registro en tabla inventarios
      const agregarRegistroInventarioQuery = `
        INSERT INTO inventarios 
          (fecha, hora, operador, sucursal, deposito, tipo, estado, in_obs, nro_inventario)
        VALUES 
          (NOW(), TIME_FORMAT(NOW(), '%H:%i'), ${operador}, ${sucursal}, ${deposito}, 2, 1, 'Registro de inventario auxiliar', ${nro_inventario})
      `;

      console.log(agregarRegistroInventarioQuery);
      await db.sql(agregarRegistroInventarioQuery);

      // Marcar inventario como autorizado
      const autorizarInventarioQuery = `
        UPDATE inventario_auxiliar 
        SET autorizado = 1
        WHERE id = ${id}
      `;

      console.log(autorizarInventarioQuery);
      await db.sql(autorizarInventarioQuery);

      // Confirmar transacción
      await db.sql("COMMIT");
      
      return {
        error: false,
        mensaje: "Inventario autorizado exitosamente y stock actualizado",
      };
    } catch (error) {
      // Revertir en caso de error
      try {
        await db.sql("ROLLBACK");
      } catch (e) {
        console.error("Error en rollback:", e);
      }

      console.error("Error al autorizar inventario:", error);
      return {
        error: true,
        mensaje: `Error al autorizar inventario: ${error.message}`,
      };
    }
  }

  const get_items_a_escanear = async (nro_inventario, id_inventario, busqueda, deposito) => {
    let where = "";
    if (busqueda) {
      const palabras = busqueda.split(" ").filter((p) => p.length > 0);
      const condiciones = palabras.map(
        (palabra) =>
          `(ar.ar_descripcion LIKE '%${palabra}%' OR al.al_codbarra = '${palabra}' OR al.al_lote = '${palabra}' OR al.al_codigo = '${palabra}' OR ar.ar_cod_interno = '${palabra}' OR ar.ar_codbarra = '${palabra}')`
      );
      where += ` AND (${condiciones.join(" AND ")})`;
    }

    if (deposito) {
      where += ` AND ia.deposito = ${deposito}`;
    }
    if (id_inventario) {
      where += ` AND inventario_auxiliar_items.id_inventario = ${id_inventario}`;
    }

    const query = `
    SELECT
    id_articulo as articulo_id,
    ar.ar_cod_interno as cod_interno,
    id_lote as lote_id,
    ar.ar_descripcion as descripcion,
    ar.ar_ubicacicion as ubicacion_id,
    ub.ub_descripcion as ubicacion,
    ar.ar_vencimiento as control_vencimiento,
    DATE_FORMAT(al.al_vencimiento, '%Y/%m/%d') as vencimiento,
    ar.ar_sububicacion as sub_ubicacion_id,
    s.s_descripcion as sub_ubicacion,
    al.al_lote as lote,
    al.al_talle as talle,
    al.al_color as color,
    ar.ar_codbarra as cod_barra,
    al.al_codbarra as cod_barra_lote
    FROM inventario_auxiliar_items
    INNER JOIN articulos ar ON inventario_auxiliar_items.id_articulo = ar.ar_codigo
    INNER JOIN articulos_lotes al ON inventario_auxiliar_items.id_lote = al.al_codigo
    INNER JOIN inventario_auxiliar ia ON inventario_auxiliar_items.id_inventario = ia.id
    INNER JOIN ubicaciones ub ON ar.ar_ubicacicion = ub.ub_codigo
    INNER JOIN sub_ubicacion s ON ar.ar_sububicacion = s.s_codigo
    WHERE ia.nro_inventario = ${nro_inventario}
    AND inventario_auxiliar_items.cantidad_scanner IS NULL
    ${where}
    ORDER BY ar.ar_descripcion
    LIMIT 20`;
    const result = await db.sql(query);
    return result;
  };

  const get_items_inventario = async (
    nro_inventario, // Número de inventario (no es la PK)
    scanneado = false,
    deposito,
    sucursal,
    buscar,
    id_inventario // ID del inventario (PK)
  ) => {
    console.log(scanneado);

    // Construimos la condición de filtrado por escaneo, pero siempre devolvemos ambas cantidades
    let scanneado_query = "";

    let where = "";
    if (buscar) {
      const palabras = buscar.split(" ").filter((p) => p.length > 0);
      if (palabras.length > 0) {
        const condiciones = palabras.map((palabra) => {
          const palabraSegura = palabra.replace(/'/g, "''");
          return `(ar.ar_descripcion LIKE '%${palabraSegura}%' OR al.al_codbarra = '${palabraSegura}' OR al.al_lote = '${palabraSegura}' OR al.al_codigo = '${palabraSegura}' OR ar.ar_cod_interno = '${palabraSegura}')`;
        });
        where += ` AND (${condiciones.join(" AND ")})`;
      }
    }

    // Usamos ID inventario directamente si está disponible
    if (id_inventario) {
      where += ` AND inventario_auxiliar_items.id_inventario = ${id_inventario}`;
    }

    if (nro_inventario) {
      where += ` AND ia.nro_inventario = ${nro_inventario}`;
    }

    // Construir la consulta para verificar si el inventario existe
    let inventarioQuery;
    if (id_inventario) {
      inventarioQuery = `
         SELECT id FROM inventario_auxiliar WHERE id = ${id_inventario}
       `;
    } else {
      inventarioQuery = `
         SELECT id 
         FROM inventario_auxiliar 
         WHERE nro_inventario = ${nro_inventario}
         ${deposito ? ` AND deposito = ${deposito}` : ""}
         ${sucursal ? ` AND sucursal = ${sucursal}` : ""}
       `;
    }

    const inventarioResult = await db.sql(inventarioQuery);

    if (inventarioResult.length === 0) {
      console.log("No se encontró el inventario");
      return [];
    }

    // Si no teníamos el ID del inventario, lo obtenemos de la consulta

    // Aseguramos que la consulta principal use el ID correcto del inventario
    if (!id_inventario && inventarioResult[0].id) {
      where += ` AND inventario_auxiliar_items.id_inventario = ${inventarioResult[0].id}`;
    }

    // Consulta principal para obtener los items
    const query = `
     SELECT
       id_articulo as articulo_id,
       ar.ar_cod_interno as cod_interno,
       id_lote as lote_id,
       ar.ar_descripcion as descripcion,
       DATE_FORMAT(fecha_vencimiento, '%d/%m/%Y') as vencimiento,
       ub.ub_descripcion as ubicacion,
       s.s_descripcion as sub_ubicacion,
       al.al_lote as lote,
       al.al_codbarra as codigo_barra,
       ar.ar_codbarra as cod_barra_articulo,
       CAST(inventario_auxiliar_items.cantidad_inicial AS SIGNED) as cantidad_inicial,
       CAST(inventario_auxiliar_items.cantidad_scanner AS SIGNED) as cantidad_escaneada,
       CAST(al.al_cantidad AS SIGNED) as cantidad_actual,
       CASE 
         WHEN inventario_auxiliar_items.cantidad_scanner IS NOT NULL 
         THEN CAST(inventario_auxiliar_items.cantidad_scanner AS SIGNED) 
         ELSE CAST(inventario_auxiliar_items.cantidad_inicial AS SIGNED) 
       END as stock
     FROM inventario_auxiliar_items
     INNER JOIN articulos ar ON inventario_auxiliar_items.id_articulo = ar.ar_codigo
     INNER JOIN articulos_lotes al ON inventario_auxiliar_items.id_lote = al.al_codigo
     INNER JOIN inventario_auxiliar ia ON inventario_auxiliar_items.id_inventario = ia.id
     INNER JOIN ubicaciones ub ON ar.ar_ubicacicion = ub.ub_codigo
     INNER JOIN sub_ubicacion s ON ar.ar_sububicacion = s.s_codigo
     WHERE 1=1
     ${where}
     ${scanneado_query}
     ORDER BY ar.ar_descripcion
     `;

    const result = await db.sql(query);

    // Simplemente retornamos el resultado sin ninguna actualización
    return result;
  };

  const inventariosDisponibles = async (estado = 0, deposito) => {
    // Definir condición de estado de forma más clara
    let condicionEstado;
    if (estado == 0) {
      // Inventarios abiertos
      condicionEstado = "inventario_auxiliar.estado = 0";
    } else if (estado == 1) {
      // Inventarios cerrados pero no autorizados
      condicionEstado =
        "inventario_auxiliar.autorizado = 0 AND inventario_auxiliar.estado = 1";
    } else if (estado == 2) {
      // Inventarios autorizados
      condicionEstado =
        "inventario_auxiliar.autorizado = 1 AND inventario_auxiliar.estado = 1";
    } else {
      // Si se especifica otro valor, mostramos todos los inventarios
      condicionEstado = "1=1";
    }

    // Construir condición de depósito de forma más limpia
    const condicionDeposito = deposito
      ? `AND inventario_auxiliar.deposito = ${deposito}`
      : "";

    // Query con mejor formateado y columnas más descriptivas
    const query = `
         SELECT DISTINCT 
           inventario_auxiliar.id as id_inventario,
           inventario_auxiliar.nro_inventario,
           DATE_FORMAT(inventario_auxiliar.fecha, '%d/%m/%Y') as fecha,
           DATE_FORMAT(inventario_auxiliar.hora, '%H:%i') as hora,
           inventario_auxiliar.estado,
           inventario_auxiliar.autorizado,
           dep.dep_codigo as deposito_id,
           dep.dep_descripcion as deposito_nombre,
           suc.id as sucursal_id,
           suc.descripcion as sucursal_nombre,
           (SELECT COUNT(*) FROM inventario_auxiliar_items 
            WHERE id_inventario = inventario_auxiliar.id 
            AND cantidad_scanner IS NOT NULL) as items_escaneados
         FROM inventario_auxiliar
         INNER JOIN depositos dep ON inventario_auxiliar.deposito = dep.dep_codigo
         INNER JOIN sucursales suc ON inventario_auxiliar.sucursal = suc.id
         WHERE ${condicionEstado} ${condicionDeposito}
         ORDER BY inventario_auxiliar.fecha DESC, inventario_auxiliar.hora DESC
       `;

    try {
      const resultado = await db.sql(query);

      // Añadir información de progreso para cada inventario
      return resultado.map((inv) => {
        // Calcular el porcentaje de avance del escaneado si hay items
        const porcentajeCompletado =
          inv.total_items > 0
            ? Math.round((inv.items_escaneados / inv.total_items) * 100)
            : 0;

        return {
          ...inv,
          porcentaje_completado: porcentajeCompletado,
          estado_texto:
            inv.estado === 0
              ? "Abierto"
              : inv.autorizado === 1
              ? "Autorizado"
              : "Cerrado",
        };
      });
    } catch (error) {
      console.error("Error al obtener inventarios disponibles:", error);
      throw error;
    }
  };

  const reporteDeAnomalias = async (nro_inventario, sucursal, deposito) => {
    const query = `
          SELECT DISTINCT
            ia.id as id_inventario,
            ia.nro_inventario,
            DATE_FORMAT(ia.fecha, '%d/%m/%Y') as fecha,
            DATE_FORMAT(ia.hora, '%H:%i:%s') as hora,
            DATE_FORMAT(ia.fecha_cierre, '%d/%m/%Y') as fecha_cierre,
            DATE_FORMAT(ia.hora_cierre, '%H:%i:%s') as hora_cierre,
            ia.operador,
            op.op_nombre as operador_nombre,
            suc.descripcion as nombre_sucursal,
            dep.dep_descripcion as nombre_deposito,
            CASE
              WHEN ia.estado = 0 THEN 'En curso'
              WHEN ia.estado = 1 THEN 'Cerrado'
              ELSE 'Desconocido'
            END as estado_inventario,
            (
              SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                  'articulo_id', art.ar_codigo,
                  'articulo', art.ar_descripcion,
                  'cod_interno', art.ar_cod_interno,
                  'ubicacion', ub2.ub_descripcion,
                  'sub_ubicacion', s2.s_descripcion,
                  'cantidad_inicial_total', (
                    SELECT SUM(iai2.cantidad_inicial)
                    FROM inventario_auxiliar_items iai2
                    WHERE iai2.id_articulo = art.ar_codigo
                    AND iai2.id_inventario = ia.id
                  ),
                  'cantidad_scanner_total', (
                    SELECT SUM(COALESCE(iai2.cantidad_scanner, 0))
                    FROM inventario_auxiliar_items iai2
                    WHERE iai2.id_articulo = art.ar_codigo
                    AND iai2.id_inventario = ia.id
                  ),
                  'diferencia_total', (
                    SELECT SUM(COALESCE(iai2.cantidad_scanner, 0) - iai2.cantidad_inicial)
                    FROM inventario_auxiliar_items iai2
                    WHERE iai2.id_articulo = art.ar_codigo
                    AND iai2.id_inventario = ia.id
                  ),
                  'costo_diferencia_total', FORMAT(
                    art.ar_pcg * (
                      SELECT SUM(COALESCE(iai2.cantidad_scanner, 0) - iai2.cantidad_inicial)
                      FROM inventario_auxiliar_items iai2
                      WHERE iai2.id_articulo = art.ar_codigo
                      AND iai2.id_inventario = ia.id
                    ), 0, 'es_ES'
                  ),
                  'items_lotes', (
                    SELECT JSON_ARRAYAGG(
                      JSON_OBJECT(
                        'cod_barras', al2.al_codbarra,
                        'lote_id', iai2.id_lote,
                        'lote', iai2.lote,
                        'vencimiento', DATE_FORMAT(iai2.fecha_vencimiento, '%d/%m/%Y'),
                        'cantidad_inicial', CAST(iai2.cantidad_inicial AS SIGNED),
                        'cantidad_scanner', CAST(iai2.cantidad_scanner AS SIGNED),
                        'cantidad_actual', CAST(al2.al_cantidad AS SIGNED),
                        'diferencia', CAST(COALESCE(iai2.cantidad_scanner, 0) AS SIGNED) - CAST(iai2.cantidad_inicial AS SIGNED),
                        'costo_diferencia', FORMAT(art.ar_pcg * (CAST(COALESCE(iai2.cantidad_scanner, 0) AS SIGNED) - CAST(iai2.cantidad_inicial AS SIGNED)), 0, 'es_ES'),
                        'items_vendidos', (
                          SELECT SUM(COALESCE(deve.deve_cantidad, 0))
                          FROM detalle_ventas deve
                          INNER JOIN ventas ve ON deve.deve_venta = ve.ve_codigo
                          INNER JOIN detalle_ventas_vencimiento dve ON deve.deve_codigo = dve.id_detalle_venta
                          WHERE ve.ve_fecha >= ia.fecha 
                          AND (
                            CASE 
                              WHEN ia.fecha_cierre IS NULL THEN 
                                -- Si no hay fecha de cierre, considerar hasta la fecha actual
                                (ve.ve_fecha = ia.fecha AND ve.ve_hora >= ia.hora)
                                OR ve.ve_fecha > ia.fecha
                              ELSE 
                                -- Si hay fecha de cierre, usar la lógica original
                                ((ve.ve_fecha = ia.fecha AND ve.ve_hora >= ia.hora)
                                 OR (ve.ve_fecha = ia.fecha_cierre AND ve.ve_hora <= ia.hora_cierre)
                                 OR (ve.ve_fecha > ia.fecha AND ve.ve_fecha < ia.fecha_cierre))
                            END
                          )
                          AND ve.ve_estado = 1
                          AND deve.deve_articulo = art.ar_codigo
                          AND dve.loteid = iai2.id_lote
                        ),
                        'items_devueltos', (
                          SELECT SUM(COALESCE(ri.cantidad, 0))
                          FROM remisiones_items ri
                          INNER JOIN remisiones r ON ri.remision = r.id
                          WHERE r.fecha BETWEEN ia.fecha AND ia.fecha_cierre
                          AND r.estado = 1
                          AND ri.articulo = art.ar_codigo
                          AND ri.codlote = al2.al_codigo
                        ),
                        'items_comprados', (
                          SELECT SUM(COALESCE(dc.dc_cantidad, 0))
                          FROM detalle_compras dc
                          INNER JOIN compras c ON dc.dc_compra = c.co_codigo
                          WHERE c.co_fecha >= ia.fecha 
                          AND c.co_fecha <= ia.fecha_cierre
                          AND ((c.co_fecha = ia.fecha AND c.co_hora >= ia.hora)
                               OR (c.co_fecha = ia.fecha_cierre AND c.co_hora <= ia.hora_cierre)
                               OR (c.co_fecha > ia.fecha AND c.co_fecha < ia.fecha_cierre))
                          AND c.co_estado = 1
                          AND dc.dc_articulo = art.ar_codigo
                          AND dc.dc_lote = al2.al_lote
                        )
                      )
                    )  
                    FROM inventario_auxiliar_items iai2
                    INNER JOIN articulos_lotes al2 ON iai2.id_lote = al2.al_codigo
                    WHERE iai2.id_articulo = art.ar_codigo
                    AND iai2.id_inventario = ia.id
                    AND (
                      (iai2.cantidad_scanner IS NOT NULL AND iai2.cantidad_scanner != iai2.cantidad_inicial)
                      OR 
                      (iai2.cantidad_scanner IS NULL AND iai2.cantidad_inicial != 0)
                    )
                  )
                )
              )
              FROM (
                SELECT DISTINCT ar.ar_codigo, ar.ar_descripcion, ar.ar_cod_interno, ar.ar_pcg,
                       ar.ar_ubicacicion, ar.ar_sububicacion
                FROM inventario_auxiliar_items iai2
                INNER JOIN articulos ar ON iai2.id_articulo = ar.ar_codigo
                WHERE iai2.id_inventario = ia.id
                AND (
                  (iai2.cantidad_scanner IS NOT NULL AND iai2.cantidad_scanner != iai2.cantidad_inicial)
                  OR 
                  (iai2.cantidad_scanner IS NULL AND iai2.cantidad_inicial != 0)
                )
              ) art
              INNER JOIN ubicaciones ub2 ON art.ar_ubicacicion = ub2.ub_codigo
              INNER JOIN sub_ubicacion s2 ON art.ar_sububicacion = s2.s_codigo
            ) as items
          FROM inventario_auxiliar ia
          INNER JOIN operadores op ON ia.operador = op.op_codigo
          INNER JOIN sucursales suc ON ia.sucursal = suc.id
          INNER JOIN depositos dep ON ia.deposito = dep.dep_codigo
          WHERE ia.nro_inventario = ${nro_inventario}
          ${sucursal ? `AND ia.sucursal = ${sucursal}` : ""}
          ${deposito ? `AND ia.deposito = ${deposito}` : ""}
          AND ia.estado != 2
    `;
    console.log(query);
    const result = await db.sql(query);
    return result;
  };

  async function reporte_inventario(
  id_inventario = null,
  categorias = [],
  incluir_sin_cambios = false,
  fecha_inicio = null,
  fecha_fin = null,
  deposito = null,
) {
  try {
    // Construir condiciones de filtro
    let filtros = [];

    // Filtro por inventario específico
    if (id_inventario) {
      filtros.push(`i.id_inventario = ${id_inventario}`);
    }

    // Filtro por rango de fechas
    if (fecha_inicio && fecha_fin) {
      filtros.push(`DATE(ia.fecha) BETWEEN DATE('${fecha_inicio}') AND DATE('${fecha_fin}')`);
    } else if (fecha_inicio) {
      filtros.push(`DATE(ia.fecha) >= DATE('${fecha_inicio}')`);
    } else if (fecha_fin) {
      filtros.push(`DATE(ia.fecha) <= DATE('${fecha_fin}')`);
    }

    if(deposito) {
      filtros.push(`ia.deposito = ${deposito}`);
    }


    // Filtro por categorías específicas
    if (categorias && categorias.length > 0) {
      filtros.push(`ca.ca_codigo IN (${categorias.join(",")})`);
    } else {
      // Por defecto excluimos la categoría 1
      filtros.push(`ca.ca_codigo NOT IN (1)`);
    }

    // Construir la condición de diferencias
    if (!incluir_sin_cambios) {
      // Solo ítems con diferencias o no escaneados
      filtros.push(`
        (
          (i.cantidad_scanner IS NOT NULL AND i.cantidad_scanner != i.cantidad_inicial)
          OR
          (i.cantidad_scanner IS NULL AND i.cantidad_inicial != 0)
        )
      `);
    }

    // Combinar todos los filtros
    const whereClause = filtros.length > 0 ? `WHERE ${filtros.join(" AND ")}` : "";

    const query = `
      SELECT
        ia.id as id_inventario,
        ia.nro_inventario,
        DATE_FORMAT(ia.fecha, '%d/%m/%Y') as fecha_inventario,
        i.id_articulo,
        i.id_lote,
        ar.ar_descripcion as descripcion,
        ar.ar_cod_interno as cod_ref,
        al.al_codbarra as codigo_barra,
        al.al_lote as lote,
        DATE_FORMAT(al.al_vencimiento, '%d/%m/%Y') as vencimiento,
        CAST(i.cantidad_inicial AS SIGNED) as cantidad_inicial,
        CAST(i.cantidad_scanner AS SIGNED) as cantidad_scanner,
        CAST(al.al_cantidad AS SIGNED) as cantidad_actual,
        ca.ca_codigo as categoria_id,
        ca.ca_descripcion as categoria,
        sc.sc_codigo as subcategoria_id,
        sc.sc_descripcion as subcategoria,
        dep.dep_descripcion as deposito,
        suc.descripcion as sucursal,
        ma.ma_descripcion as marca,
        CAST(ar.ar_pcg AS DECIMAL(10,2)) as precio_compra_numero,
        CAST(ar.ar_pvg AS DECIMAL(10,2)) as precio_venta_numero,
        FORMAT(ar.ar_pcg, 0, 'es_ES') as precio_compra,
        FORMAT(ar.ar_pvg, 0, 'es_ES') as precio_venta,
        CAST(COALESCE(i.cantidad_scanner, 0) - i.cantidad_inicial AS SIGNED) as diferencia,
        CASE 
          WHEN COALESCE(i.cantidad_scanner, 0) - i.cantidad_inicial > 0 THEN 'GANANCIA'
          WHEN COALESCE(i.cantidad_scanner, 0) - i.cantidad_inicial < 0 THEN 'PERDIDA'
          ELSE 'SIN CAMBIO'
        END as tipo_diferencia,
        CAST((COALESCE(i.cantidad_scanner, 0) - i.cantidad_inicial) * ar.ar_pcg AS DECIMAL(10,2)) as valor_diferencia_numero,
        FORMAT((COALESCE(i.cantidad_scanner, 0) - i.cantidad_inicial) * ar.ar_pcg, 0, 'es_ES') as valor_diferencia
      FROM inventario_auxiliar_items i
      INNER JOIN inventario_auxiliar ia ON i.id_inventario = ia.id
      INNER JOIN articulos ar ON i.id_articulo = ar.ar_codigo
      INNER JOIN articulos_lotes al ON i.id_lote = al.al_codigo
      INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
      INNER JOIN categorias ca ON sc.sc_categoria = ca.ca_codigo
      INNER JOIN marcas ma ON ar.ar_marca = ma.ma_codigo
      INNER JOIN depositos dep ON ia.deposito = dep.dep_codigo
      INNER JOIN sucursales suc ON ia.sucursal = suc.id
      ${whereClause}
      ORDER BY ca.ca_descripcion ASC, ar.ar_descripcion ASC
    `;

    console.log("Ejecutando consulta de reporte de inventario:", query);
    const resultados = await db.sql(query);

    // Agregar estadísticas adicionales
    if (resultados.length > 0) {
      // Calcular totales
      const totalItems = resultados.length;
      const totalValorDiferencia = resultados.reduce(
        (sum, item) => sum + parseFloat(item.valor_diferencia_numero || 0),
        0
      );
      const totalGanancias = resultados.filter(
        (item) => item.tipo_diferencia === "GANANCIA"
      ).length;
      const totalPerdidas = resultados.filter(
        (item) => item.tipo_diferencia === "PERDIDA"
      ).length;
      const valorGanancias = resultados
        .filter((item) => item.tipo_diferencia === "GANANCIA")
        .reduce(
          (sum, item) => sum + parseFloat(item.valor_diferencia_numero || 0),
          0
        );
      const valorPerdidas = resultados
        .filter((item) => item.tipo_diferencia === "PERDIDA")
        .reduce(
          (sum, item) => sum + parseFloat(item.valor_diferencia_numero || 0),
          0
        );

      // Agregar resumen al resultado
      const resumen = {
        total_items: totalItems,
        total_ganancias: totalGanancias,
        total_perdidas: totalPerdidas,
        valor_ganancias: valorGanancias,
        valor_perdidas: valorPerdidas,
        valor_diferencia_neto: totalValorDiferencia,
        valor_ganancias_formato: formatearNumero(valorGanancias),
        valor_perdidas_formato: formatearNumero(Math.abs(valorPerdidas)),
        valor_diferencia_neto_formato: formatearNumero(totalValorDiferencia),
      };

      return {
        resumen,
        items: resultados,
      };
    }

    return {
      resumen: {
        total_items: 0,
        total_ganancias: 0,
        total_perdidas: 0,
        valor_ganancias: 0,
        valor_perdidas: 0,
        valor_diferencia_neto: 0,
        valor_ganancias_formato: "0",
        valor_perdidas_formato: "0",
        valor_diferencia_neto_formato: "0",
      },
      items: [],
    };
  } catch (error) {
    console.error("Error al generar reporte de inventario:", error);
    throw error;
  }
}

  // Función auxiliar para formatear números
  function formatearNumero(numero) {
    return new Intl.NumberFormat("es-ES").format(Math.round(numero));
  }

  async function actualizar_cantidad_inicial(
    id_inventario,
    id_articulo,
    id_lote,
    cantidad
  ) {
    try {
      // Validar que la cantidad sea un número válido
      if (cantidad === undefined || cantidad === null || isNaN(cantidad)) {
        return {
          error: true,
          mensaje: "La cantidad inicial debe ser un número válido",
        };
      }

      // Iniciar transacción
      await db.sql("START TRANSACTION");

      // Verificar que el inventario existe y no está cerrado o autorizado
      const inventarioResult = await db.sql(`
      SELECT estado, autorizado 
      FROM inventario_auxiliar 
      WHERE id = ${id_inventario}
    `);

      if (inventarioResult.length === 0) {
        await db.sql("ROLLBACK");
        return {
          error: true,
          mensaje: "El inventario no existe",
        };
      }

      // if (
      //   inventarioResult[0].estado > 0 ||
      //   inventarioResult[0].autorizado === 1
      // ) {
      //   await db.sql("ROLLBACK");
      //   return {
      //     error: true,
      //     mensaje: "No se puede modificar un inventario cerrado o autorizado",
      //   };
      // }

      // Actualizar solo la cantidad inicial
      const updateQuery = `
      UPDATE inventario_auxiliar_items 
      SET cantidad_inicial = ${cantidad}
      WHERE id_inventario = ${id_inventario}
      AND id_articulo = ${id_articulo}
      AND id_lote = ${id_lote}
    `;
      console.log("updateQuery", updateQuery);

      const resultado = await db.sql(updateQuery);

      // Verificar si se actualizó algún registro
      if (resultado.affectedRows === 0) {
        await db.sql("ROLLBACK");
        return {
          error: true,
          mensaje: "No se encontró el ítem especificado en el inventario",
        };
      }

      // Confirmar transacción
      await db.sql("COMMIT");

      return {
        error: false,
        mensaje: "Cantidad inicial actualizada correctamente",
        filas_afectadas: resultado.affectedRows,
      };
    } catch (error) {
      // Revertir en caso de error
      try {
        await db.sql("ROLLBACK");
      } catch (e) {
        console.error("Error en rollback:", e);
      }

      console.error("Error al actualizar cantidad inicial:", error);
      return {
        error: true,
        mensaje: `Error al actualizar cantidad inicial: ${error.message}`,
      };
    }
  }

  async function anular_inventario(id) {
    try {
      // Iniciar transacción
      await db.sql("START TRANSACTION");

      // Verificar que el inventario existe y no está autorizado
      const inventarioResult = await db.sql(`
      SELECT id, estado, autorizado 
      FROM inventario_auxiliar 
      WHERE id = ${id}
    `);

      if (inventarioResult.length === 0) {
        await db.sql("ROLLBACK");
        return {
          error: true,
          mensaje: "El inventario no existe",
        };
      }

      if (inventarioResult[0].autorizado === 1) {
        await db.sql("ROLLBACK");
        return {
          error: true,
          mensaje: "No se puede anular un inventario que ya fue autorizado",
        };
      }

      if (inventarioResult[0].estado === 2) {
        await db.sql("ROLLBACK");
        return {
          error: true,
          mensaje: "El inventario ya está anulado",
        };
      }

      // Actualizar estado del inventario a anulado (2)
      await db.sql(`
      UPDATE inventario_auxiliar 
      SET estado = 2
      WHERE id = ${id}
    `);

      // Confirmar transacción
      await db.sql("COMMIT");

      return {
        error: false,
        mensaje: "Inventario anulado exitosamente",
      };
    } catch (error) {
      // Revertir en caso de error
      try {
        await db.sql("ROLLBACK");
      } catch (e) {
        console.error("Error en rollback:", e);
      }

      console.error("Error al anular inventario:", error);
      return {
        error: true,
        mensaje: `Error al anular inventario: ${error.message}`,
      };
    }
  }



  return {
    crear_inventario, // listo
    get_inventario, //listo
    get_inventarios, //listo
    insertar_items_inventario, //listo
    scannear_item_inventario, // listo
    cerrar_inventario, //listo
    autorizar_inventario, // listo
    get_items_a_escanear, // listo
    get_items_inventario, //listo
    inventariosDisponibles, // listo
    reporte_inventario, //
    reporteDeAnomalias, // listo
    actualizar_cantidad_inicial, // 
    anular_inventario, //listo
  };
};
