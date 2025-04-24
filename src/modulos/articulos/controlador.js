const TABLA =
  "articulos_lotes al INNER JOIN articulos a ON al.al_articulo = a.ar_codigo INNER JOIN depositos de ON al.al_deposito = de.dep_codigo INNER JOIN unidadmedidas um ON a.ar_unidadmedida = um.um_codigo INNER JOIN marcas ma ON a.ar_marca = ma.ma_codigo LEFT JOIN subcategorias sc ON a.ar_subcategoria= sc.sc_codigo LEFT JOIN articulos_proveedores ap ON a.ar_codigo = ap.arprove_articulo LEFT JOIN proveedores p ON ap.arprove_codigo = p.pro_codigo LEFT JOIN ubicaciones ub ON a.ar_ubicacicion = ub.ub_codigo";

/*const auth = require('../../auth/index');*/

module.exports = function (dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require("../../DB/mysql.js");
  }
  const buscarArticulos = async (
    articulo_id,
    busqueda,
    codigo_barra,
    moneda = 1,
    stock,
    deposito,
    marca,
    categoria,
    ubicacion,
    proveedor,
    cod_interno,
    lote,
    negativo,
  ) => {
    console.log("articulo_id", articulo_id);
    console.log("codigo_barra", codigo_barra);
    console.log("busqueda", busqueda);
    console.log("moneda", moneda);
    console.log("stock", stock);
    console.log("deposito", deposito);
    console.log("marca", marca);
    console.log("categoria", categoria);
    console.log("ubicacion", ubicacion);
    console.log("proveedor", proveedor);
    console.log("cod_interno", cod_interno);
    console.log("lote", lote);
    console.log("negativo", negativo);
    let where = "";
    let moneda_query = `
         ar.ar_pcg as precio_costo,
         ar.ar_pvg as precio_venta_guaranies,
         ar.ar_pvcredito as precio_credito,
         ar.ar_pvmostrador as precio_mostrador,
         ar.ar_precio_4 as precio_4,
         ar.ar_pcd as precio_costo_dolar,
         ar.ar_pvd as precio_venta_dolar,
         ar.ar_pcp as precio_costo_pesos,
         ar.ar_pvp as precio_venta_pesos,
         ar.ar_pcr as precio_costo_real,
         ar.ar_pvr as precio_venta_real,
      `;

    if (articulo_id) {
      where += ` AND ar.ar_codigo = '${articulo_id}'`;
    } else {
      if (codigo_barra) {
        where += ` AND ar.ar_codbarra = '${codigo_barra}'`;
      } else if (busqueda) {
        const palabras = busqueda.split(" ").filter((p) => p.length > 0);
        
        // Si hay filtros específicos, solo buscar en esos campos
        if (marca || categoria || ubicacion || proveedor || cod_interno || lote) {
          let condicionesFiltros = [];
          
          if (marca) {
            condicionesFiltros.push(`ma.ma_descripcion LIKE '%${busqueda}%'`);
          }
          if (categoria) {
            condicionesFiltros.push(`ca.ca_descripcion LIKE '%${busqueda}%'`);
          }
          if (ubicacion) {
            condicionesFiltros.push(`ub.ub_descripcion LIKE '%${busqueda}%'`);
          }
          if (proveedor) {
            condicionesFiltros.push(`p.pro_razon LIKE '%${busqueda}%'`);
          }
          if (cod_interno) {
            condicionesFiltros.push(`ar.ar_cod_interno LIKE '%${busqueda}%'`);
          }
          if (lote) {
            condicionesFiltros.push(`al.al_lote LIKE '%${busqueda}%'`);
          }
          where += ` AND (${condicionesFiltros.join(" OR ")})`;
        } else {
          // Si no hay filtros específicos, mantener la búsqueda general
          const condiciones = palabras.map(
            (palabra) =>
              `(ar.ar_descripcion LIKE '%${palabra}%' OR ar.ar_codbarra = '${palabra}' OR al.al_lote = '${palabra}' OR al.al_codigo = '${palabra}' )`
          );
          where += ` AND (${condiciones.join(" AND ")})`;
        }
      }
    }
    if (deposito) {
      where += `
        AND al.al_deposito = ${deposito}
      `;
    }

    if (negativo === true || negativo === "true") {
      where += `
        AND (al.al_cantidad < 0)
      `;
    } else if (stock === true || stock === "true") {
      where += `
        AND (al.al_cantidad > 0)
      `;
    }

    const query = `
      SELECT
         al.al_codigo as id_lote,
         al.al_lote as lote,
         ar.ar_codigo as id_articulo,
         ar.ar_codbarra as codigo_barra,
         ar.ar_descripcion as descripcion,
         ar.ar_stockneg as stock_negativo,
         ${moneda_query}
         DATE_FORMAT(al.al_vencimiento, '%d/%m/%Y') as vencimiento_lote,
         al.al_cantidad as cantidad_lote,
         al.al_deposito as deposito,
         ub.ub_descripcion as ubicacion,
         s.s_descripcion as sub_ubicacion,
         ma.ma_descripcion as marca,
         sc.sc_descripcion as subcategoria,
         ca.ca_descripcion as categoria,
         ar.ar_iva as iva,
         ar.ar_vencimiento as vencimiento_validacion,
         iva.iva_descripcion as iva_descripcion,
         ar.ar_editar_desc as editar_nombre,
         CASE
           WHEN MIN(DATEDIFF(al.al_vencimiento, CURDATE())) < 0 THEN 'VENCIDO'
           WHEN MIN(DATEDIFF(al.al_vencimiento, CURDATE())) <= 120 THEN 'PROXIMO'
           ELSE 'VIGENTE'
         END as estado_vencimiento,
         (
           SELECT GROUP_CONCAT(DISTINCT p.pro_razon SEPARATOR ', ')
           FROM articulos_proveedores ap 
           INNER JOIN proveedores p ON ap.arprove_prove = p.pro_codigo
           WHERE ap.arprove_articulo = ar.ar_codigo
         ) as proveedor,
         (
          SELECT DATE_FORMAT(ve.ve_fecha, '%d/%m/%Y')
          FROM ventas ve
          INNER JOIN detalle_ventas dv ON ve.ve_codigo = dv.deve_venta
          WHERE dv.deve_articulo = ar.ar_codigo
          ORDER BY ve.ve_fecha DESC
          LIMIT 1
         ) as fecha_ultima_venta,
          al.al_pre_compra as precompra
      FROM articulos_lotes al
      INNER JOIN articulos ar ON al.al_articulo = ar.ar_codigo
      INNER JOIN depositos de ON al.al_deposito = de.dep_codigo
      INNER JOIN ubicaciones ub ON ar.ar_ubicacicion = ub.ub_codigo
      INNER JOIN sub_ubicacion s ON ar.ar_sububicacion = s.s_codigo
      INNER JOIN marcas ma ON ar.ar_marca = ma.ma_codigo
      INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
      INNER JOIN categorias ca ON sc.sc_categoria = ca.ca_codigo
      INNER JOIN iva ON ar.ar_iva = iva.iva_codigo
      LEFT JOIN articulos_proveedores ap ON ar.ar_codigo = ap.arprove_articulo
      LEFT JOIN proveedores p ON ap.arprove_prove = p.pro_codigo
      WHERE ar.ar_estado = 1
      ${where}
      GROUP BY
          al.al_codigo
      ORDER BY ar.ar_descripcion
      LIMIT 25
    `;

    console.log(query);
    return await db.sql(query);
  };

  const consultaArticulosSimplificado = async (
    articulo_id,
    busqueda,
    codigo_barra,
    moneda = 1,
    stock,
    deposito,
    marca,
    categoria,
    ubicacion,
    proveedor,
    cod_interno

  ) => {
    console.log("articulo_id", articulo_id);
    console.log("codigo_barra", codigo_barra);
    console.log("busqueda", busqueda);
    console.log("moneda", moneda);
    console.log("stock", stock);
    console.log("deposito", deposito);
    let where = "";
    let moneda_query = "";

    if (articulo_id) {
      where += ` AND ar.ar_codigo = '${articulo_id}'`;
    } else {
      if (codigo_barra) {
        where += ` AND ar.ar_codbarra = '${codigo_barra}'`;
      } else if (busqueda) {
        const palabras = busqueda.split(" ").filter((p) => p.length > 0);
        const condiciones = palabras.map(
          (palabra) =>
            `(ar.ar_descripcion LIKE '%${palabra}%' OR ar.ar_codbarra = '${palabra}' OR al.al_lote = '${palabra}' OR al.al_codigo = '${palabra}' )`
        );
        where += ` AND (${condiciones.join(" AND ")})`;
      }
    }

    if (moneda == 1 || moneda == "1" || moneda == null || moneda == undefined) {
      moneda_query = `
         ar.ar_pcg as precio_costo,
         ar.ar_pvg as precio_venta,
         ar.ar_pvcredito as precio_credito,
         ar.ar_pvmostrador as precio_mostrador,
         ar.ar_precio_4 as precio_4,
      `;
    } else if (moneda === 2 || moneda === "2") {
      moneda_query = `
        ar.ar_pcd as precio_costo,
        ar.ar_pvd as precio_venta,
      `;
    } else if (moneda === 3 || moneda === "3") {
      moneda_query = `
        ar.ar_pcr as precio_costo,
        ar.ar_pvr as precio_venta,
      `;
    } else if (moneda === 4 || moneda === "4") {
      moneda_query = `
        ar.ar_pcp as precio_costo,
        ar.ar_pvp as precio_venta,
      `;
    }
    if (deposito) {
      where += `
        AND al.al_deposito = ${deposito}
      `;
    }
    if (stock == true || stock == "true") {
      where += `
        AND al.al_cantidad > 0
      `;
    }

    if(marca && busqueda){
      where += `
        AND ma.ma_descripcion LIKE '%${busqueda}%'
      `;
    }

    if(categoria && busqueda){
      where += `
        AND ca.ca_descripcion LIKE '%${busqueda}%'
      `;
    }

    if(ubicacion && busqueda){
      where += `
        AND ub.ub_descripcion LIKE '%${busqueda}%'
      `;
    }

    if(proveedor && busqueda){
      where += `
        AND p.pro_razon LIKE '%${busqueda}%'
      `;
    } 

    if(cod_interno && busqueda){
      where += `
        AND ar.ar_cod_interno LIKE '%${busqueda}%'
      `;
    }
    
    
    const query = `
      SELECT
         ar.ar_codigo as id_articulo,
         ar.ar_codbarra as codigo_barra,
         ar.ar_descripcion as descripcion,
         ar.ar_stockneg as stock_negativo,
         CAST(COALESCE(SUM(al.al_cantidad), 0) AS SIGNED) as stock,
         ${moneda_query}
         ub.ub_descripcion as ubicacion,
         s.s_descripcion as sub_ubicacion,
         ma.ma_descripcion as marca,
         sc.sc_descripcion as subcategoria,
         ca.ca_descripcion as categoria,
         ar.ar_iva as iva,
         ar.ar_vencimiento as vencimiento_validacion,
         iva.iva_descripcion as iva_descripcion,
         ar.ar_editar_desc as editar_nombre,
         (
          SELECT 
            CASE
              WHEN MIN(DATEDIFF(al2.al_vencimiento, CURDATE())) < 0 THEN 'VENCIDO'
              WHEN MIN(DATEDIFF(al2.al_vencimiento, CURDATE())) <= 120 THEN 'PROXIMO'
              ELSE 'VIGENTE'
            END
          FROM articulos_lotes al2
          WHERE al2.al_articulo = ar.ar_codigo 
          AND al2.al_cantidad > 0
          AND al2.al_vencimiento != '0001-01-01'
         ) as estado_vencimiento,
         (
          SELECT DATE_FORMAT(ve.ve_fecha, '%d/%m/%Y')
          FROM ventas ve
          INNER JOIN detalle_ventas dv ON ve.ve_codigo = dv.deve_venta
          WHERE dv.deve_articulo = ar.ar_codigo
          ORDER BY ve.ve_fecha DESC
          LIMIT 1
         ) as fecha_ultima_venta,
         (
           SELECT GROUP_CONCAT(DISTINCT p.pro_razon SEPARATOR ', ')
           FROM articulos_proveedores ap 
           INNER JOIN proveedores p ON ap.arprove_prove = p.pro_codigo
           WHERE ap.arprove_articulo = ar.ar_codigo
         ) as proveedor,
        (
          SELECT JSON_ARRAYAGG(t.lote_info)
          FROM (
            SELECT 
              JSON_OBJECT(
                'id', al_codigo,
                'lote', al_lote,
                'cantidad', CAST(al_cantidad AS SIGNED),
                'vencimiento', DATE_FORMAT(al_vencimiento, '%d/%m/%Y'),
                'deposito', al_deposito
              ) as lote_info
            FROM articulos_lotes 
            WHERE al_articulo = ar.ar_codigo
          ) t
        ) as lotes,
        (
          SELECT JSON_ARRAYAGG(t.deposito_info)
          FROM (
            SELECT 
              JSON_OBJECT(
                'codigo', dep.dep_codigo,
                'descripcion', dep.dep_descripcion,
                'stock', CAST(SUM(al2.al_cantidad) AS SIGNED)
              ) as deposito_info
            FROM articulos_lotes al2
            INNER JOIN depositos dep ON al2.al_deposito = dep.dep_codigo
            WHERE al2.al_articulo = ar.ar_codigo
            GROUP BY dep.dep_codigo, dep.dep_descripcion
          ) t
        ) as depositos
      FROM articulos ar
      INNER JOIN ubicaciones ub ON ar.ar_ubicacicion = ub.ub_codigo
      INNER JOIN sub_ubicacion s ON ar.ar_sububicacion = s.s_codigo
      INNER JOIN marcas ma ON ar.ar_marca = ma.ma_codigo
      INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
      INNER JOIN categorias ca ON sc.sc_categoria = ca.ca_codigo
      INNER JOIN iva ON ar.ar_iva = iva.iva_codigo
      LEFT JOIN articulos_lotes al ON ar.ar_codigo = al.al_articulo
      WHERE ar.ar_estado = 1
      ${where}
      GROUP BY
          ar.ar_codigo
      ORDER BY ar.ar_descripcion
      LIMIT 50
    `;
    return await db.sql(query);
  };

  const reporteDeAnomalias = async (nro_inventario, sucursal, deposito) => {
    const query = `
          SELECT DISTINCT
            ia.id as id_inventario,
            ia.nro_inventario,
            DATE_FORMAT(ia.fecha, '%d/%m/%Y') as fecha,
            DATE_FORMAT(ia.hora, '%H:%i:%s') as hora,
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
                        'diferencia', CAST(COALESCE(iai2.cantidad_scanner, 0) AS SIGNED) - CAST(iai2.cantidad_inicial AS SIGNED),
                        'costo_diferencia', FORMAT(art.ar_pcg * (CAST(COALESCE(iai2.cantidad_scanner, 0) AS SIGNED) - CAST(iai2.cantidad_inicial AS SIGNED)), 0, 'es_ES')
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
    `;
    console.log(query);
    const result = await db.sql(query);
    return result;
  };

  const scannearItemInventarioAuxiliar = async (
    id_articulo,
    id_lote,
    cantidad,
    lote = "",
    codigo_barras = "",
    id_inventario
  ) => {
    try {
      console.log("Datos recibidos:", {
        id_articulo,
        id_lote,
        cantidad,
        lote,
        codigo_barras,
        id_inventario
      });

      // Si hay código de barras y no está vacío
      if (codigo_barras && codigo_barras.trim().length > 0) {
        const queryCodigos = `UPDATE articulos_lotes SET al_codbarra = '${codigo_barras}' WHERE al_codigo = ${id_lote}`;
        console.log("Query códigos:", queryCodigos);
        await db.sql(queryCodigos);
        const queryCodigos2 = `UPDATE articulos ar SET ar_codbarra = '${codigo_barras}' WHERE ar_codigo = ${id_articulo}`;
        console.log("Query códigos:", queryCodigos2);
        await db.sql(queryCodigos2); // solo para gaesa y compañia
      }

      if (lote && lote.trim().length > 0) {
        const queryCodigos = `UPDATE articulos_lotes SET al_lote = '${lote}' WHERE al_codigo = ${id_lote}`;
        console.log("Query códigos:", queryCodigos);
        await db.sql(queryCodigos);
      }

      // Actualizar cantidad scanner
      const queryScanner = `UPDATE inventario_auxiliar_items 
        SET cantidad_scanner = ${cantidad || null} 
        WHERE id_articulo = ${id_articulo} AND id_lote = ${id_lote} AND id_inventario = ${id_inventario}`;

      console.log("Query scanner:", queryScanner);
      return await db.sql(queryScanner);
    } catch (error) {
      console.error("Error en scannearItemInventarioAuxiliar:", error);
      throw error;
    }
  };

  const mostrarItemsDelInventarioAuxiliar = async (id, id_inventario, buscar, deposito) => {
    let where = "";
    if (buscar) {
      const palabras = buscar.split(" ").filter((p) => p.length > 0);
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
    id_articulo as ar_codigo,
    ar.ar_cod_interno as cod_interno,
    id_lote as al_codigo,
    ar.ar_descripcion,
    DATE_FORMAT(fecha_vencimiento, '%d/%m/%Y') as al_vencimiento,
    ar.ar_ubicacicion,
    ar.ar_vencimiento,
    ar.ar_sububicacion,
    al.al_lote,
    al.al_talle,
    al.al_color,
    ar.ar_codbarra,
    inventario_auxiliar_items.cantidad_scanner as cantidad_scanner
    FROM inventario_auxiliar_items
    INNER JOIN articulos ar ON inventario_auxiliar_items.id_articulo = ar.ar_codigo
    INNER JOIN articulos_lotes al ON inventario_auxiliar_items.id_lote = al.al_codigo
    INNER JOIN inventario_auxiliar ia ON inventario_auxiliar_items.id_inventario = ia.id
    WHERE ia.nro_inventario = ${id}
    AND inventario_auxiliar_items.cantidad_scanner IS NULL
    ${where}
    ORDER BY ar.ar_descripcion
    LIMIT 20`;
    console.log(query);
    const result = await db.sql(query);
    return result;
  };

  const mostrarItemsDelInventarioAuxiliarPrincipal = async (
    id,
    scanneado = false,
    deposito,
    sucursal,
    buscar,
    id_inventario
  ) => {
    console.log(scanneado);
    let scanneado_query = "";
    let scanneado_query_stock =
      "CAST(inventario_auxiliar_items.cantidad_inicial AS SIGNED) as stock";
    if (scanneado === true || scanneado === "true") {
      scanneado_query = `AND inventario_auxiliar_items.cantidad_scanner IS NOT NULL`;
      scanneado_query_stock = `CAST(inventario_auxiliar_items.cantidad_scanner AS SIGNED) as stock`;
    }
    let where = "";
    if (buscar) {
      const palabras = buscar.split(" ").filter((p) => p.length > 0);
      const condiciones = palabras.map(
        (palabra) =>
          `(ar.ar_descripcion LIKE '%${palabra}%' OR al.al_codbarra = '${palabra}' OR al.al_lote = '${palabra}' OR al.al_codigo = '${palabra}' OR ar.ar_cod_interno = '${palabra}')`
      );
      where += ` AND (${condiciones.join(" AND ")})`;
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
    DATE_FORMAT(fecha_vencimiento, '%d/%m/%Y') as vencimiento,
    ub.ub_descripcion as ubicacion,
    s.s_descripcion as sub_ubicacion,
    al.al_lote as lote,
    al.al_codbarra as codigo_barra,
    ${scanneado_query_stock},
    inventario_auxiliar_items.cantidad_inicial,
    CAST(al.al_cantidad AS SIGNED) as cantidad_actual
  FROM inventario_auxiliar_items
  INNER JOIN articulos ar ON inventario_auxiliar_items.id_articulo = ar.ar_codigo
  INNER JOIN articulos_lotes al ON inventario_auxiliar_items.id_lote = al.al_codigo
  INNER JOIN inventario_auxiliar ia ON inventario_auxiliar_items.id_inventario = ia.id
  INNER JOIN ubicaciones ub ON ar.ar_ubicacicion = ub.ub_codigo
  INNER JOIN sub_ubicacion s ON ar.ar_sububicacion = s.s_codigo
  WHERE ia.nro_inventario = ${id}
  ${where}
  ${scanneado_query}
  ORDER BY ar.ar_descripcion
  `;
    console.log(query);
    const result = await db.sql(query);
    return result;
  };

  async function cerrarInventarioAuxiliar(
    id,
    operador,
    sucursal,
    deposito,
    nro_inventario,
    autorizado
  ) {
    try {
      console.log(id, operador, sucursal, deposito, nro_inventario, autorizado);
      // Iniciar transacción
      await db.sql("START TRANSACTION");

      // Actualizar estado del inventario
      const updateInventarioQuery = `UPDATE inventario_auxiliar SET estado = 1 WHERE id = ${id}`;
      await db.sql(updateInventarioQuery);

      console.log("actualizando inventario_auxiliar", updateInventarioQuery);

      // Actualizar cantidades en articulos_lotes basado en el escaneo
      if (autorizado == true || autorizado == "true") {
        const updateLotesQuery = `
          UPDATE articulos_lotes al
          INNER JOIN inventario_auxiliar_items iai ON al.al_codigo = iai.id_lote
          INNER JOIN articulos ar ON al.al_articulo = ar.ar_codigo
          INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
          SET al.al_cantidad = CASE 
              WHEN iai.cantidad_scanner IS NULL AND al.al_cantidad != 0 THEN 0
              ELSE iai.cantidad_scanner
          END
          WHERE iai.id_inventario = ${parseInt(id)}
          AND al.al_cantidad != 0`;

        await db.sql(updateLotesQuery);

        console.log("actualizando articulos_lotes", updateLotesQuery);

        const agregarRegistroInventarioQuery = `
       INSERT INTO inventarios (fecha, hora, operador, sucursal, deposito, tipo, estado, in_obs, nro_inventario)
       VALUES (NOW(), TIME_FORMAT(NOW(), '%H:%i'), ${operador}, ${sucursal}, ${deposito}, 2, 1, 'Registro de inventario auxiliar', ${nro_inventario})
     `;

        await db.sql(agregarRegistroInventarioQuery);

        const autorizarInventarioAuxiliarQuery = `UPDATE inventario_auxiliar SET autorizado = 1 WHERE id = ${id}`;
        await db.sql(autorizarInventarioAuxiliarQuery);

        console.log(
          "agregando registro inventarios",
          agregarRegistroInventarioQuery
        );
      }

      await db.sql("COMMIT");
      return true;
    } catch (error) {
      await db.sql("ROLLBACK");
      console.error("Error al cerrar inventario auxiliar:", error);
      throw error;
    }
  }

  async function ultimoInventarioAuxiliar(deposito, sucursal, nro_inventario) {
    console.log("ultimoInventarioAuxiliar", deposito, sucursal, nro_inventario);
    let deposito_query = "";

    if (sucursal) {
      deposito_query = `AND sucursal = ${sucursal}
`;
    }
    if (nro_inventario) {
      deposito_query += ` AND nro_inventario = ${nro_inventario}`;
    }
    const query = `SELECT
      id,
      nro_inventario,
      estado,
      (
          SELECT JSON_ARRAYAGG(id_categoria)
          FROM (
            SELECT DISTINCT
              ca.ca_codigo as id_categoria
            FROM inventario_auxiliar_items iai
            INNER JOIN articulos ar ON iai.id_articulo = ar.ar_codigo
            INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
            INNER JOIN categorias ca ON sc.sc_categoria = ca.ca_codigo
            WHERE iai.id_inventario = (SELECT id FROM inventario_auxiliar ORDER BY id DESC LIMIT 1)
            GROUP BY ca.ca_codigo
            ORDER BY ca.ca_descripcion
          ) t
        ) as categorias,
         (
          SELECT JSON_ARRAYAGG(id_marca)
          FROM (
            SELECT DISTINCT
              ma.ma_codigo as id_marca
            FROM inventario_auxiliar_items iai
            INNER JOIN articulos ar ON iai.id_articulo = ar.ar_codigo
            INNER JOIN marcas ma ON ar.ar_marca = ma.ma_codigo
            WHERE iai.id_inventario = (SELECT id FROM inventario_auxiliar ORDER BY id DESC LIMIT 1)
            GROUP BY ma.ma_codigo
            ORDER BY ma.ma_descripcion
          ) t
        ) as marcas,
         (
          SELECT JSON_ARRAYAGG(id_seccion)
          FROM (
            SELECT DISTINCT
              s.s_codigo as id_seccion
            FROM inventario_auxiliar_items iai
            INNER JOIN articulos ar ON iai.id_articulo = ar.ar_codigo
            INNER JOIN secciones s ON ar.ar_seccion = s.s_codigo
            WHERE iai.id_inventario = (SELECT id FROM inventario_auxiliar ORDER BY id DESC LIMIT 1)
            GROUP BY s.s_codigo
            ORDER BY s.s_descripcion
          ) t
        ) as secciones
    FROM inventario_auxiliar WHERE estado != 2 
    AND deposito = ${deposito}
    ${deposito_query}
    ORDER BY id DESC LIMIT 1`;
    console.log(query);
    console.log(await db.sql(query));
    const result = await db.sql(query);
    return result[0];
  }

  async function insertarInventarioAuxiliar(inventario) {
    try {
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

  async function insertarInventarioAuxiliarItems(
    inventario_items,
    inventario_id
  ) {
    try {
      console.log("insertando inventario auxiliar items");
      // Iniciar transacción
      await db.sql("START TRANSACTION");

      // Verificar existencia de artículos en un solo query
      const todosLosArticulos = inventario_items
        .map((item) => `(${item.id_articulo}, ${item.id_lote})`)
        .join(",");

      const existenArticulos = await db.sql(`
        SELECT id_articulo, id_lote 
        FROM inventario_auxiliar_items 
        WHERE id_inventario = ${inventario_id}
        AND (id_articulo, id_lote) IN (${todosLosArticulos})
      `);

      if (existenArticulos.length > 0) {
        await db.sql("ROLLBACK");
        console.log("Artículos ya existen:", existenArticulos);
        return {
          error: true,
          mensaje: "Algunos artículos ya existen en el inventario auxiliar",
          articulos_existentes: existenArticulos,
        };
      }

      // Preparar todos los valores para inserción en lote
      const BATCH_SIZE = 500;
      for (let i = 0; i < inventario_items.length; i += BATCH_SIZE) {
        const batch = inventario_items.slice(i, i + BATCH_SIZE);

        const values = batch
          .map((item) => {
            const [dia, mes, anio] = item.fecha_vencimiento.split("/");
            const fechaFormateada = `${anio}-${mes}-${dia}`;

            return `(${item.id_articulo}, ${item.id_lote}, ${inventario_id}, '${item.lote}', '${fechaFormateada}', ${item.cantidad_inicial})`;
          })
          .join(",");

        const batchQuery = `
          INSERT INTO inventario_auxiliar_items 
          (id_articulo, id_lote, id_inventario, lote, fecha_vencimiento, cantidad_inicial)
          VALUES ${values}`;

        console.log(`Insertando lote de ${batch.length} items`);
        console.log(batchQuery);
        await db.sql(batchQuery);
      }

      // Confirmar transacción
      await db.sql("COMMIT");

      return {
        error: false,
        mensaje: "Items insertados correctamente",
      };
    } catch (error) {
      // Revertir transacción en caso de error
      await db.sql("ROLLBACK");
      console.error("Error al insertar inventario auxiliar items:", error);
      throw error;
    }
  }

  async function insertarConteoScanner(cantidad, id_articulo, id_lote, id_inventario) {
    const query = `
    UPDATE inventario_auxiliar_items
    SET cantidad_scanner = ${cantidad}
    WHERE id_articulo = ${id_articulo} AND id_lote = ${id_lote}
     AND id_inventario = ${id_inventario}
    `;
    console.log("Query para insertar conteo scanner:", query);
    return db.sql(query);
  }

  async function itemTomaInventarioScanner(
    deposito_id,
    articulo_id,
    ubicacion,
    sub_ubicacion,
    categorias
  ) {
    let where = `WHERE 1=1`;

    if (deposito_id) where += ` AND al.al_deposito = ${deposito_id}`;
    if (articulo_id) where += ` AND al.al_articulo = ${articulo_id}`;
    if (ubicacion) where += ` AND ar.ar_ubicacicion = ${ubicacion}`;
    if (sub_ubicacion) where += ` AND ar.ar_sububicacion = ${sub_ubicacion}`;
    if (categorias) where += ` AND ca.ca_codigo IN (${categorias})`;

    const query = `
    SELECT
    ub.ub_descripcion as ubicacion,
    s.s_descripcion as sub_ubicacion,
    ar.ar_codbarra as codigo_barra,
    ar.ar_codigo as articulo_id,
    ar.ar_descripcion as descripcion,
    DATE_FORMAT(al.al_vencimiento, '%d/%m/%Y') as vencimiento,
    al.al_codigo as lote_id,
    al.al_lote as lote,
    ii.cantidad as stock
    FROM articulos_lotes al
    INNER JOIN articulos ar ON al.al_articulo = ar.ar_codigo
    INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
    INNER JOIN categorias ca ON sc.sc_categoria = ca.ca_codigo
    INNER JOIN ubicaciones ub ON ar.ar_ubicacicion = ub.ub_codigo
    INNER JOIN sub_ubicacion s ON ar.ar_sububicacion = s.s_codigo
    LEFT JOIN inventario_items_vencimiento iii ON al.al_codigo = iii.loteid 
    LEFT JOIN inventarios_items ii ON iii.i_inventario_item = ii.id
    ${where}
    AND ar.ar_estado = 1
    AND ii.scanner = 1
    `;
    console.log(query);
    return db.sql(query);
  }

  async function itemTomaInventario(
    deposito_id,
    articulo_id,
    ubicacion,
    sub_ubicacion,
    categorias,
    marcas,
    secciones
  ) {
    let where = `WHERE 1=1`;

    if (deposito_id) where += ` AND al.al_deposito = ${deposito_id}`;
    if (articulo_id) where += ` AND al.al_codigo = ${articulo_id}`;
    if (ubicacion) where += ` AND ar.ar_ubicacicion = ${ubicacion}`;
    if (sub_ubicacion) where += ` AND ar.ar_sububicacion = ${sub_ubicacion}`;
    if (categorias) where += ` AND ca.ca_codigo IN (${categorias})`;
    if (marcas) where += ` AND ar.ar_marca IN (${marcas})`;
    if (secciones) where += ` AND ar.ar_seccion IN (${secciones})`;

    const query = `
    SELECT
    ub.ub_descripcion as ubicacion,
    s.s_descripcion as sub_ubicacion,
    ar.ar_codbarra as codigo_barra,
    ar.ar_codigo as articulo_id,
    ar.ar_descripcion as descripcion,
    DATE_FORMAT(al.al_vencimiento, '%d/%m/%Y') as vencimiento,
    al.al_codigo as lote_id,
    al.al_lote as lote,
    CAST(al.al_cantidad AS SIGNED) as stock
    FROM articulos_lotes al
    INNER JOIN articulos ar ON al.al_articulo = ar.ar_codigo
    INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
    INNER JOIN categorias ca ON sc.sc_categoria = ca.ca_codigo
    INNER JOIN ubicaciones ub ON ar.ar_ubicacicion = ub.ub_codigo
    INNER JOIN sub_ubicacion s ON ar.ar_sububicacion = s.s_codigo
    ${where}
    AND ar.ar_estado = 1
    `;
    console.log(query);
    return db.sql(query);
  }

  async function todosNuevo(
    busqueda,
    deposito,
    stock,
    marca,
    categoria,
    subcategoria,
    proveedor,
    ubicacion,
    servicio,
    moneda,
    unidadMedida,
    pagina = 1,
    limite = 50,
    tipoValorizacionCosto
  ) {
    try {
      pagina = parseInt(pagina) || 1;
      limite = parseInt(limite) || 50;

      console.log(
        "Página:",
        pagina,
        "Límite:",
        limite,
        "Offset calculado:",
        (pagina - 1) * limite
      );

      let where = "WHERE 1=1";
      let ultimocostocompra = "";
      if (busqueda) {
        const palabras = busqueda.split(" ").filter((p) => p.length > 0);
        const condiciones = palabras.map(
          (palabra) => `ar.ar_descripcion LIKE '%${palabra}%' OR ar.ar_cod_interno LIKE '%${palabra}%' OR al.al_lote LIKE '%${palabra}%' OR ar.ar_codbarra LIKE '%${palabra}%'`
        );
        where += ` AND (${condiciones.join(" AND ")})`;
      }
      if (deposito) where += ` AND al.al_deposito IN (${deposito})`;
      if (marca) where += ` AND ar.ar_marca IN (${marca})`;
      if (categoria) where += ` AND ar.ar_subcategoria IN (${categoria})`;
      if (subcategoria) where += ` AND ar.ar_subcategoria IN (${subcategoria})`;
      if (proveedor) where += ` AND ar.ar_proveedor IN (${proveedor})`;
      if (ubicacion) where += ` AND ar.ar_ubicacicion IN (${ubicacion})`;
      if (servicio) where += ` AND ar.ar_servicio = 1`;
      if (moneda) where += ` AND ar.ar_moneda IN (${moneda})`;
      if (unidadMedida) where += ` AND ar.ar_unidadmedida IN (${unidadMedida})`;
      if (stock === "-1") where += ` AND al.al_cantidad < 0`;
      if (stock === "0") where += ` AND al.al_cantidad = 0`;
      if (stock === "1") where += ` AND al.al_cantidad > 0`;

      const offset = (pagina - 1) * limite;

      if (tipoValorizacionCosto === "2") {
        ultimocostocompra = `
                COALESCE(
                  (SELECT FORMAT((dc.dc_precio + dc.dc_recargo), 0, 'de_DE')
                   FROM detalle_compras dc 
                   INNER JOIN compras c ON dc.dc_compra = c.co_codigo 
                   WHERE c.co_estado = 1
                   AND dc.dc_articulo = ar.ar_codigo
                   AND c.co_moneda = ar.ar_moneda
                   ORDER BY dc.dc_id DESC 
                   LIMIT 1),
                  CASE 
                    WHEN ar.ar_moneda = 1 THEN FORMAT(ar.ar_pcg, 0, 'de_DE')
                    WHEN ar.ar_moneda = 2 THEN FORMAT(ar.ar_pcd, 0, 'de_DE')
                    WHEN ar.ar_moneda = 3 THEN FORMAT(ar.ar_pcr, 0, 'de_DE')
                    WHEN ar.ar_moneda = 4 THEN FORMAT(ar.ar_pcp, 0, 'de_DE')
                    ELSE FORMAT(ar.ar_pcg, 0, 'de_DE')
                  END
                )
        `;
      } else {
        ultimocostocompra = `
      CASE 
          WHEN ${moneda || 1} = 1 THEN FORMAT(ar.ar_pcg, 0, 'de_DE')
          WHEN ${moneda || "NULL"} = 2 THEN FORMAT(ar.ar_pcd, 2, 'de_DE')
          WHEN ${moneda || "NULL"} = 3 THEN FORMAT(ar.ar_pcr, 2, 'de_DE')
          WHEN ${moneda || "NULL"} = 4 THEN FORMAT(ar.ar_pcp, 2, 'de_DE')
          ELSE NULL
        END
      `;
      }

      const baseQuery = `
      FROM articulos_lotes al
      INNER JOIN articulos ar ON al.al_articulo = ar.ar_codigo
      INNER JOIN depositos dep ON al.al_deposito = dep.dep_codigo
      INNER JOIN ubicaciones ub ON ar.ar_ubicacicion = ub.ub_codigo
      INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
      INNER JOIN categorias cat ON sc.sc_categoria = cat.ca_codigo
      INNER JOIN marcas ma ON ar.ar_marca = ma.ma_codigo
      INNER JOIN unidadmedidas um ON ar.ar_unidadmedida = um.um_codigo
      LEFT JOIN articulos_proveedores ap ON ar.ar_codigo = ap.arprove_articulo
      LEFT JOIN proveedores pro ON ap.arprove_codigo = pro.pro_codigo
      `;

      // Query para obtener el total de registros
      const countQuery = `
      SELECT COUNT(DISTINCT al.al_codigo) as total
      ${baseQuery}
      ${where}
    `;

      // Query principal con paginación
      const query = `
      SELECT DISTINCT
        ar.ar_codigo as codigo_articulo,
        (CASE WHEN al.al_codbarra IS NOT NULL AND al.al_codbarra != '' THEN al.al_codbarra ELSE ar.ar_codbarra END) as codigo_barra,
        ar.ar_descripcion as descripcion_articulo,
        ${ultimocostocompra} as precio_compra,
        CASE 
          WHEN ${moneda || 1} = 1 THEN FORMAT(ar.ar_pvg, 0, 'de_DE')
          WHEN ${moneda || "NULL"} = 2 THEN FORMAT(ar.ar_pvd, 2, 'de_DE')
          WHEN ${moneda || "NULL"} = 3 THEN FORMAT(ar.ar_pvr, 2, 'de_DE')
          WHEN ${moneda || "NULL"} = 4 THEN FORMAT(ar.ar_pvp, 2, 'de_DE')
          ELSE NULL
        END as precio_venta,
        FORMAT(ar.ar_pvcredito, 0, 'de_DE') as precio_venta_credito,
        FORMAT(ar.ar_pvmostrador, 0, 'de_DE') as precio_venta_mostrador,
        FORMAT(ar.ar_precio_4, 0, 'de_DE') as precio_venta_4,
        pro.pro_razon as proveedor,
        dep.dep_descripcion as deposito,
        ub.ub_descripcion as ubicacion,
        cat.ca_descripcion as categoria,
        sc.sc_descripcion as subcategoria,
        ma.ma_descripcion as marca,
        um.um_descripcion as unidad_medida,
        FORMAT(al.al_cantidad, 0, 'de_DE') as stock_actual,
        FORMAT(ar.ar_stkmin,  0, 'de_DE') as stock_minimo,
        al.al_codigo as lote,
        DATE_FORMAT(al.al_vencimiento, '%Y-%m-%d') as vencimiento,
        (case when ${moneda || 1} = 1 then 'Gs' when ${
        moneda || 1
      } = 2 then 'USD' when ${moneda || 1} = 3 then 'BRL' when ${
        moneda || 1
      } = 4 then 'ARS' else 'Gs' end) as moneda
      ${baseQuery}
      ${where}
      ORDER BY ar.ar_descripcion
      LIMIT ${limite} OFFSET ${offset}
    `;
      const [resultados, [totalRegistros]] = await Promise.all([
        db.sql(query),
        db.sql(countQuery),
      ]);

      console.log("Paginacion:", {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total: totalRegistros.total,
        paginas: Math.ceil(totalRegistros.total / limite),
      });

      return {
        datos: resultados,
        paginacion: {
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          total: totalRegistros.total,
          paginas: Math.ceil(totalRegistros.total / limite),
        },
      };
    } catch (error) {
      console.error("Error en todosNuevo:", error);
      throw error;
    }
  }

  function todos(string_busqueda, id_deposito, stock) {
    let where = "WHERE 1=1";

    if (string_busqueda) {
      console.log("String de búsqueda original:", string_busqueda);

      const palabras = string_busqueda
        .split(" ")
        .filter((p) => p.length > 0)
        .map((palabra) =>
          palabra.startsWith("0") ? palabra.slice(1) : palabra
        );

      console.log("Palabras después de procesar:", palabras);

      const condiciones = palabras.map((palabra) => {
        const condicion = `(ar.ar_descripcion LIKE '%${palabra}%' OR 
        al.al_codbarra = '${palabra}' OR 
        al.al_codbarra = '0${palabra}' OR 
        al.al_lote = '${palabra}' OR 
        ar.ar_cod_interno = '${palabra}' OR 
        al.al_codigo = '${palabra}')`;

        console.log("Condición generada para palabra", palabra, ":", condicion);
        return condicion;
      });

      const whereCondition = ` AND (${condiciones.join(" AND ")})`;
      console.log("Condición WHERE completa:", whereCondition);

      where += whereCondition;
    }

    if (stock !== undefined && stock !== "todos") {
      if (stock === "true" || stock === true || stock == 1) {
        where += " AND al.al_cantidad > 0";
      } else if (stock == 0) {
        where += " AND al.al_cantidad = 0";
      } else if (stock == -1) {
        where += " AND al.al_cantidad < 0";
      }
    }

    where += ` AND ar.ar_estado = 1 AND al.al_deposito = ${id_deposito}`;

    const query = `
        SELECT 
            al.*, 
            ar.*,
            t.t_descripcion as talle,
            c.c_descripcion as color,
            DATE_FORMAT(al.al_vencimiento, '%Y-%m-%d') AS venc
        FROM articulos_lotes al
        INNER JOIN articulos ar ON al.al_articulo = ar.ar_codigo
        INNER JOIN depositos de ON al.al_deposito = de.dep_codigo
        INNER JOIN unidadmedidas um ON ar.ar_unidadmedida = um.um_codigo
        INNER JOIN marcas ma ON ar.ar_marca = ma.ma_codigo
        LEFT JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
        LEFT JOIN articulos_proveedores ap ON ar.ar_codigo = ap.arprove_articulo
        LEFT JOIN proveedores p ON ap.arprove_codigo = p.pro_codigo
        LEFT JOIN ubicaciones ub ON ar.ar_ubicacicion = ub.ub_codigo
        LEFT JOIN talles t ON al.al_talle = t.t_codigo
        LEFT JOIN colores c ON al.al_color =  c.c_codigo
        ${where}
        GROUP BY al.al_codigo
        ORDER BY al.al_codigo DESC 
        LIMIT 10
    `;

    console.log("Query de todos:", query);
    return db.sql(query);
  }

  function todosDirecta(busqueda) {
    let where = "WHERE 1=1";

    if (busqueda && busqueda.length > 0) {
      const palabras = busqueda.split(" ").filter((p) => p.length > 0);
      const condiciones = palabras.map(
        (palabra) =>
          `(a.ar_descripcion LIKE '%${palabra}%' OR a.ar_codbarra LIKE '%${palabra}%')  OR a.ar_codigo LIKE '%${palabra}%'`
      );
      where += ` AND (${condiciones.join(" AND ")})`;
    }

    const query = `
      SELECT
        a.ar_codigo as id,
        a.ar_codbarra as cod_barra,
        a.ar_descripcion as descripcion
      FROM articulos a
      ${where}
      ORDER BY a.ar_descripcion ASC 
      LIMIT 15
    `;

    return db.sql(query);
  }

  function listar_por_barra() {
    const query = `SELECT ar_codigo, CONCAT(ar_descripcion, ' ', ar_cod_interno) AS ar_descripcion FROM articulos ORDER BY ar_descripcion`;
    return db.sql(query);
  }

  function resumen_comprasventas(
    fecha_desde,
    fecha_hasta,
    depositos,
    articulos,
    marcas,
    categorias,
    subcategorias,
    proveedores,
    moneda,
    tipo_valorizacion,
    talles,
    colores
  ) {
    let varcampocant = `SUM(al.al_cantidad)`; //Es una variable porque puede querer sacar de histórico de stock - OPCIÓN AÚN NO IMPLEMENTADA4
    ////////////////////////////////////////////////////////Precios de compra, venta y recargo, dependiendo de la moneda
    let campocompra = "";
    let camporecargo = "";
    let campoventa = "";
    let campoultcosto = "";
    let campocostopro = "";
    let ar_preciocosto = "";
    switch (moneda) {
      case 1: //Guaraníes
        ar_preciocosto = "ar.ar_pcg";
        campoventa = "ar.ar_pvg";
        break;
      case 2: //Dólares
        ar_preciocosto = "ar.ar_pcd";
        campoventa = "ar.ar_pvd";
        break;
      case 3: //Reales
        ar_preciocosto = "ar.ar_pcr";
        campoventa = "ar.ar_pvr";
        break;
      case 4: //Pesos
        ar_preciocosto = "ar.ar_pcp";
        campoventa = "ar.ar_pvp";
        break;
    }

    campoultcosto = `ifnull((SELECT dc_precio AS precio FROM detalle_compras a INNER JOIN compras b ON a.dc_compra = b.co_codigo WHERE a.dc_articulo = ar.ar_codigo AND b.co_moneda = ${moneda} ORDER BY a.dc_id DESC LIMIT 1), ${ar_preciocosto})`;
    campocostopro = `ifnull((SELECT (SUM((dt.dc_cantidad) * dt.dc_precio)/SUM(dt.dc_cantidad)) AS precio FROM compras c INNER JOIN detalle_compras dt ON dt.dc_compra = c.co_codigo WHERE dt.dc_articulo = ar.ar_codigo AND c.co_estado = 1 AND c.co_moneda= ${moneda}), ${ar_preciocosto})`;
    if (tipo_valorizacion == 1) {
      //Último precio costo
      campocompra = campoultcosto;
      camporecargo = `ifnull((SELECT dc_recargo AS recargo FROM detalle_compras a INNER JOIN compras b ON a.dc_compra = b.co_codigo WHERE a.dc_articulo = ar.ar_codigo AND b.co_moneda = ${moneda} ORDER BY a.dc_id DESC LIMIT 1), 0)`;
    } else {
      //Promedio costo
      campocompra = campocostopro;
      camporecargo = "0";
    }

    let where = "";
    if (depositos.length > 0) where += ` AND de.dep_codigo IN (${depositos})`;
    if (articulos.length > 0) where += ` AND ar.ar_codigo IN (${articulos})`;
    if (marcas.length > 0) where += ` AND ar.ar_marca IN (${marcas})`;
    if (categorias.length > 0)
      where += ` AND sc.sc_categoria IN (${categorias})`; //Guardamos la sub-cat en artículo, y estiramos de ahí la cat principal
    if (subcategorias.length > 0)
      where += ` AND ar.ar_subcategoria IN (${subcategorias})`;
    if (proveedores.length > 0)
      where += ` AND p.pro_codigo IN (${proveedores})`;
    if (talles.length > 0) where += ` AND al.al_talle IN (${talles})`;
    if (colores.length > 0) where += ` AND al.al_color IN (${colores})`;

    //Por lo visto este en FoxPro era una variable porque se usaba de la misma manera en varios lugares, pero el contenido es siempre el mismo
    let innerjoinprov =
      "LEFT JOIN articulos_proveedores ap ON ap.arprove_articulo = ar.ar_codigo LEFT JOIN proveedores p ON ap.arprove_prove = p.pro_codigo";

    let query = `
            SELECT
                al.al_codigo AS cod,
                ar.ar_codbarra AS barra,
                ar.ar_descripcion AS des,
                CAST(ifnull(al.al_lote,'') as char) AS lote,
                CAST(IF (al.al_vencimiento='0001-01-01','', Date_Format(IfNull(al.al_vencimiento, ''), "%d/%m/%Y")) as char) AS vencimiento,
                ifnull(ca.ca_descripcion,'') AS categoria,
                de.dep_descripcion,
                m.ma_descripcion,
                t.t_descripcion AS talle,
                c.c_descripcion AS color,
                f.f_razon_social AS fabricante,
                p.pro_razon AS proveedor,
                ${campocompra} AS preciocompra,
                ${campoventa} AS precioventa,
                comprasventas.compras AS compras,
                comprasventas.ventas AS ventas,
                (IFNULL(comprasventas.compras,0) - IFNULL(comprasventas.ventas,0)) AS stock
            FROM
                articulos_lotes al
                INNER JOIN articulos ar      ON al.al_articulo = ar.ar_codigo
                INNER JOIN depositos de      ON al.al_deposito = de.dep_codigo
                INNER JOIN sub_ubicacion s   ON s.s_codigo = ar.ar_sububicacion
                INNER JOIN marcas m          ON ar.ar_marca = m.ma_codigo
                INNER JOIN subcategorias sc  ON ar.ar_subcategoria = sc.sc_codigo
                LEFT JOIN categorias ca      ON sc.sc_categoria = ca.ca_codigo
                LEFT JOIN depositos ori      ON al.al_origen = ori.dep_codigo
                LEFT JOIN talles t           ON al.al_talle = t.t_codigo
                LEFT JOIN colores c          ON al.al_color = c.c_codigo
                LEFT JOIN fabricantes f      ON ar.ar_fabricante = f.f_codigo
                LEFT JOIN (SELECT
                                articulos_lotes.al_codigo AS cod,
                                SUM(detalle_ventas.deve_cantidad) AS ventas,
                                SUM(detalle_compras.dc_cantidad) AS compras
                            FROM
                                articulos_lotes
                                INNER JOIN detalle_ventas_vencimiento ON detalle_ventas_vencimiento.loteid = articulos_lotes.al_codigo
                                INNER JOIN detalle_ventas ON detalle_ventas_vencimiento.id_detalle_venta = detalle_ventas.deve_codigo
                                INNER JOIN detalle_compras_vencimineto ON detalle_compras_vencimineto.loteid = articulos_lotes.al_codigo
                                INNER JOIN detalle_compras ON detalle_compras_vencimineto.dv_detalle_compra = detalle_compras.dc_id
                                INNER JOIN compras ON detalle_compras.dc_compra = compras.co_codigo
                                INNER JOIN ventas ON detalle_ventas.deve_venta = ventas.ve_codigo
                            WHERE (compras.co_fecha >= '${fecha_desde}' AND ventas.ve_fecha >= '${fecha_desde}') AND (compras.co_fecha <= '${fecha_hasta}' AND ventas.ve_fecha <= '${fecha_hasta}') GROUP BY articulos_lotes.al_codigo) AS comprasventas ON al.al_codigo = comprasventas.cod
                ${innerjoinprov}
            WHERE 1 = 1
                AND (comprasventas.compras > 0 OR comprasventas.ventas > 0)
                ${where}
            GROUP BY al.al_codigo, al.al_talle, al.al_color`;

    return db.sql(query);
  }

  async function informe_stock(
    depositos,
    articulos,
    ubicaciones,
    sububicaciones,
    categorias,
    subcategorias,
    marcas,
    presentaciones,
    proveedores,
    lineas,
    bloques,
    moneda,
    est_stock,
    tipo_valorizacion,
    talles,
    colores
  ) {
    let varcampocant = `SUM(al.al_cantidad)`; //Es una variable porque puede querer sacar de histórico de stock - OPCIÓN AÚN NO IMPLEMENTADA4
    ////////////////////////////////////////////////////////Precios de compra, venta y recargo, dependiendo de la moneda
    let campocompra = "";
    let camporecargo = "";
    let campoventa = "";
    let campoultcosto = "";
    let campocostopro = "";
    let ar_preciocosto = "";
    switch (moneda) {
      case 1: //Guaraníes
        ar_preciocosto = "ar.ar_pcg";
        campoventa = "ar.ar_pvg";
        break;
      case 2: //Dólares
        ar_preciocosto = "ar.ar_pcd";
        campoventa = "ar.ar_pvd";
        break;
      case 3: //Reales
        ar_preciocosto = "ar.ar_pcr";
        campoventa = "ar.ar_pvr";
        break;
      case 4: //Pesos
        ar_preciocosto = "ar.ar_pcp";
        campoventa = "ar.ar_pvp";
        break;
    }

    campoultcosto = `ifnull((SELECT dc_precio AS precio FROM detalle_compras a INNER JOIN compras b ON a.dc_compra = b.co_codigo WHERE a.dc_articulo = ar.ar_codigo AND b.co_moneda = ${moneda} ORDER BY a.dc_id DESC LIMIT 1), ${ar_preciocosto})`;
    campocostopro = `ifnull((SELECT (SUM((dt.dc_cantidad) * dt.dc_precio)/SUM(dt.dc_cantidad)) AS precio FROM compras c INNER JOIN detalle_compras dt ON dt.dc_compra = c.co_codigo WHERE dt.dc_articulo = ar.ar_codigo AND c.co_estado = 1 AND c.co_moneda= ${moneda}), ${ar_preciocosto})`;
    if (tipo_valorizacion == 1) {
      //Último precio costo
      campocompra = campoultcosto;
      camporecargo = `ifnull((SELECT dc_recargo AS recargo FROM detalle_compras a INNER JOIN compras b ON a.dc_compra = b.co_codigo WHERE a.dc_articulo = ar.ar_codigo AND b.co_moneda = ${moneda} ORDER BY a.dc_id DESC LIMIT 1), 0)`;
    } else {
      //Promedio costo
      campocompra = campocostopro;
      camporecargo = "0";
    }

    //Por lo visto este en FoxPro era una variable porque se usaba de la misma manera en varios lugares, pero el contenido es siempre el mismo
    let innerjoinprov =
      "LEFT JOIN articulos_proveedores ap ON ap.arprove_articulo = ar.ar_codigo LEFT JOIN proveedores p ON ap.arprove_prove = p.pro_codigo";

    //
    let groupbylote = "GROUP BY al.al_codigo"; //Acá no agrupa por lote, pero en otro listado se puede pedir agrupar por lote - OPCIÓN AÚN NO IMPLEMENTADA

    ////////////////////////////////////////////////////////Construcción del WHERE
    let where = " WHERE 1 = 1";
    if (depositos.length > 0) where += ` AND de.dep_codigo IN (${depositos})`;
    if (articulos.length > 0) where += ` AND ar.ar_codigo IN (${articulos})`;
    if (ubicaciones.length > 0)
      where += ` AND ar.ar_ubicacicion IN (${ubicaciones})`; //Sí, así se llama el campo en la tabla
    if (sububicaciones.length > 0)
      where += ` AND ar.ar_sububicacion IN (${sububicaciones})`;

    if (categorias.length > 0)
      where += ` AND sc.sc_categoria IN (${categorias})`; //Guardamos la sub-cat en artículo, y estiramos de ahí la cat principal
    if (subcategorias.length > 0)
      where += ` AND ar.ar_subcategoria IN (${subcategorias})`;
    if (marcas.length > 0) where += ` AND ar.ar_marca IN (${marcas})`;
    if (presentaciones.length > 0)
      where += ` AND z.um_codigo IN (${presentaciones})`;
    if (proveedores.length > 0)
      where += ` AND p.pro_codigo IN (${proveedores})`;

    if (lineas.length > 0) where += ` AND ar.ar_linea IN (${lineas})`;
    if (bloques.length > 0) where += ` AND ar.ar_bloque IN (${bloques})`;
    if (talles.length > 0) where += ` AND al.al_talle IN (${talles})`;
    if (colores.length > 0) where += ` AND al.al_color IN (${colores})`;

    switch (est_stock) {
      case 1: //Mayor a 0
        where += ` AND al.al_cantidad > 0`;
        break;
      case 2: //Menor a 0
        where += ` AND al.al_cantidad < 0`;
        break;
      case 3: //Igual a 0
        where += ` AND al.al_cantidad = 0`;
        break;
      case 4: //Todos
        break;
    }

    let query =
      `SELECT
                    CAST(ar.ar_cod_interno as char(100)) AS cod,
                    ar.ar_codbarra AS barra,
                    ar.ar_descripcion AS des,
                    ar.ar_stkmin AS stockminimo,
                    ${varcampocant} AS cantidad,
                    CAST(ifnull(al.al_lote,'') as char) AS lote,
                    CAST(IF (al.al_vencimiento='0001-01-01','', Date_Format(IfNull(al.al_vencimiento, ''), "%d/%m/%Y")) as char) AS vencimiento,
                    ifnull(ori.dep_obs,'') AS origen,
                    de.dep_descripcion,
                    IfNull(z.um_descripcion, '') AS um_descripcion,
                    ifnull(ca.ca_descripcion,'') AS categoria,
                    m.ma_descripcion,
                    p.pro_razon AS proveedor,
                    ${campocompra} AS preciocompra,
                    ${camporecargo} AS recargocompra,
                    (${varcampocant}*(${campocompra}+${camporecargo})) AS total,
                    ${campoventa} AS precioventa,
                    (${varcampocant}*${campoventa}) AS totalventa,
                    if(ar.ar_materia_prima = 1, "MP", "PT") AS materiaprima,
                    de.dep_codigo,
                    ar.ar_codigo,
                    CAST(al.al_codigo as decimal) AS loteid,
                    CAST(ifnull(ori.dep_codigo,0) as decimal) AS origencod,
                    ifnull(CAST(if(al.al_vencimiento = '0001-01-01',0,DateDiff(al.al_vencimiento, curdate())) as decimal),0) AS iddias,
                    m.ma_codigo AS marcod,
                    ca.ca_codigo AS clacod,
                    ca.ca_descripcion AS cladesc,
                    t.t_descripcion AS talle,
                    c.c_descripcion AS color,
                    f.f_razon_social AS fabricante, ` +
      // <<campolistapcontado>> as lpcontado,
      // <<campolistapcredito>> as lpcredito,
      // <<campolistapmostrador>> as lpmostrador,
      // ${campocostopro} as costopro,
      // ${campoultcosto} as ultcosto,
      `ar.ar_materia_prima,
                    ifnull((SELECT date_format(c.co_fecha, "%d/%m/%Y") AS fecha
                            FROM detalle_compras d INNER JOIN compras c ON d.dc_compra = c.co_codigo
                            WHERE c.co_estado = 1 AND d.dc_articulo = al.al_articulo AND c.co_deposito = al.al_deposito
                            ORDER BY c.co_fecha DESC LIMIT 1),'') AS ultfechcompra,
                    ifnull(ar.ar_principio_activo,'') AS ar_principio_activo
                FROM
                    articulos ar
                    INNER JOIN articulos_lotes al   ON al.al_articulo = ar.ar_codigo
                    INNER JOIN depositos de         ON al.al_deposito = de.dep_codigo
                    INNER JOIN sub_ubicacion s      ON s.s_codigo = ar.ar_sububicacion
                    INNER JOIN marcas m             ON ar.ar_marca = m.ma_codigo
                    INNER JOIN subcategorias sc     ON ar.ar_subcategoria = sc.sc_codigo
                    INNER JOIN unidadmedidas z      ON ar.ar_unidadmedida = z.um_codigo
                    LEFT JOIN categorias ca         ON sc.sc_categoria = ca.ca_codigo
                    LEFT JOIN depositos ori         ON al.al_origen = ori.dep_codigo
                    LEFT JOIN talles t              ON al.al_talle = t.t_codigo
                    LEFT JOIN colores c             ON al.al_color = c.c_codigo
                    LEFT JOIN fabricantes f         ON ar.ar_fabricante = f.f_codigo
                    ${innerjoinprov}
                    ${where} and ar.ar_incluir_inventario = 1
                ${groupbylote}
                ORDER BY ar.ar_descripcion`;
    console.log(query);
    return db.sql(query);
  }

  function uno(ar_codigo, id_deposito, lote) {
    const campos =
      " a.*, al.al_codigo, al.al_lote, al.al_cantidad, Date_Format(al.al_vencimiento, '%Y-%m-%d') AS venc, um.um_cod_set";
    let where = ` a.ar_codigo = ${ar_codigo} AND a.ar_estado = 1 and al.al_deposito = ${id_deposito} GROUP BY al.al_codigo`;
    if (lote != null && lote != 0)
      where = `al.al_codigo = ${lote} AND ` + where;

    return db.todos(TABLA, campos, where);
  }

  function barra(ar_codbarra, id_deposito, lote) {
    const campos =
      " a.*, al.al_codigo, al.al_lote, al.al_cantidad, Date_Format(al.al_vencimiento, '%Y-%m-%d') AS venc, um.um_cod_set";
    let where = ` a.ar_codbarra = ${ar_codbarra} AND a.ar_estado = 1 and al.al_deposito = ${id_deposito} GROUP BY al.al_codigo`;
    if (lote != null && lote != 0)
      where = `al.al_codigo = ${lote} AND ` + where;

    return db.todos(TABLA, campos, where);
  }

  function enPedidoRemision(articulo, lote) {
    const query = `
    (SELECT
      DATE_FORMAT(p.p_fecha, '%Y-%m-%d') AS fecha,
      c.cli_razon,
      d.dp_cantidad AS cantped,
      'PEDIDO' AS tipo
    FROM
      detalle_pedido d
      INNER JOIN pedidos p ON d.dp_pedido = p.p_codigo
      INNER JOIN clientes c ON p.p_cliente = c.cli_codigo
    WHERE
      p.p_estado = 1
      AND d.dp_habilitar = 1
      AND d.dp_articulo = ${articulo}
      AND d.dp_codigolote = ${lote})
    
    UNION ALL

    (SELECT
      DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha,
      c.cli_razon,
      d.cantidad,
      'REMISION' as tipo
    FROM
      remisiones_items d
      INNER JOIN remisiones r ON d.remision = r.id
      INNER JOIN clientes c ON r.cliente = c.cli_codigo
    WHERE
      r.estado = 1
      AND r.tipo_estados = 0
      AND d.articulo = ${articulo}
      AND d.codlote	= ${lote}
    ORDER BY r.id DESC)`;

    return db.sql(query);
  }

  function ver_lotes_talle(articulos) {
    const query = ` SELECT
                        a.ar_codigo,
                        a.ar_descripcion,
                        al.al_nrotalle,
                        al.al_codbarra,
                        ta.t_descripcion,
                        c.c_descripcion,
                        d.dep_descripcion,
                        al.al_codigo,
                        ifnull((SELECT
                                    c.co_fecha as ult_compra
                                FROM
                                    detalle_compras dc INNER JOIN 
                                    compras c ON dc.dc_compra = c.co_codigo
                                WHERE dc.dc_articulo = a.ar_codigo AND c.co_estado = 1 
                                ORDER BY c.co_fecha DESC
                                LIMIT 1),'') as ult_com,
                        ifnull((SELECT
                                    v.ve_fecha as ult_venta
                                FROM
                                    detalle_ventas dv
                                    INNER JOIN ventas v ON dv.deve_venta = v.ve_codigo
                                WHERE dv.deve_articulo = a.ar_codigo and v.ve_estado = 1
                                ORDER BY v.ve_fecha DESC 
                                LIMIT 1),'') as ult_ven,
                        al.al_cantidad
                    FROM
                        articulos a
                        INNER JOIN articulos_lotes al ON al.al_articulo = a.ar_codigo
                        INNER JOIN depositos d ON al.al_deposito = d.dep_codigo
                        LEFT JOIN talles ta ON al.al_talle = ta.t_codigo
                        LEFT JOIN colores c ON al.al_color = c.c_codigo                       
                    WHERE a.ar_codigo in(${articulos}) 
                    GROUP BY al.al_codigo
                    ORDER BY a.ar_descripcion DESC `;
    return db.sql(query);
  }

  function nroUltimoInventario() {
    try {
      const query = `
      SELECT 
        i.nro_inventario,
        (
          SELECT JSON_ARRAYAGG(id_categoria)
          FROM (
            SELECT DISTINCT
              ca.ca_codigo as id_categoria
            FROM inventario_auxiliar_items iai
            INNER JOIN articulos ar ON iai.id_articulo = ar.ar_codigo
            INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
            INNER JOIN categorias ca ON sc.sc_categoria = ca.ca_codigo
            WHERE iai.id_inventario = (SELECT id FROM inventario_auxiliar ORDER BY id DESC LIMIT 1)
            GROUP BY ca.ca_codigo
            ORDER BY ca.ca_descripcion
          ) t
        ) as categorias
      FROM inventarios i 
      ORDER BY i.id DESC 
      LIMIT 1
    `;
      console.log(db.sql(query));
      return db.sql(query);
    } catch (err) {
      console.error(err);
    }
  }

  async function insertarArticulo(item) {
    try {
      // Mapear el item recibido a la estructura que espera la base de datos
      const Nuevoitem = {
        codigo: item.ar_codigo,
        codbarra: item.ar_codbarra,
        unidadMedida: item.ar_unidadmedida,
        descripcion: item.ar_descripcion,
        marca: item.ar_marca,
        subcategoria: item.ar_subcategoria,
        ubicacion: item.ar_ubicacicion,
        moneda: item.ar_moneda,
        iva: item.ar_iva,
        precioCostoGeneral: item.ar_pcg,
        precioCostoDistribuidor: item.ar_pcd,
        precioCostoRevendedor: item.ar_pcr, 
        precioCostoPublico: item.ar_pcp,
        precioVentaGeneral: item.ar_pvg,
        precioVentaDistribuidor: item.ar_pvd,
        precioVentaRevendedor: item.ar_pvr,
        precioVentaPublico: item.ar_pvp,
        stockMinimo: item.ar_stkmin,
        comision: item.ar_comision,
        ganancia: item.ar_ganancia,
        descuentoMaximo: item.ar_descmax,
        servicio: item.ar_servicio,
        stockNegativo: item.ar_stockneg,
        movimientoPeso: item.ar_movpeso,
        observacion: item.ar_obs,
        disponible: item.ar_disponible,
        estado: item.ar_estado,
        recargo: item.ar_recargo,
        vencimiento: item.ar_vencimiento,
        fechaVencimiento: item.ar_fechaVen,
        codigoBarraUnidad: item.ar_cbUnidad,
        kilos: item.ar_kilos,
        fechaAlta: item.ar_fechaAlta,
        usuarioAlta: item.ar_usuarioAlta,
        legal: item.ar_legal,
        nombreGenerico: item.ar_nom_generico,
        codigoAcri: item.ar_cod_acri,
        fabricante: item.ar_fabricante,
        indicacion: item.ar_indicacion,
        tipoControl: item.ar_tipo_control,
        precioVentaCredito: item.ar_pvcredito,
        precioVentaMostrador: item.ar_pvmostrador,
        pais: item.ar_pais,
        via: item.ar_via,
        gananciaCredito: item.ar_gancredito,
        gananciaMostrador: item.ar_ganmostrador,
        linea: item.ar_linea,
        foto: item.ar_foto,
        cantidadCaja: item.ar_cant_caja,
        documento: item.ar_documento,
        transmision: item.ar_transmision,
        estadoVehiculo: item.ar_estado_veh,
        combustible: item.ar_combustible,
        traccion: item.ar_traccion,
        chassi: item.ar_chassi,
        modelo: item.ar_modelo,
        chapa: item.ar_chapa,
        km: item.ar_km,
        codigoInterno: item.ar_cod_interno,
        precioVentaDistCredito: item.ar_pvdcredito,
        precioVentaDistMostrador: item.ar_pvdmostrador,
        gananciaDistContado: item.ar_gandcontado,
        gananciaDistCredito: item.ar_gandcredito,
        gananciaDistMostrador: item.ar_gandmostrador,
        principioActivo: item.ar_principio_activo,
        concentracion: item.ar_concentracion,
        kit: item.ar_kit,
        precioDescGs: item.ar_precio_desc_gs,
        precioDescDs: item.ar_precio_desc_ds,
        cantidadDesde: item.ar_cantidad_desde,
        gananciaDesc: item.ar_ganancia_desc,
        materiaPrima: item.ar_materia_prima,
        movBoutique: item.ar_mov_boutique,
        promo: item.ar_promo,
        seccion: item.ar_seccion,
        incluirInventario: item.ar_incluir_inventario,
        receptor: item.ar_receptor,
        dvl: item.ar_dvl,
        dVentaL: item.ar_d_venta_l,
        serie: item.ar_serie,
        garantia: item.ar_garantia,
        lote: item.ar_lote,
        subUbicacion: item.ar_sububicacion,
        editarDesc: item.ar_editar_desc,
        granatura: item.ar_granatura,
        medida: item.ar_medida,
        caracteristica: item.ar_caracteristica,
        colores: item.ar_colores,
        controlCodbarra: item.ar_control_codbarra,
        opcionSet: item.ar_opcion_set,
        opcionSet10: item.ar_opcion_set10,
        precio4: item.ar_precio_4,
        gananciaPrecio4: item.ar_ganprecio_4,
        preciod4: item.ar_preciod_4,
        gananciaPreciod4: item.ar_ganpreciod_4,
        precioVentaPorCaja: item.ar_pvgxcaja,
        gananciaPorCaja: item.ar_ganpvgxcaja,
        controlRegistro: item.ar_control_registro,
        ignorarMovimientoCxC: item.ar_ignorarmovcxc,
        actualizarPrecioVenta: item.ar_actualizar_pventa,
        costoM2: item.ar_costo_mt2,
        bloque: item.ar_bloque,
        pvgxCajaCredito: item.ar_pvgxcaja_cred,
        pvgxCajaGCredito: item.ar_pvgxcajag_cred,
        pvgxCajaMostrador: item.ar_pvgxcaja_most,
        pvgxCajaGMostrador: item.ar_pvgxcajag_most,
        pvgxCajaGMostrador2: item.ar_pvgxcajag_most2,
        actualizarCostoSubProd: item.ar_actcostosubeprod,
        noActualizarCostoBajaProd: item.ar_noactcostosubeprod,
        bloquear: item.ar_bloquear,
        fraccionamiento: item.ar_fraccionamiento,
        cantFraccion: item.ar_cant_fraccion,
        precioFraccion: item.ar_precio_fraccion,
        comprimido: item.ar_comprimido,
        formulaPintura: item.ar_formula_pintura,
        basePintura: item.ar_base_pintura,
        marcasOrigen: item.ar_cod_marcas_origen,
        ensamble: item.ar_ms_ensamble
      };

      // Insertar en la base de datos con nombres de columnas que coinciden con la interfaz
      const result = await db.sql(
        `INSERT INTO articulos (
          ar_codigo, ar_codbarra, ar_unidadmedida, ar_descripcion, ar_marca, 
          ar_subcategoria, ar_ubicacicion, ar_moneda, ar_iva, ar_pcg, 
          ar_pcd, ar_pcr, ar_pcp, ar_pvg, ar_pvd, 
          ar_pvr, ar_pvp, ar_stkmin, ar_comision, ar_ganancia, 
          ar_descmax, ar_servicio, ar_stockneg, ar_movpeso, ar_obs, 
          ar_disponible, ar_estado, ar_recargo, ar_vencimiento, ar_fechaVen, 
          ar_cbUnidad, ar_kilos, ar_fechaAlta, ar_usuarioAlta, ar_legal, 
          ar_nom_generico, ar_cod_acri, ar_fabricante, ar_indicacion, ar_tipo_control, 
          ar_pvcredito, ar_pvmostrador, ar_pais, ar_via, ar_gancredito, 
          ar_ganmostrador, ar_linea, ar_foto, ar_cant_caja, ar_documento, 
          ar_transmision, ar_estado_veh, ar_combustible, ar_traccion, ar_chassi, 
          ar_modelo, ar_chapa, ar_km, ar_cod_interno, ar_pvdcredito, 
          ar_pvdmostrador, ar_gandcontado, ar_gandcredito, ar_gandmostrador, ar_principio_activo, 
          ar_concentracion, ar_kit, ar_precio_desc_gs, ar_precio_desc_ds, ar_cantidad_desde, 
          ar_ganancia_desc, ar_materia_prima, ar_mov_boutique, ar_promo, ar_seccion, 
          ar_incluir_inventario, ar_receptor, ar_dvl, ar_d_venta_l, ar_serie, 
          ar_garantia, ar_lote, ar_sububicacion, ar_editar_desc, ar_granatura, 
          ar_medida, ar_caracteristica, ar_colores, ar_control_codbarra, ar_opcion_set, 
          ar_opcion_set10, ar_precio_4, ar_ganprecio_4, ar_preciod_4, ar_ganpreciod_4, 
          ar_pvgxcaja, ar_ganpvgxcaja, ar_control_registro, ar_ignorarmovcxc, ar_actualizar_pventa, 
          ar_costo_mt2, ar_bloque, ar_pvgxcaja_cred, ar_pvgxcajag_cred, ar_pvgxcaja_most, 
          ar_pvgxcajag_most, ar_pvgxcajag_most2, ar_actcostosubeprod, ar_noactcostosubeprod, ar_bloquear, 
          ar_fraccionamiento, ar_cant_fraccion, ar_precio_fraccion, ar_comprimido, ar_formula_pintura, 
          ar_base_pintura, ar_cod_marcas_origen, ar_ms_ensamble
        ) VALUES (
          ${Nuevoitem.codigo},
          ${Nuevoitem.codbarra},
          ${Nuevoitem.unidadMedida},
          ${Nuevoitem.descripcion},
          ${Nuevoitem.marca},
          ${Nuevoitem.subcategoria},
          ${Nuevoitem.ubicacion},
          ${Nuevoitem.moneda},
          ${Nuevoitem.iva},
          ${Nuevoitem.precioCostoGeneral},
          ${Nuevoitem.precioCostoDistribuidor},
          ${Nuevoitem.precioCostoRevendedor},
          ${Nuevoitem.precioCostoPublico},
          ${Nuevoitem.precioVentaGeneral},
          ${Nuevoitem.precioVentaDistribuidor},
          ${Nuevoitem.precioVentaRevendedor},
          ${Nuevoitem.precioVentaPublico},
          ${Nuevoitem.stockMinimo},
          ${Nuevoitem.comision},
          ${Nuevoitem.ganancia},
          ${Nuevoitem.descuentoMaximo},
          ${Nuevoitem.servicio},
          ${Nuevoitem.stockNegativo},
          ${Nuevoitem.movimientoPeso},
          ${Nuevoitem.observacion},
          ${Nuevoitem.disponible},
          ${Nuevoitem.estado},
          ${Nuevoitem.recargo},
          ${Nuevoitem.vencimiento},
          ${Nuevoitem.fechaVencimiento},
          ${Nuevoitem.codigoBarraUnidad},
          ${Nuevoitem.kilos},
          ${Nuevoitem.fechaAlta},
          ${Nuevoitem.usuarioAlta},
          ${Nuevoitem.legal},
          ${Nuevoitem.nombreGenerico},
          ${Nuevoitem.codigoAcri},
          ${Nuevoitem.fabricante},
          ${Nuevoitem.indicacion},
          ${Nuevoitem.tipoControl},
          ${Nuevoitem.precioVentaCredito},
          ${Nuevoitem.precioVentaMostrador},
          ${Nuevoitem.pais},
          ${Nuevoitem.via},
          ${Nuevoitem.gananciaCredito},
          ${Nuevoitem.gananciaMostrador},
          ${Nuevoitem.linea},
          ${Nuevoitem.foto},
          ${Nuevoitem.cantidadCaja},
          ${Nuevoitem.documento},
          ${Nuevoitem.transmision},
          ${Nuevoitem.estadoVehiculo},
          ${Nuevoitem.combustible},
          ${Nuevoitem.traccion},
          ${Nuevoitem.chassi},
          ${Nuevoitem.modelo},
          ${Nuevoitem.chapa},
          ${Nuevoitem.km},
          ${Nuevoitem.codigoInterno},
          ${Nuevoitem.precioVentaDistCredito},
          ${Nuevoitem.precioVentaDistMostrador},
          ${Nuevoitem.gananciaDistContado},
          ${Nuevoitem.gananciaDistCredito},
          ${Nuevoitem.gananciaDistMostrador},
          ${Nuevoitem.principioActivo},
          ${Nuevoitem.concentracion},
          ${Nuevoitem.kit},
          ${Nuevoitem.precioDescGs},
          ${Nuevoitem.precioDescDs},
          ${Nuevoitem.cantidadDesde},
          ${Nuevoitem.gananciaDesc},
          ${Nuevoitem.materiaPrima},
          ${Nuevoitem.movBoutique},
          ${Nuevoitem.promo},
          ${Nuevoitem.seccion},
          ${Nuevoitem.incluirInventario},
          ${Nuevoitem.receptor},
          ${Nuevoitem.dvl},
          ${Nuevoitem.dVentaL},
          ${Nuevoitem.serie},
          ${Nuevoitem.garantia},
          ${Nuevoitem.lote},
          ${Nuevoitem.subUbicacion},
          ${Nuevoitem.editarDesc},
          ${Nuevoitem.granatura},
          ${Nuevoitem.medida},
          ${Nuevoitem.caracteristica},
          ${Nuevoitem.colores},
          ${Nuevoitem.controlCodbarra},
          ${Nuevoitem.opcionSet},
          ${Nuevoitem.opcionSet10},
          ${Nuevoitem.precio4},
          ${Nuevoitem.gananciaPrecio4},
          ${Nuevoitem.preciod4},
          ${Nuevoitem.gananciaPreciod4},
          ${Nuevoitem.precioVentaPorCaja},
          ${Nuevoitem.gananciaPorCaja},
          ${Nuevoitem.controlRegistro},
          ${Nuevoitem.ignorarMovimientoCxC},
          ${Nuevoitem.actualizarPrecioVenta},
          ${Nuevoitem.costoM2},
          ${Nuevoitem.bloque},
          ${Nuevoitem.pvgxCajaCredito},
          ${Nuevoitem.pvgxCajaGCredito},
          ${Nuevoitem.pvgxCajaMostrador},
          ${Nuevoitem.pvgxCajaGMostrador},
          ${Nuevoitem.pvgxCajaGMostrador2},
          ${Nuevoitem.actualizarCostoSubProd},
          ${Nuevoitem.noActualizarCostoBajaProd},
          ${Nuevoitem.bloquear},
          ${Nuevoitem.fraccionamiento},
          ${Nuevoitem.cantFraccion},
          ${Nuevoitem.precioFraccion},
          ${Nuevoitem.comprimido},
          ${Nuevoitem.formulaPintura},
          ${Nuevoitem.basePintura},
          ${Nuevoitem.marcasOrigen},
          ${Nuevoitem.ensamble}
        )`
      );
      
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async function actualizarArticulo(item) {
    try {
      if (!item.ar_codigo) {
        throw new Error("Se requiere el código de artículo para actualizar");
      }

      const camposActualizar = {};
      Object.entries(item).forEach(([clave, valor]) => {
        if (clave !== 'ar_codigo') {
          camposActualizar[clave] = valor;
        }
      });

      if (Object.keys(camposActualizar).length === 0) {
        return { message: "No hay campos para actualizar" };
      }

      const setCampos = Object.entries(camposActualizar)
        .map(([columna, valor]) => {
          if (valor === null) {
            return `${columna} = NULL`;
          } else if (typeof valor === 'string') {
            return `${columna} = '${valor.replace(/'/g, "''")}'`; 
          } else {
            return `${columna} = ${valor}`;
          }
        })
        .join(', ');

      const result = await db.sql(
        `UPDATE articulos 
         SET ${setCampos} 
         WHERE ar_codigo = ${item.ar_codigo}`
      );
      
      return { 
        message: "Artículo actualizado correctamente", 
        camposActualizados: Object.keys(camposActualizar),
        filasAfectadas: result.rowCount || 0
      };
    } catch (err) {
      console.error("Error al actualizar artículo:", err);
      throw err;
    }
  }

  async function traerTodosLosArticulos(pagina = 1, limite = 20, query = {}) {
    try {
      console.log("Query params recibidos:", query);
      const offset = (pagina - 1) * limite;

      // Construir objeto de filtros desde query params
      const filtros = {
        id_deposito: query.id_deposito,
        busqueda: query.buscar,
        marca: query.marca,
        subcategoria: query.subcategoria,
        stock: parseInt(query.stock), // Convertir a número entero
      };

      console.log("Filtros procesados:", filtros);

      let sqlQuery = `
      SELECT DISTINCT
        al.al_codigo, 
        ar.ar_codigo, 
        ar.ar_codbarra, 
        ar.ar_descripcion, 
        al.al_cantidad, 
        ar.ar_pvg, 
        ar.ar_pvcredito, 
        ar.ar_pvmostrador, 
        ar.ar_precio_4, 
        p.pro_razon,  
        dep.dep_descripcion, 
        ar.ar_bloque, 
        ub.ub_descripcion, 
        um.um_descripcion, 
        ma.ma_descripcion, 
        sc.sc_descripcion, 
        al.al_vencimiento, 
        ar.ar_pcg
      FROM articulos_lotes al
      INNER JOIN articulos ar ON al.al_articulo = ar.ar_codigo
      LEFT JOIN articulos_proveedores ap ON ar.ar_codigo = ap.arprove_articulo 
      LEFT JOIN proveedores p ON ap.arprove_codigo = p.pro_codigo
      INNER JOIN depositos dep ON al.al_deposito = dep.dep_codigo
      INNER JOIN ubicaciones ub ON ar.ar_ubicacicion = ub.ub_codigo
      INNER JOIN unidadmedidas um ON ar.ar_unidadmedida = um.um_codigo
      INNER JOIN marcas ma ON ar.ar_marca = ma.ma_codigo
      INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
      WHERE 1=1 
    `;

      // Aplicar filtros
      if (query.id_deposito) {
        sqlQuery += ` AND al.al_deposito = ${query.id_deposito}`;
      }

      if (query.buscar) {
        sqlQuery += ` AND (
        ar.ar_descripcion LIKE '%${query.buscar}%' 
        OR ar.ar_codbarra LIKE '%${query.buscar}%'
      )`;
      }

      if (query.marca) {
        sqlQuery += ` AND ma.ma_codigo = ${query.marca}`;
      }

      if (query.subcategoria) {
        sqlQuery += ` AND sc.sc_codigo = ${query.subcategoria}`;
      }

      // Corregir la lógica del filtro de stock
      if (filtros.stock === 1) {
        sqlQuery += ` AND al.al_cantidad > 0`;
      } else if (filtros.stock === 0) {
        sqlQuery += ` AND al.al_cantidad = 0`;
      } else if (filtros.stock === -1) {
        sqlQuery += ` AND al.al_cantidad < 0`;
      }

      // agrupar por codigo del lote del articulo y ordenar por descripcion del articulo
      sqlQuery += `
      GROUP BY al.al_codigo
      ORDER BY ar.ar_descripcion 
      LIMIT ${limite} OFFSET ${offset}
    `;

      console.log("Query final:", sqlQuery);
      const articulos = await db.sql(sqlQuery);
      return articulos;
    } catch (error) {
      console.error("Error al obtener artículos:", error);
      throw new Error("Error al obtener la lista de artículos");
    }
  }

  async function insertarInventario(consulta) {
    const inventario = consulta.inventario;

    console.log("Datos de inventario recibidos:", inventario);
    const inventarioQuery = `
        INSERT INTO inventarios (fecha, hora, operador, sucursal, deposito, tipo, estado, in_obs, nro_inventario) 
        VALUES ('${inventario.fecha}', '${inventario.hora}', ${
      inventario.operador
    }, ${inventario.sucursal}, 
                ${inventario.deposito}, ${inventario.tipo}, ${
      inventario.estado
    }, '${inventario.in_obs}', ${
      !inventario.nro_inventario ? 1 : inventario.nro_inventario
    })`;

    await db.sql(inventarioQuery);
  }

  async function insertarItemInventario(consulta) {
    const { inventario, inventario_items } = consulta;

    console.log("Datos de inventario recibidos:", inventario);
    console.log("Datos de inventario_items recibidos:", inventario_items);

    try {
      if (
        !inventario ||
        !inventario_items ||
        !Array.isArray(inventario_items)
      ) {
        throw new Error("Datos de inventario inválidos");
      }

      console.log("Inventario:", inventario);

      // Inicia la transacción
      await db.sql("START TRANSACTION");

      const ultimoInventario = await db.sql(
        `
        SELECT * FROM inventarios ORDER BY id DESC LIMIT 1
        `
      );

      const inventarioId = ultimoInventario[0].id;

      for (const detalle of inventario_items) {
        detalle.inventario = inventarioId;
        console.log("Detalle:", detalle);

        const detalleQuery = `
          INSERT INTO inventarios_items (idArticulo, cantidad, costo, inventario, stock_actual, stock_dif)
          VALUES (${detalle.idArticulo}, ${detalle.cantidad}, ${detalle.costo}, 
                  ${detalle.inventario}, ${detalle.stock_actual}, ${detalle.stock_dif})`;

        const detalleResult = await db.sql(detalleQuery);
        const inventarioItemId = detalleResult.insertId;

        if (detalle.vencimientos && Array.isArray(detalle.vencimientos)) {
          for (const vencimiento of detalle.vencimientos) {
            console.log("Vencimiento:", vencimiento);

            const checkLoteQuery = `
              SELECT al_codigo
              FROM articulos_lotes
              WHERE  al_lote = '${vencimiento.lote}'
              AND al_articulo = ${detalle.idArticulo}
              AND al_deposito = ${inventario.deposito}
              `;

            const loteResult = await db.sql(checkLoteQuery);
            let loteId;
            if (loteResult.length > 0) {
              const updateLoteQuery = `
                UPDATE articulos_lotes
                SET al_cantidad = ${detalle.cantidad}
                WHERE al_lote = '${vencimiento.lote}'
                AND al_articulo = ${detalle.idArticulo}
                AND al_deposito = ${inventario.deposito}`;

              await db.sql(updateLoteQuery);

              loteId = loteResult[0].al_codigo;
            } else {
              const insertLoteQuery = `
                INSERT INTO articulos_lotes (
                  al_articulo, al_deposito, al_lote, al_cantidad, 
                  al_vencimiento, al_pre_compra, al_origen, al_serie,
                  al_codbarra, al_nrotalle, al_color, al_talle, al_registro
                ) VALUES (
                  ${detalle.idArticulo},
                  ${inventario.deposito},
                  '${vencimiento.lote}',
                  ${detalle.cantidad},
                  '${vencimiento.fecha_vence}',
                  0, 0, '',
                  '${detalle.codbarra || ""}',
                  '', ${detalle.color || 0}, ${detalle.talle || 0}, ''
                )`;

              const newLoteResult = await db.sql(insertLoteQuery);
              loteId = newLoteResult.insertId;
            }

            const vencimientoQuery = `
              INSERT INTO inventario_items_vencimiento
              (i_inventario_item, i_lote, i_fecha_vence, loteid)
              VALUES (${inventarioItemId}, '${vencimiento.lote}', 
                      '${vencimiento.fecha_vence}', ${loteId})`;

            await db.sql(vencimientoQuery);
          }
        }

        await db.sql(`
          UPDATE articulos
          SET ar_ubicacicion = ${detalle.ubicacion},
              ar_sububicacion = ${detalle.sububicacion}
          WHERE ar_codigo = ${detalle.idArticulo}
        `);
      }

      // Confirma la transacción
      await db.sql("COMMIT");

      return inventarioId;
    } catch (err) {
      console.error("Error al insertar inventario:", err);

      // Revertir transacción en caso de error
      await db.sql("ROLLBACK");
      throw err;
    }
  }

  async function insertarItemInventarioConVencimiento(consulta) {
    const { inventario, inventario_items } = consulta;

    try {
      if (
        !inventario ||
        !inventario_items ||
        !Array.isArray(inventario_items)
      ) {
        throw new Error("Datos de inventario inválidos");
      }

      // Obtener el primer item del array
      const item = inventario_items[0];

      console.log("Item a actualizar:", item);

      // Inicia la transacción
      await db.sql("START TRANSACTION");

      // Corregir la sintaxis del UPDATE - quitar AND y usar comas
      if (item.color && item.talle) {
        const updateLoteQuery = `
            UPDATE articulos_lotes
            SET al_cantidad = ${item.cantidad},
                al_color = ${item.color},
                al_talle = ${item.talle},
                al_codbarra = ${item.codbarra}
            WHERE al_codigo = ${item.idLote}
            AND al_articulo = ${item.idArticulo}
            AND al_deposito = ${inventario.deposito}
        `;

        console.log("Query para actualizar lote:", updateLoteQuery);
        await db.sql(updateLoteQuery);
      } else if (item.color) {
        const updateLoteQuery = `
            UPDATE articulos_lotes
            SET al_cantidad = ${item.cantidad},
                al_color = ${item.color},
                al_codbarra = ${item.codbarra}
              
            WHERE al_codigo = ${item.idLote}
            AND al_articulo = ${item.idArticulo}
            AND al_deposito = ${inventario.deposito}
        `;

        console.log("Query para actualizar lote:", updateLoteQuery);
        await db.sql(updateLoteQuery);
      } else if (item.talle) {
        const updateLoteQuery = `
            UPDATE articulos_lotes
            SET al_cantidad = ${item.cantidad},
                al_talle = ${item.talle}
            WHERE al_codigo = ${item.idLote}
        `;
      } else {
        const updateLoteQuery = `
            UPDATE articulos_lotes
            SET al_cantidad = ${item.cantidad},
                al_codbarra = ${item.codbarra}
            WHERE al_codigo = ${item.idLote}
            AND al_articulo = ${item.idArticulo}
            AND al_deposito = ${inventario.deposito}
        `;

        console.log("Query para actualizar lote:", updateLoteQuery);
        await db.sql(updateLoteQuery);
      }

      const updateArticuloQuery = `
            UPDATE articulos
            SET ar_ubicacicion = ${item.ubicacion},
                ar_sububicacion = ${item.sububicacion},
                ar_codbarra = ${item.codbarra}
            WHERE ar_codigo = ${item.idArticulo}
        `;

      console.log("Query para actualizar articulo:", updateArticuloQuery);
      await db.sql(updateArticuloQuery);

      await db.sql("COMMIT");
    } catch (err) {
      console.error("Error al insertar inventario:", err);
      await db.sql("ROLLBACK");
      throw err;
    }
  }

  async function insertar_reconteo(datos) {
    try {
      const { id_articulo, id_lote, nro_lote, segunda_cantidad } = datos;

      console.log("Datos recibidos para reconteo:", datos);

      const query = `
        SELECT
        ii.id, iiv.i_lote as nro_lote, iiv.loteid as id_lote, ii.idArticulo as id_articulo, ii.stock_actual as cdad_conteo_1
        FROM inventarios_items ii
        INNER JOIN inventario_items_vencimiento iiv ON ii.id = iiv.i_inventario_item
        WHERE ii.idArticulo = ${id_articulo} AND iiv.loteid = ${id_lote} AND iiv.i_lote = '${nro_lote}'
        ORDER BY ii.id DESC
      `;
      console.log("Query para obtener id de inventario_item:", query);
      const result = await db.sql(query);
      console.log("Resultado de la consulta:", result);

      const id_inventario_item = result[0].id;

      const updateQuery = `
      UPDATE inventarios_items
      SET segundo_conteo = ${segunda_cantidad}
      WHERE id = ${id_inventario_item}
      `;
      await db.sql(updateQuery);

      const inventarioQuery = `
      SELECT inventario
      FROM inventarios_items
      WHERE id = ${id_inventario_item}
      `;
      const inventario = await db.sql(inventarioQuery);

      const idInventario = inventario[0].inventario;

      const updateInventarioQuery = `
      UPDATE inventarios
      SET inicio_fecha_reconteo = NOW()
      WHERE id = ${idInventario}
      `;
      await db.sql(updateInventarioQuery);
    } catch (err) {
      console.error("Error al insertar reconteo:", err);
      throw err;
    }
  }

  async function insertarItemConteoScanner(datos) {
    console.log("Datos recibidos para insertar item de conteo scanner:", datos);
    const { id_articulo, cantidad, lote, lote_id, fecha_vencimiento } = datos;
    try {
      const inventario_id_query = `
      SELECT id FROM inventarios ORDER BY id DESC LIMIT 1
      `;
      const inventario_id_result = await db.sql(inventario_id_query);
      const inventario_id = inventario_id_result[0].id;

      const inventario_item_query = `
        INSERT INTO inventarios_items (idArticulo, cantidad, costo, inventario, stock_actual, stock_dif, segundo_conteo, scanner)
        VALUES (${id_articulo}, ${cantidad}, 0.00, ${inventario_id}, 0, 0, 0, 1)
      `;
      const inventario_item_result = await db.sql(inventario_item_query);
      const inventario_item_id = inventario_item_result.insertId; // Cambio aquí: usar .insertId

      const inventario_item_vencimiento_query = `
        INSERT INTO inventario_items_vencimiento (i_inventario_item, i_lote, i_fecha_vence, loteid)
        VALUES (${inventario_item_id}, '${lote}', '${fecha_vencimiento}', ${lote_id})
      `;
      await db.sql(inventario_item_vencimiento_query);
    } catch (error) {
      console.error("Error al insertar item de conteo scanner:", error);
      throw error;
    }
  }

  async function reporte_reconteo({
    marca,
    deposito,
    categoria,
    proveedor,
  } = {}) {
    const marcaFiltro = marca ? ` AND ar.ar_marca = ${marca}` : "";
    const depositoFiltro = deposito ? ` AND al.al_deposito = ${deposito}` : "";
    const categoriaFiltro =
      categoria != 0 ? ` AND ca.ca_codigo = ${categoria}` : "";
    const proveedorFiltro = proveedor ? ` AND p.pro_codigo = ${proveedor}` : "";

    const query = `
        SELECT 
            ii.id,
            ar.ar_codbarra as codigobarra,
            al.al_codigo as codigo,
            ar.ar_descripcion as nombre,
            al.al_lote as lote,
            al.al_cantidad as primer_conteo,
            ii.segundo_conteo,
            i.inicio_fecha_reconteo,
            al.al_vencimiento as vencimiento,
            i.fecha,
            (ii.segundo_conteo - al.al_cantidad) as diferencia,
            dep.dep_descripcion as deposito,
            ma.ma_descripcion as marca,
            op.op_nombre as operador,
            ca.ca_codigo as categoria_id,
            ca.ca_descripcion as categoria,
            p.pro_codigo as proveedor_id,
            p.pro_razon as proveedor
        FROM inventarios_items ii
        INNER JOIN inventario_items_vencimiento iiv ON ii.id = iiv.i_inventario_item
        INNER JOIN articulos_lotes al ON iiv.loteid = al.al_codigo
        INNER JOIN articulos ar ON ii.idArticulo = ar.ar_codigo
        INNER JOIN inventarios i ON ii.inventario = i.id
        INNER JOIN depositos dep on al.al_deposito = dep.dep_codigo
        INNER JOIN marcas ma ON ar.ar_marca = ma.ma_codigo
        INNER JOIN operadores op ON i.operador = op.op_codigo
        INNER JOIN subcategorias sc ON ar.ar_subcategoria= sc.sc_codigo
        INNER JOIN categorias ca ON sc.sc_categoria = ca.ca_codigo
        LEFT JOIN articulos_proveedores ap ON ar.ar_codigo = ap.arprove_articulo
        LEFT JOIN proveedores p ON ap.arprove_prove = p.pro_codigo
        WHERE i.fecha BETWEEN '2024-12-19' AND NOW()
        AND ii.segundo_conteo > 0
        ${marcaFiltro}
        ${depositoFiltro}
        ${categoriaFiltro}
        ${proveedorFiltro}
        GROUP BY ii.id
        ORDER BY ii.id DESC
    `;

    console.log("Query para reporte de reconteo:", query);
    console.log("Resultados:", await db.sql(query));
    return db.sql(query);
  }

  async function categoriasArticulos() {
    const query = `
      SELECT
        ca.ca_codigo as id,
        ca.ca_descripcion as nombre,
        (
          SELECT COUNT(*)
          FROM articulos ar
          INNER JOIN subcategorias sc2 ON ar.ar_subcategoria = sc2.sc_codigo
          WHERE sc2.sc_categoria = ca.ca_codigo
          AND ar.ar_estado = 1
        ) as cantidad_articulos
      FROM categorias ca
      WHERE ca.ca_estado = 1
      ORDER BY ca.ca_descripcion
    `;
    return db.sql(query);
  }

  async function marcasArticulos() {
    const query = `
      SELECT
        ma.ma_codigo as id,
        ma.ma_descripcion as nombre,
        (
          SELECT COUNT(*)
          FROM articulos ar
          WHERE ar.ar_marca = ma.ma_codigo
          AND ar.ar_estado = 1
        ) as cantidad_articulos
      FROM marcas ma
      WHERE ma.ma_estado = 1
      ORDER BY ma.ma_descripcion
    `;
    return db.sql(query);
  }

  async function seccionesArticulos() {
    const query = `
      SELECT
        s.s_codigo as id,
        s.s_descripcion as nombre,
        (
          SELECT COUNT(*)
          FROM articulos ar
          WHERE ar.ar_seccion = s.s_codigo
          AND ar.ar_estado = 1
        ) as cantidad_articulos
      FROM secciones s
      WHERE s.s_estado = 1
      ORDER BY s.s_descripcion
    `;
    return db.sql(query);
  }

  const inventariosDisponibles = async (estado = 0, deposito) => {
    console.log("estado", estado);
    console.log("deposito", deposito);
    let estado_query = "";
    let deposito_query = "";
    if (estado == 0) {
      estado_query = "inventario_auxiliar.estado = 0";
    } else if (estado == 1) {
      estado_query =
        "inventario_auxiliar.autorizado = 0 and inventario_auxiliar.estado = 1";
    }

    if (deposito) {
      deposito_query = `AND deposito = ${deposito}
`;
    }

    const query = `
      SELECT DISTINCT 
      inventario_auxiliar.id as id_inventario,
      inventario_auxiliar.nro_inventario as id,
       inventario_auxiliar.fecha,
       dep.dep_descripcion as deposito,
       suc.descripcion as sucursal
      FROM inventario_auxiliar
      INNER JOIN depositos dep ON inventario_auxiliar.deposito = dep.dep_codigo
      INNER JOIN sucursales suc ON inventario_auxiliar.sucursal = suc.id
      WHERE ${estado_query} ${deposito_query}
      ORDER BY id DESC 
    `;

    console.log("query", query);
    return db.sql(query);
  };

  const anularInventarioAuxiliar = async (id) => {
    // Primero verificamos el estado del inventario
    const checkQuery = `SELECT estado FROM inventario_auxiliar WHERE id = ${id}`;
    const [inventario] = await db.sql(checkQuery);

    if (!inventario) {
      throw new Error("Inventario no encontrado");
    }

    if (inventario.estado === 1) {
      throw new Error("No se puede anular un inventario que ya está cerrado");
    }

    // Si el estado es 0 (en curso), procedemos a anularlo
    const query = `UPDATE inventario_auxiliar SET estado = 2, nro_inventario = 0 WHERE id = ${id} AND estado = 0`;
    console.log("Query de anulación:", query);
    const result = await db.sql(query);

    if (result.affectedRows === 0) {
      throw new Error("No se pudo anular el inventario");
    }

    return result;
  };

  async function reporte_inventario() {
    const query = `
      SELECT
        i.id_articulo,
        i.id_lote,
        ar.ar_descripcion as descripcion,
        ar.ar_cod_interno as cod_ref,
        al.al_codbarra as codigo_barra,
        i.cantidad_inicial,
        i.cantidad_scanner,
        al.al_cantidad as cantidad_actual,
        ca.ca_codigo,
        ca.ca_descripcion,
        sc.sc_codigo,
        sc.sc_descripcion,
        FORMAT(ar.ar_pcg, 0, 'de_DE') as precio_compra,
        FORMAT(ar.ar_pvg, 0, 'de_DE') as precio_venta,
        COALESCE(i.cantidad_scanner, 0) - i.cantidad_inicial as diferencia,
        CASE 
          WHEN COALESCE(i.cantidad_scanner, 0) - i.cantidad_inicial > 0 THEN 'GANANCIA'
          WHEN COALESCE(i.cantidad_scanner, 0) - i.cantidad_inicial < 0 THEN 'PERDIDA'
          ELSE 'SIN CAMBIO'
        END as tipo_diferencia,
        FORMAT((COALESCE(i.cantidad_scanner, 0) - i.cantidad_inicial) * ar.ar_pcg, 0, 'de_DE') as valor_diferencia
      FROM inventario_auxiliar_items i
      INNER JOIN articulos ar ON i.id_articulo = ar.ar_codigo
      INNER JOIN articulos_lotes al ON i.id_lote = al.al_codigo
      INNER JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
      INNER JOIN categorias ca ON sc.sc_categoria = ca.ca_codigo
      WHERE ca.ca_codigo not in (1)
      AND (
          (i.cantidad_scanner IS NOT NULL AND i.cantidad_scanner != i.cantidad_inicial)
          OR
          (i.cantidad_scanner IS NULL AND i.cantidad_inicial != 0)
      )
      ORDER BY ca.ca_codigo ASC;
    `;
    return db.sql(query);
  }

    const getArticulosEnPedidos = async (articulo_id, id_lote) => {
      const query = `
    (SELECT
      dp.dp_codigo as id_detalle_pedido,
      date_format(p.p_fecha, '%d/%m/%Y') as fecha,
      cli.cli_razon as cliente,
      dp.dp_cantidad as cantidad,
      0 as tipo
    FROM detalle_pedido dp
    INNER JOIN pedidos p ON dp.dp_pedido = p.p_codigo
    INNER JOIN clientes cli ON p.p_cliente = cli.cli_codigo
    WHERE dp.dp_articulo = ${articulo_id}
    AND dp.dp_codigolote = ${id_lote}
    AND p.p_estado = 1
    AND dp.dp_habilitar = 1)
    
    UNION ALL
    
    (SELECT
      ri.id as id_detalle_pedido,
      date_format(r.fecha, '%d/%m/%Y') as fecha,
      cli.cli_razon as cliente,
      ri.cantidad as cantidad,
      1 as tipo
    FROM remisiones_items ri
    INNER JOIN remisiones r ON ri.remision = r.id
    INNER JOIN clientes cli ON r.cliente = cli.cli_codigo
    WHERE ri.articulo = ${articulo_id}
    AND ri.codlote = ${id_lote}
    AND r.estado = 1
    AND r.tipo_estados = 0
    ORDER BY r.id DESC)`;
    const result = await db.sql(query);
    console.log("result", result);
    return result;
    };

  return {
    todos,
    todosDirecta,
    uno,
    barra,
    listar_por_barra,
    informe_stock,
    resumen_comprasventas,
    enPedidoRemision,
    ver_lotes_talle,
    insertarInventario,
    insertarItemInventario,
    insertarItemInventarioConVencimiento,
    nroUltimoInventario,
    insertarArticulo,
    traerTodosLosArticulos,
    insertar_reconteo,
    reporte_reconteo,
    todosNuevo,
    categoriasArticulos,
    itemTomaInventario,
    itemTomaInventarioScanner,
    insertarItemConteoScanner,
    marcasArticulos,
    insertarInventarioAuxiliar,
    insertarConteoScanner,
    ultimoInventarioAuxiliar,
    insertarInventarioAuxiliarItems,
    cerrarInventarioAuxiliar,
    mostrarItemsDelInventarioAuxiliar,
    scannearItemInventarioAuxiliar,
    mostrarItemsDelInventarioAuxiliarPrincipal,
    reporteDeAnomalias,
    consultaArticulosSimplificado,
    inventariosDisponibles,
    anularInventarioAuxiliar,
    seccionesArticulos,
    reporte_inventario,
    buscarArticulos,
    getArticulosEnPedidos
  };
};
