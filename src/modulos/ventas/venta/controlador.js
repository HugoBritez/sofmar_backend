const CABECERA_VENTA = "ventas";
const DETALLES_VENTA = "detalle_ventas";
const DETALLE_VENTAS_CUOTA = "detalle_ventas_cuota";
const LOTE = "detalle_ventas_vencimiento";
const CABECERA_ASIENTO = "asiento_contable";
const DETALLES_ASIENTO = "detalle_asiento_contable";
const DESCRIPCIONES_EDITADAS = "detalle_articulos_editado";
const os = require("os");

// importante importar 'os' para extraer el nombre del dispositivo desde el que se carga la venta###

module.exports = function (dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require("../../../DB/mysql.js");
  }

  function uno(cod) {
    const primary_key = `ve_codigo = ${cod} `;
    const campos =
      " *, DATE_FORMAT(ve_fecha, '%Y-%m-%d') AS fecha, DATE_FORMAT(ve_vencimiento, '%Y-%m-%d') AS vencimiento ";
    return db.uno(CABECERA_VENTA, primary_key, campos);
  }

  function consultaRuteo(datos) {
    const clienteId = datos.clienteId;
    const vendedorId = datos.vendedorId;

    const query = `
    SELECT
    ve.ve_codigo,
    ve.ve_fecha,
    ve.ve_hora,
    ve.ve_total,
    deve.deve_cantidad,
    deve.deve_precio,
    ar.ar_descripcion
    FROM detalle_ventas deve
    INNER JOIN ventas ve ON deve.deve_venta = ve.ve_codigo
    INNER JOIN articulos ar ON ar.ar_codigo = deve.deve_articulo
    WHERE ve.ve_cliente = ${clienteId} AND ve.ve_operador = ${vendedorId}
    ORDER BY ve.ve_codigo DESC
    LIMIT 3
    `;
    return db.sql(query);
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
    venta,
    estadoVenta,
    remisiones,
    listarFacturasSinCDC,
    page = 1,
    itemsPorPagina = 50
  ) {
    let where = "1 = 1 ";
    let limitOffset = "";

    // Si hay factura o venta, ignorar otros filtros y no usar paginación
    if (factura && factura.length > 0) {
      where = `(ve.ve_factura = '${factura}' OR vl.ve_factura = '${factura}')`;
    } else if (venta && venta.toString().length > 0 && venta !== "") {
      console.log(venta);
      where = `ve.ve_codigo = ${venta}`;
    } else {
      // Aplicar filtros y paginación solo si no hay factura ni venta
      if (fecha_desde) where += ` AND ve.ve_fecha >= '${fecha_desde}'`;
      if (fecha_hasta) where += ` AND ve.ve_fecha <= '${fecha_hasta}'`;
      if (sucursal) where += ` AND ve.ve_sucursal = '${sucursal}'`;
      if (cliente) where += ` AND ve.ve_cliente = '${cliente}'`;
      if (vendedor) where += ` AND ve.ve_operador = '${vendedor}'`;
      if (articulo)
        where += ` AND ve.ve_codigo IN (SELECT z.deve_venta FROM detalle_ventas z WHERE deve_articulo = ${articulo})`;
      if (moneda) where += ` AND ve.ve_moneda = ${moneda}`;
      if (estadoVenta === 0) where += ` AND ve.ve_total = ve.ve_saldo`;
      if (estadoVenta === 1) where += ` AND ve.ve_total > ve.ve_saldo`;
      if (estadoVenta === 2) where += ` AND ve.ve_estado = 0`;
      if (estadoVenta === 3) where += ` AND ve.ve_estado = 1`;
      if (remisiones === true) where += ` AND ve.ve_estado = 0`;
      if (listarFacturasSinCDC === true)
        where += ` AND (ve.ve_cdc = '' OR ve.ve_cdc IS NULL)`;
      const offset = (page - 1) * itemsPorPagina;
      limitOffset = `LIMIT ${itemsPorPagina} OFFSET ${offset}`;
    }
    let query = `SELECT
                    ve.ve_codigo AS codigo,
                    cli.cli_codigo AS codcliente,
                    cli.cli_razon AS cliente,
                    ve.ve_moneda AS moneda_id,
                    mo.mo_descripcion AS moneda,
                    CONCAT(DATE_FORMAT(ve.ve_fecha, "%Y-%m-%d"), ' : ' , ve.ve_hora) AS fecha,
                    v.op_nombre AS vendedor,
                    o.op_nombre AS operador,
                    FORMAT(FLOOR(ve.ve_total), 0, 'es_ES') AS total,
                    FORMAT(FLOOR(ve.ve_descuento), 0, 'es_ES') AS descuento, 
                    FORMAT(FLOOR(ve.ve_saldo), 0, 'es_ES') AS saldo,
                    IF(ve.ve_credito = 1, "Crédito", "Contado") AS condicion,
                    IF(ve.ve_vencimiento="0001-01-01", "0000-00-00", date_format(ve.ve_vencimiento, "%Y/%m/%d")) AS vencimiento,
                    IFNULL(IF(ve.ve_factura <> '', ve.ve_factura, vl.ve_factura),'') AS factura,
                    ve.ve_obs AS obs,
                    ve.ve_estado AS estado,
                    IF(ve.ve_estado = 1, "Activo", "Anulado") AS estado_desc,
                    av.obs as obs_anulacion,
                    ve.ve_timbrado AS timbrado,
                    ve.ve_userpc as terminal,
                    dep.dep_descripcion AS deposito,
                    -- Agregamos los totales de detalles
                    (SELECT FORMAT(FLOOR(SUM(d.deve_cantidad)), 0, 'es_ES') 
                     FROM detalle_ventas d 
                     WHERE d.deve_venta = ve.ve_codigo) AS total_articulos,
                    (SELECT FORMAT(FLOOR(SUM(d.deve_exentas)), 0, 'es_ES')
                     FROM detalle_ventas d 
                     WHERE d.deve_venta = ve.ve_codigo) AS exentas_total,
                    (SELECT FORMAT(FLOOR(SUM(d.deve_cinco)), 0, 'es_ES')
                     FROM detalle_ventas d 
                     WHERE d.deve_venta = ve.ve_codigo) AS iva5_total,
                    (SELECT FORMAT(FLOOR(SUM(d.deve_diez)), 0, 'es_ES')
                     FROM detalle_ventas d 
                     WHERE d.deve_venta = ve.ve_codigo) AS iva10_total,
                    (SELECT FORMAT(FLOOR(SUM(d.deve_exentas + d.deve_cinco + d.deve_diez)), 0, 'es_ES')
                     FROM detalle_ventas d 
                     WHERE d.deve_venta = ve.ve_codigo) AS sub_total,
                    (SELECT FORMAT(FLOOR(SUM(d.deve_descuento)), 0, 'es_ES')
                     FROM detalle_ventas d 
                     WHERE d.deve_venta = ve.ve_codigo) AS descuento_total,
                     ve.ve_cdc,
                     SUBSTRING_INDEX(SUBSTRING_INDEX(ve.ve_factura, '-', 1), '-', -1) AS establecimiento,
                     SUBSTRING_INDEX(SUBSTRING_INDEX(ve.ve_factura, '-', 2), '-', -1) AS punto_emision,
                     SUBSTRING_INDEX(ve.ve_factura, '-', -1) AS numero_factura,

                     cli.cli_ruc as cliente_ruc,
                     cli.cli_tipo_doc as tipo_documento,
                     cli.cli_descripcion as cliente_descripcion,
                     cli.cli_dir as cliente_direccion,
                     cli.cli_ciudad as ciudad_id,
                     ciu.ciu_descripcion as ciudad_descripcion,
                     ciu.ciu_distrito as distrito_id,
                     dis.d_descripcion as distrito_descripcion,
                     dis.d_departamento as departamento_id,
                     departamento.dep_descripcion as departamento_descripcion,
                     cli.cli_tel as cliente_telefono,
                     cli.cli_mail as cliente_email,
                     cli.cli_interno as cliente_codigo_interno,
                     o.op_nombre as operador_nombre,
                     o.op_documento as operador_documento,
                     ve.ve_cantCuotas as cant_cuotas

                  FROM
                    ventas ve
                    INNER JOIN clientes cli ON ve.ve_cliente = cli.cli_codigo
                    INNER JOIN monedas mo ON ve.ve_moneda = mo.mo_codigo
                    INNER JOIN operadores v ON ve.ve_vendedor = v.op_codigo
                    INNER JOIN operadores o ON ve.ve_operador = o.op_codigo
                    INNER JOIN sucursales s ON ve.ve_sucursal = s.id
                    INNER JOIN depositos dep ON ve.ve_deposito = dep.dep_codigo
                    LEFT JOIN venta_vental vvl ON vvl.v_venta = ve.ve_codigo
                    LEFT JOIN ventasl vl ON vvl.v_vental = vl.ve_codigo
                    LEFT JOIN anulacionventa av ON ve.ve_codigo = av.venta
                    LEFT JOIN ciudades ciu ON cli.cli_ciudad = ciu.ciu_codigo
                    LEFT JOIN distritos dis ON dis.d_codigo = ciu.ciu_distrito
                    LEFT JOIN departamentos departamento ON dis.d_departamento = departamento.dep_codigo
                  WHERE
                    ${where}
                  ORDER BY ve.ve_codigo DESC
${limitOffset} `;
    console.log(query);
    return db.sql(query);
  }

  function modificar(
    codigo,
    credito,
    fecha,
    vencimiento,
    factura,
    timbrado,
    sucursal,
    obs
  ) {
    let query = `UPDATE ventas SET ve_credito = ${credito}, ve_fecha = '${fecha}', ve_vencimiento = '${vencimiento}', ve_factura = '${factura}', ve_timbrado = '${timbrado}', ve_sucursal = ${sucursal}, ve_obs = '${obs}'
                  WHERE ve_codigo = ${codigo}`;

    return db.sql(query);
  }

  function getDetalles(venta) {
    let query = `SELECT
                    deve.deve_codigo AS det_codigo,
                    ar.ar_codigo AS art_codigo,
                    ar.ar_codbarra AS codbarra,
                    ar.ar_descripcion AS descripcion,
                    FORMAT(FLOOR(deve.deve_cantidad), 0, 'es_ES') AS cantidad,
                    FORMAT(FLOOR(deve.deve_precio), 0, 'es_ES') AS precio,
                    deve.deve_precio as precio_number,
                    FORMAT(FLOOR(deve.deve_descuento), 0, 'es_ES') AS descuento,
                    deve.deve_descuento as descuento_number,
                    FORMAT(FLOOR(deve.deve_exentas), 0, 'es_ES') AS exentas,
                    deve.deve_exentas as exentas_number,
                    FORMAT(FLOOR(deve.deve_cinco), 0, 'es_ES') AS cinco,
                    deve.deve_cinco as cinco_number,
                    FORMAT(FLOOR(deve.deve_diez), 0, 'es_ES') AS diez,
                    deve.deve_diez as diez_number,
                    al.al_lote AS lote,
                    DATE_FORMAT(al.al_vencimiento, '%Y-%m-%d') AS vencimiento,
                    m.m_largo AS largura,
                    m.m_altura AS altura,
                    m.m_mt2 AS mt2,
                    COALESCE(dae.a_descripcion, '') AS descripcion_editada,
                    ar.ar_kilos AS kilos,
                    um.um_cod_set as unidad_medida
                  FROM
                    detalle_ventas deve
                    LEFT JOIN articulos ar ON ar.ar_codigo = deve.deve_articulo
                    LEFT JOIN detalle_ventas_vencimiento dvv ON dvv.id_detalle_venta = deve.deve_codigo
                    LEFT JOIN articulos_lotes al ON al.al_codigo = dvv.loteid
                    LEFT JOIN detalle_articulo_mt2 m ON m.m_detalle_venta = deve.deve_codigo
                    LEFT JOIN detalle_articulos_editado dae ON deve.deve_codigo = dae.a_detalle_venta
                    LEFT JOIN unidadmedidas um ON um.um_codigo = ar.ar_unidadmedida
                  WHERE
                    deve.deve_venta = ${venta}
                  ORDER BY
                    deve.deve_codigo`;
    return db.sql(query);
  }

  function getDetallesCliente(
    fecha_desde,
    fecha_hasta,
    cliente,
    articulo_busqueda
  ) {
    let where_fecha_desde = "";
    let where_fecha_hasta = "";
    let where_articulo = "";

    if (fecha_desde) {
      where_fecha_desde = `AND ve.ve_fecha >= '${fecha_desde}'`;
    }
    if (fecha_hasta) {
      where_fecha_hasta = `AND ve.ve_fecha <= '${fecha_hasta}'`;
    }
    if (articulo_busqueda) {
      where_articulo = `AND (ar.ar_descripcion LIKE '%${articulo_busqueda}%' OR ar.ar_codigo LIKE '%${articulo_busqueda}%')`;
    }

    let query = `SELECT
                    DATE_FORMAT(ve.ve_fecha, '%Y-%m-%d') AS fecha,
                    ve.ve_factura AS factura,
                    deve.deve_codigo AS det_codigo,
                    ar.ar_codigo AS art_codigo,
                    ar.ar_codbarra AS codbarra,
                    ar.ar_descripcion AS descripcion,
                    deve.deve_cantidad AS cantidad,
                    deve.deve_exentas + deve.deve_cinco + deve.deve_diez - deve.deve_descuento AS precio,
                    (deve.deve_exentas + deve.deve_cinco + deve.deve_diez - deve.deve_descuento) * deve.deve_cantidad AS total
                  FROM
                    detalle_ventas deve
                    INNER JOIN ventas ve ON deve.deve_venta = ve.ve_codigo
                    INNER JOIN articulos ar ON ar.ar_codigo = deve.deve_articulo
                  WHERE
                    ve.ve_cliente = ${cliente}
                    ${where_fecha_desde}
                    ${where_fecha_hasta}
                    ${where_articulo}
                  ORDER BY
                    deve.deve_codigo`;

    return db.sql(query);
  }

  async function calcularTotalesInforme(
    fecha_desde,
    fecha_hasta,
    hora_inicio,
    hora_fin,
    sucursales,
    depositos,
    clientes,
    vendedores,
    articulos,
    tipos_articulo,
    marcas,
    categorias,
    subcategorias,
    ciudades,
    talles,
    condiciones,
    situaciones,
    movimientos,
    secciones,
    moneda,
    tipo_valorizacion,
    buscar_codigo,
    buscar_factura,
    calculo_promedio,
    aplica_nc,
    orden,
    desglosado_iva,
    desglosado_factura,
    agrupar_fecha,
    totalizar_grid,
    bonificacion,
    ncfechaVentas
  ) {
    try {
      // 1. Query principal para ventas
      let fecha1Comparacion = fecha_desde;
      let fecha2Comparacion = fecha_hasta;
      if (calculo_promedio) {
        fecha1Comparacion = "2010-01-01";
      }

      // Determinar campo de costo según moneda
      let campocosto;
      switch (moneda) {
        case 0: //Guaraníes
          campocosto = "ar.ar_pcg";
          break;
        case 2: //Dólares
          campocosto = "ar.ar_pcd";
          break;
        case 3: //Real
          campocosto = "ar.ar_pcr";
          break;
        case 4: //Peso
          campocosto = "ar.ar_pcp";
          break;
        default:
          campocosto = "ar.ar_pcg"; // valor por defecto
      }

      // Construir queries para costos y fórmulas
      const ultimcostocompra = `
      IFNULL(
        (SELECT (dc.dc_precio + dc.dc_recargo) 
         FROM detalle_compras dc 
         INNER JOIN compras c ON dc.dc_compra = c.co_codigo 
         WHERE c.co_estado = 1
         AND dc.dc_articulo = deve.deve_articulo
         AND c.co_moneda = ve.ve_moneda
         ORDER BY dc.dc_id DESC 
         LIMIT 1),
        (SELECT ${campocosto} FROM articulos WHERE ar_codigo = deve.deve_articulo)
      )
    `;

      const comandosqlauxot = `
      (SELECT 
        IF(l.ar_unidadmedida < 4, 
          SUM(b.d_cantidad * b.d_costo_uni), 
          IF(l.ar_unidadmedida > 3, 
            SUM(b.d_cant_m2 * b.d_costo_uni), 
            0
          )
        ) AS sutotal 
       FROM detalle_orden_trabajos_art b 
       INNER JOIN orden_trabajos o ON b.d_orden = o.o_codigo 
       INNER JOIN articulos l ON b.d_articulo = l.ar_codigo 
       INNER JOIN detalle_ventas t ON o.o_codigo = t.deve_codioot 
       WHERE o.o_estado = 1 
       AND t.deve_venta = deve.deve_venta
       AND o.o_codigo = t.deve_codioot
       AND o.o_moneda = ve.ve_moneda
      )
    `;

      const ultimocostoformula = `
      (SELECT 
        IF(f.f_cant_producir = 0, 
          (f.f_costo), 
          (f.f_costo) / f.f_cant_producir
        ) AS costo 
       FROM p_formula_produccion f 
       WHERE f.f_articulo = deve.deve_articulo 
       AND f.f_estado = 1 
       ORDER BY f.f_codigo DESC 
       LIMIT 1
      )
    `;

      // Query principal para ventas con todos los cálculos
      let queryVentas = `
      SELECT 
        SUM(deve.deve_cantidad) as cantidad_vendida,
        SUM(deve.deve_exentas) as exentas,
        SUM(deve.deve_cinco) as iva5_total,
        SUM(deve.deve_diez) as iva10_total,
        SUM(deve.deve_exentas + deve.deve_cinco + deve.deve_diez) as sub_total,
        SUM(deve.deve_descuento) as descuento_items,
        SUM(ve.ve_descuento) as descuento_factura,
        SUM(
          CASE 
            WHEN ar.ar_servicio = 1 THEN ${ultimcostocompra} * deve.deve_cantidad
            WHEN ar.ar_servicio = 2 THEN COALESCE(${comandosqlauxot}, 0)
            WHEN ar.ar_servicio = 3 THEN COALESCE(${ultimocostoformula} * deve.deve_cantidad, 0)
            ELSE ${ultimcostocompra} * deve.deve_cantidad
          END
        ) as costo_total,
        SUM(
          CASE 
            WHEN ar.ar_unidadmedida > 3 THEN deve.deve_cantidad * ar.ar_costo_mt2
            ELSE deve.deve_cantidad
          END
        ) as cantidad_real
      FROM ventas ve
      INNER JOIN detalle_ventas deve ON deve.deve_venta = ve.ve_codigo
      INNER JOIN articulos ar ON ar.ar_codigo = deve.deve_articulo
      LEFT JOIN clientes cli ON cli.cli_codigo = ve.ve_cliente
      LEFT JOIN operadores op ON ve.ve_vendedor = op.op_codigo
      LEFT JOIN depositos dep ON ve.ve_deposito = dep.dep_codigo
      LEFT JOIN ciudades ciu ON cli.cli_ciudad = ciu.ciu_codigo
      LEFT JOIN marcas ma ON ar.ar_marca = ma.ma_codigo
      LEFT JOIN subcategorias sc ON ar.ar_subcategoria = sc.sc_codigo
      LEFT JOIN categorias cat ON cat.ca_codigo = sc.sc_categoria
      LEFT JOIN detalle_ventas_vencimiento dvv ON dvv.id_detalle_venta = deve.deve_codigo
      LEFT JOIN articulos_lotes al ON al.al_codigo = dvv.loteid
      WHERE ve.ve_estado = 1
    `;

      // Query para bonificaciones si está habilitado
      let queryBonificaciones = "";
      if (bonificacion) {
        queryBonificaciones = `
        SELECT 
          SUM(db.db_cantidad) as cantidad_bonificada,
          SUM(db.db_exentas + db.db_cinco + db.db_diez) as total_bonificacion
        FROM detalle_bonificacion db
        INNER JOIN bonificacion b ON db.db_bonificacion = b.bo_codigo
        WHERE b.bo_estado = 1
        AND b.bo_moneda = ${moneda === 0 ? 1 : moneda}
      `;
      }

      let queryNCSinItems = `
      SELECT 
        ${
          desglosado_iva
            ? `IFNULL(SUM(ndec.nc_monto)-(SUM(ndec.nc_monto)/11),0)`
            : `IFNULL(SUM(ndec.nc_monto),0)`
        } as montoncs
      FROM notadecredito ndec 
      INNER JOIN clientes c ON ndec.nc_cliente = c.cli_codigo 
      INNER JOIN ventas ve ON ndec.nc_venta = ve.ve_codigo
      WHERE ndec.nc_estado = 1 
      AND nc_concepto = 2 
      AND ndec.nc_codigo NOT IN (
        SELECT dnc1.denc_nc 
        FROM detalle_nc dnc1 
        WHERE dnc1.denc_nc = ndec.nc_codigo
      )
      AND ndec.nc_moneda = ${moneda === 0 ? 1 : moneda}
      AND ndec.nc_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'
    `;

      // 3. Query para notas de crédito con items
      let queryNC = `
      SELECT 
        ${
          desglosado_iva
            ? `IFNULL(CAST(SUM(dnc.denc_exentas) + 
           (SUM(dnc.denc_cinco) - (SUM(dnc.denc_cinco) / 21)) + 
           (SUM(IFNULL(dnc.denc_diez, nc_monto)) - 
           (SUM(IFNULL(dnc.denc_diez, nc_monto)) / 11)) AS DECIMAL(12,2)), 0)`
            : `IFNULL(SUM(dnc.denc_exentas + dnc.denc_cinco + dnc.denc_diez), 0)`
        } as montonc
      FROM notadecredito ndec 
      INNER JOIN detalle_nc dnc ON dnc.denc_nc = ndec.nc_codigo 
      INNER JOIN articulos an ON dnc.denc_articulo = an.ar_codigo 
      INNER JOIN subcategorias sc ON an.ar_subcategoria = sc.sc_codigo
      INNER JOIN clientes c ON ndec.nc_cliente = c.cli_codigo 
      INNER JOIN ventas ve ON ndec.nc_venta = ve.ve_codigo
      WHERE ndec.nc_estado = 1 
      AND nc_concepto < 4
      AND ndec.nc_moneda = ${moneda === 0 ? 1 : moneda}
      AND ndec.nc_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'
    `;

      let queryND = `
      SELECT 
        ${
          desglosado_iva
            ? `IFNULL(CAST(SUM(dnd.dnd_exentas) + 
           (SUM(dnd.dnd_cinco) - (SUM(dnd.dnd_cinco) / 21)) + 
           (SUM(IFNULL(dnd.dnd_diez, dnd.dnd_monto)) - 
           (SUM(IFNULL(dnd.dnd_diez, dnd.dnd_monto)) / 11)) AS DECIMAL(12,2)), 0)`
            : `IFNULL(SUM(dnd.dnd_exentas + dnd.dnd_cinco + dnd.dnd_diez), 0)`
        } as montond
      FROM notadevolucioncontado nd 
      INNER JOIN detalle_nd_contado dnd ON dnd.dnd_devolucion = nd.nd_codigo 
      INNER JOIN articulos an ON dnd.dnd_articulo = an.ar_codigo 
      INNER JOIN subcategorias sc ON an.ar_subcategoria = sc.sc_codigo
      INNER JOIN clientes c ON nd.nd_cliente = c.cli_codigo 
      INNER JOIN ventas ve ON nd.nd_venta = ve.ve_codigo
      WHERE nd.nd_estado = 1 
      AND nd.nd_moneda = ${moneda === 0 ? 1 : moneda}
      AND nd.nd_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'
    `;

      // Agregar filtros comunes
      const filtros = [];
      if (fecha_desde && fecha_hasta) {
        filtros.push(
          `ve.ve_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'`
        );
      }
      if (hora_inicio !== "00:00" || hora_fin !== "23:59") {
        filtros.push(`ve.ve_hora BETWEEN '${hora_inicio}' AND '${hora_fin}'`);
      }
      if (sucursales?.length) filtros.push(`ve.ve_sucursal IN (${sucursales})`);
      if (depositos?.length) filtros.push(`ve.ve_deposito IN (${depositos})`);
      if (clientes?.length) filtros.push(`ve.ve_cliente IN (${clientes})`);
      if (vendedores?.length) filtros.push(`ve.ve_vendedor IN (${vendedores})`);
      if (articulos?.length)
        filtros.push(`deve.deve_articulo IN (${articulos})`);
      if (tipos_articulo?.length)
        filtros.push(`ar.ar_servicio IN (${tipos_articulo})`);
      if (marcas?.length) filtros.push(`ar.ar_marca IN (${marcas})`);
      if (categorias?.length) filtros.push(`cat.ca_codigo IN (${categorias})`);
      if (subcategorias?.length)
        filtros.push(`ar.ar_subcategoria IN (${subcategorias})`);
      if (ciudades?.length) filtros.push(`cli.cli_ciudad IN (${ciudades})`);
      if (talles?.length) filtros.push(`al.al_talle IN (${talles})`);
      if (condiciones?.length)
        filtros.push(`ve.ve_credito IN (${condiciones})`);
      if (situaciones?.length) filtros.push(`ve.ve_estado IN (${situaciones})`);
      if (secciones?.length) filtros.push(`ar.ar_seccion IN (${secciones})`);
      if (moneda) filtros.push(`ve.ve_moneda = ${moneda}`);
      if (buscar_codigo > 0) filtros.push(`ve.ve_codigo = ${buscar_codigo}`);
      if (buscar_factura)
        filtros.push(`ve.ve_factura LIKE '%${buscar_factura}%'`);

      // Aplicar filtros a las queries
      if (filtros.length) {
        const whereClause = ` AND ${filtros.join(" AND ")}`;
        queryVentas += whereClause;
        if (queryBonificaciones) queryBonificaciones += whereClause;
      }

      // Agregar ordenamiento
      let orderBy = "";
      if (agrupar_fecha) {
        orderBy = totalizar_grid
          ? " ORDER BY ar.ar_descripcion"
          : " ORDER BY ve.ve_fecha ASC, ve.ve_codigo";
      } else if (desglosado_factura && clientes?.length) {
        orderBy =
          " ORDER BY cli.cli_razon, ve.ve_fecha DESC, ve.ve_codigo, ar.ar_descripcion";
      } else {
        orderBy = " ORDER BY ar.ar_descripcion";
      }
      orderBy += orden ? " ASC" : " DESC";

      queryVentas += orderBy;

      // Ejecutar todas las queries en paralelo
      const [
        totalesVenta,
        ncSinItems,
        notasCredito,
        notasDevolucion,
        bonificaciones,
      ] = await Promise.all([
        db.sql(queryVentas),
        db.sql(queryNCSinItems),
        db.sql(queryNC),
        db.sql(queryND),
        bonificacion
          ? db.sql(queryBonificaciones)
          : Promise.resolve([
              { cantidad_bonificada: 0, total_bonificacion: 0 },
            ]),
      ]);

      const totalNC =
        Number(ncSinItems[0]?.montoncs || 0) +
        Number(notasCredito[0]?.montonc || 0) +
        Number(notasDevolucion[0]?.montond || 0);

      // Calcular totales finales
      const resultado = {
        cantidad_vendida: totalesVenta[0]?.cantidad_vendida || 0,
        cantidad_real: totalesVenta[0]?.cantidad_real || 0,
        exentas: totalesVenta[0]?.exentas || 0,
        iva5_total: totalesVenta[0]?.iva5_total || 0,
        iva5_discriminado: desglosado_iva
          ? totalesVenta[0]?.iva5_total / 21
          : 0,
        iva10_total: totalesVenta[0]?.iva10_total || 0,
        iva10_discriminado: desglosado_iva
          ? totalesVenta[0]?.iva10_total / 11
          : 0,
        sub_total: totalesVenta[0]?.sub_total || 0,
        descuento_items: totalesVenta[0]?.descuento_items || 0,
        descuento_factura: totalesVenta[0]?.descuento_factura || 0,
        costo_total: totalesVenta[0]?.costo_total || 0,
        cantidad_bonificada: bonificaciones[0]?.cantidad_bonificada || 0,
        total_bonificacion: bonificaciones[0]?.total_bonificacion || 0,
        total_nc: totalNC,
        nc_sin_items: Number(ncSinItems[0]?.montoncs || 0),
        nc_con_items: Number(notasCredito[0]?.montonc || 0),
        notas_devolucion: Number(notasDevolucion[0]?.montond || 0),
        total_neto: 0,
        utilidad: 0,
        utilidad_porcentaje: 0,
      };

      // Calcular total neto
      resultado.total_neto =
        resultado.sub_total -
        resultado.total_nc -
        resultado.descuento_items -
        resultado.descuento_factura;

      resultado.utilidad = resultado.total_neto - resultado.costo_total;

      if (resultado.sub_total > 0) {
        resultado.utilidad_porcentaje =
          (resultado.utilidad / resultado.sub_total) * 100;
      }

      console.log("resultado", resultado);
      return resultado;
    } catch (error) {
      console.error("Error al calcular totales:", error);
      throw error;
    }
  }

  async function getResumen(
    fecha_desde,
    fecha_hasta,
    hora_inicio,
    hora_fin,
    sucursales,
    depositos,
    clientes,
    vendedores,
    articulos,
    tipos_articulo,
    marcas,
    categorias,
    subcategorias,
    ciudades,
    talles,
    condiciones,
    situaciones,
    movimientos,
    secciones,
    moneda,
    tipo_valorizacion,
    buscar_codigo,
    buscar_factura,
    calculo_promedio,
    aplica_nc,
    orden,
    desglosado_iva,
    desglosado_factura,
    agrupar_fecha,
    totalizar_grid,
    bonificacion,
    ncfechaVentas
  ) {
    let where = `WHERE 1=1`;
    let mordena = "";
    let mfecha = "";
    let ultimcostocompra = "";
    let comandosqlauxot = "";
    let ultimocostoformula = "";
    let ultimocostopromrecf = "";
    let ultimocostopromrecOrd = "";
    let costoservicio = "";
    let campospcosto = "";
    let camposprecios = "";
    let camposcinco = "";
    let camposcincoiva = "";
    let camposdiez = "";
    let camposdieziva = "";
    let camposubtotal = "";
    let campoivatotal = "";
    let campototalivas = "";
    let campocosto = "";
    let mgroupbyar = "";
    let innerjoinbonif = "";
    let fecha1Comparacion = fecha_desde;
    let fecha2Comparacion = fecha_hasta;
    let montoN1 = `0`;
    let montoN2 = `0`;
    let montoNC = `0`;

    if (calculo_promedio) {
      fecha1Comparacion = "2010-01-01";
    }

    switch (moneda) {
      case 0: //Guaraníes
        campocosto = "ar_pcg";
        break;
      case 2: //Dólares
        campocosto = "ar_pcd";
        break;
      case 3: //Real
        campocosto = "ar_pcr";
        break;
      case 4: //Peso
        campocosto = "ar_pcp";
        break;
    }

    //Construimos el WHERE
    if (fecha_desde.length > 0 && fecha_hasta.length > 0)
      where += ` AND v.ve_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'`;
    if (hora_inicio != "00:00" || hora_fin != "23:59")
      where += ` AND v.ve_hora BETWEEN '${hora_inicio}' AND '${hora_fin}'`;
    if (sucursales.length > 0) where += ` AND v.ve_sucursal IN (${sucursales})`;
    if (depositos.length > 0) where += ` AND v.ve_deposito IN (${depositos})`;
    if (clientes.length > 0) where += ` AND v.ve_cliente IN (${clientes})`;
    if (vendedores.length > 0)
      where += ` AND d.deve_vendedor IN (${vendedores})`;
    if (articulos.length > 0) where += ` AND d.deve_articulo IN (${articulos})`;
    if (tipos_articulo.length > 0)
      where += ` AND a.ar_servicio IN (${tipos_articulo})`;
    if (marcas.length > 0) where += ` AND a.ar_marca IN (${marcas})`;
    if (categorias.length > 0)
      where += ` AND s.sc_categoria IN (${categorias})`;
    if (subcategorias.length > 0)
      where += ` AND a.ar_subcategoria IN (${categorias})`;
    if (ciudades.length > 0) where += ` AND c.cli_ciudad IN (${ciudades})`;
    if (talles.length > 0) where += ` AND (k.al_talle IN (${talles}))`;
    if (condiciones.length > 0)
      where += ` AND v.ve_credito IN (${condiciones})`;
    if (situaciones.length > 0) where += ` AND v.ve_estado IN (${situaciones})`;
    if (secciones.length > 0) where += ` AND a.ar_seccion IN (${secciones})`;
    if (moneda != 0) where += ` AND v.ve_moneda = ${moneda}`;
    if (buscar_codigo > 0) where += ` AND v.ve_codigo = ${buscar_codigo}`;
    if (buscar_factura > 0)
      where += ` AND v.ve_factura LIKE '%${buscar_codigo}%'`;

    //Construimos el ORDER BY
    if (clientes.length > 0) {
      if (desglosado_factura) {
        mordena =
          " c.cli_razon, v.ve_fecha DESC, v.ve_codigo, a.ar_descripcion ";
      } else {
        mordena = " c.cli_razon, a.ar_descripcion ";
      }
    }
    if (vendedores.length > 0) mordena = " b.op_nombre, a.ar_descripcion ";
    if (marcas.length > 0) mordena = " m.ma_descripcion, a.ar_descripcion ";
    if (categorias.length > 0) mordena = " g.ca_descripcion, a.ar_descripcion ";
    if (subcategorias.length > 0)
      mordena = " s.sc_descripcion, a.ar_descripcion ";
    if (depositos.length > 0) mordena = " i.dep_descripcion, a.ar_descripcion ";
    if (ciudades.length > 0) mordena = " u.ciu_descripcion, a.ar_descripcion ";
    if (clientes.length > 0 && vendedores.length > 0)
      mordena =
        " l.descripcion, i.dep_descripcion, b.op_nombre, c.cli_razon, a.ar_descripcion ";

    if (agrupar_fecha) {
      if (!totalizar_grid) {
        mordena = " v.ve_fecha ASC, v.ve_codigo ";
        mfecha = ",";
      } else {
        mordena = " a.ar_descripcion ";
      }
    }

    if (totalizar_grid) {
      if (!agrupar_fecha) {
        mordena = " a.ar_descripcion ";
      }
    }
    //Si no se eligió ninguno de estos filtros
    if (
      mordena.length === 0 &&
      clientes.length === 0 &&
      vendedores.length === 0 &&
      marcas.length === 0 &&
      categorias.length === 0 &&
      subcategorias.length === 0 &&
      depositos.length === 0 &&
      ciudades.length === 0
    ) {
      mordena = " a.ar_descripcion ";
    }
    if (orden) {
      mordena += " ASC ";
    } else {
      mordena += " DESC ";
    }
    // Atributos
    ultimcostocompra = `
    IFNULL(
        (SELECT (dc.dc_precio + dc.dc_recargo) 
         FROM detalle_compras dc 
         INNER JOIN compras c ON dc.dc_compra = c.co_codigo 
         WHERE c.co_estado = 1
         AND dc.dc_articulo = d.deve_articulo
         AND c.co_moneda = v.ve_moneda
         ORDER BY dc.dc_id DESC 
         LIMIT 1),
        ( Select
					  	if(v.ve_moneda = 1, a.ar_pcg,if(v.ve_moneda= 2 ,a.ar_pcd, if(v.ve_moneda= 3 , a.ar_pcr,a.ar_pcp)))
						From
					  		articulos a
						where a.ar_codigo =  d.deve_articulo 
        )
    )
`;

    comandosqlauxot = `
      (SELECT 
          IF(l.ar_unidadmedida < 4, 
              SUM(b.d_cantidad * b.d_costo_uni), 
              IF(l.ar_unidadmedida > 3, 
                  SUM(b.d_cant_m2 * b.d_costo_uni), 
                  0
              )
          ) AS sutotal 
       FROM detalle_orden_trabajos_art b 
       INNER JOIN orden_trabajos o ON b.d_orden = o.o_codigo 
       INNER JOIN articulos l ON b.d_articulo = l.ar_codigo 
       INNER JOIN detalle_ventas t ON o.o_codigo = t.deve_codioot 
       WHERE o.o_estado = 1 
       AND t.deve_venta = d.deve_venta
       AND o.o_codigo = t.deve_codioot
       AND o.o_moneda = v.ve_moneda
      )
      `;

    ultimocostoformula = `
    (SELECT 
        IF(f.f_cant_producir = 0, 
            (f.f_costo), 
            (f.f_costo) / f.f_cant_producir
        ) AS costo 
     FROM p_formula_produccion f 
     WHERE f.f_articulo = d.deve_articulo 
     AND f.f_estado = 1 
     ORDER BY f.f_codigo DESC 
     LIMIT 1
    )
`;

    ultimocostopromrecf = `
    (SELECT 
        SUM(r.r_costo_uni) / COUNT(r.r_codigo) AS costo 
     FROM recepcion_articulo_produccion r 
     INNER JOIN remision_materia_prima rmp ON r.r_recepcion = rmp.m_codigo 
     INNER JOIN p_formula_produccion f ON f.f_codigo = rmp.r_orden 
     WHERE r.r_orden = 0 
     AND r.r_estado = 1 
     AND rmp.r_formula = 1 
     AND r.r_costo_uni > 0 
     AND f.f_articulo = d.deve_articulo
     AND r.r_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'
     AND r.r_moneda = v.ve_moneda
    )
`;

    ultimocostopromrecOrd = `
    (SELECT 
        SUM(r.r_costo_uni) / COUNT(r.r_codigo) AS costo 
     FROM recepcion_articulo_produccion r 
     INNER JOIN detalle_orden_produccion rd ON r.r_recepcion = rd.dop_codigo 
     INNER JOIN p_formula_produccion f ON f.f_articulo = rd.dop_articulo 
     WHERE r.r_orden = 1 AND r.r_estado = 1 AND r.r_costo_uni > 0 
     AND f.f_estado = 1 AND f.f_articulo = d.deve_articulo 
     AND r.r_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'
     AND r.r_moneda = v.ve_moneda
    )
`;

    if (totalizar_grid) {
      costoservicio = `
        (SELECT 
            IF(dt.deve_costo > 0, 
                SUM(dt.deve_costo * dt.deve_cantidad) / SUM(dt.deve_cantidad), 
                NULL
            ) AS costo 
         FROM detalle_ventas dt 
         INNER JOIN ventas t ON dt.deve_venta = t.ve_codigo 
         INNER JOIN articulos ac ON dt.deve_articulo = ac.ar_codigo 
         WHERE t.ve_estado = 1 AND ac.ar_editar_desc = 1 AND dt.deve_articulo = d.deve_articulo 
         AND t.ve_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}' 
         GROUP BY dt.deve_articulo
        )
    `;
    } else {
      costoservicio = `
        (SELECT 
            IF(dt.deve_costo > 0, 
                dt.deve_costo, 
                NULL
            ) AS costo 
         FROM detalle_ventas dt 
         INNER JOIN ventas t ON dt.deve_venta = t.ve_codigo 
         INNER JOIN articulos ac ON dt.deve_articulo = ac.ar_codigo 
         WHERE t.ve_estado = 1 AND ac.ar_editar_desc = 1 AND dt.deve_codigo = d.deve_codigo
        )
    `;
    }
    if (!desglosado_iva) {
      switch (tipo_valorizacion) {
        case 2: //Costo Promedio
          campospcosto = `
            IF(${comandosqlauxot} = 0,
              IFNULL(${ultimocostopromrecOrd},
              IFNULL(${ultimocostopromrecf},
                IFNULL(${ultimocostoformula},
                IFNULL(${costoservicio},
                  fn_precio_compra_promedio(d.deve_articulo, v.ve_moneda, '${fecha1Comparacion}', v.ve_fecha)
                )
                )
              )
              ),
              ${comandosqlauxot}
            )
            `;
          break;
        case 3: //Último costo
          campospcosto = `
    IF(${comandosqlauxot} = 0,
      IFNULL(${ultimocostopromrecOrd}, 
        IFNULL(${ultimocostopromrecf}, 
          IFNULL(${ultimocostoformula}, 
            IFNULL(${costoservicio}, ${ultimcostocompra})
          )
        )
      ), 
      ${comandosqlauxot}
    )`;

          break;
        case 1: //Costo real
          campospcosto = `
          IF(d.deve_costo_art = 0,
              IFNULL(${costoservicio}, ${ultimcostocompra}),
              d.deve_costo_art
          )`;
          break;
      }
      if (totalizar_grid) {
        camposprecios = " d.deve_precio ";
      } else {
        camposprecios =
          " IF(a.ar_editar_desc = 1, (SUM(d.deve_precio * d.deve_cantidad) / SUM(d.deve_cantidad)), d.deve_precio)";
      }

      camposcinco = " SUM(d.deve_cinco) ";
      camposcincoiva = "";
      camposdiez = " SUM(d.deve_diez) ";
      camposdieziva = " ";

      camposubtotal = " SUM(d.deve_exentas + d.deve_cinco + d.deve_diez) ";
      campoivatotal = " SUM(d.deve_cinco + d.deve_diez) ";
      campototalivas = " ";
    } else {
      switch (tipo_valorizacion) {
        case 2: //Costo Promedio
          campospcosto = `
            IF(
              a.ar_iva = 1,
              IF(
              ${comandosqlauxot} = 0,
              IFNULL(
                ${ultimocostopromrecOrd},
                IFNULL(
                ${ultimocostopromrecf},
                IFNULL(
                  ${ultimocostoformula},
                  IFNULL(
                  ${costoservicio},
                  fn_precio_compra_promedio(d.deve_articulo, v.ve_moneda, '${fecha1Comparacion}', v.ve_fecha)
                  )
                )
                )
              ),
              ${comandosqlauxot}
              ),
              IF(
              a.ar_iva = 2,
              IF(
                ${comandosqlauxot} = 0,
                IFNULL(
                ${ultimocostopromrecOrd},
                IFNULL(
                  ${ultimocostopromrecf},
                  IFNULL(
                  ${ultimocostoformula},
                  IFNULL(
                    ${costoservicio},
                    fn_precio_compra_promedio(d.deve_articulo, v.ve_moneda, '${fecha1Comparacion}', v.ve_fecha)
                  )
                  )
                ) - (
                IFNULL(
                  ${ultimocostopromrecOrd},
                  IFNULL(
                  ${ultimocostopromrecf},
                  IFNULL(
                    ${ultimocostoformula},
                    IFNULL(
                    ${costoservicio},
                    fn_precio_compra_promedio(d.deve_articulo, v.ve_moneda, '${fecha1Comparacion}', v.ve_fecha)
                    )
                  )
                  )
                ) / 11
                ),
                (${comandosqlauxot} - (${comandosqlauxot} / 11))
              ),
              IF(
                ${comandosqlauxot} = 0,
                IFNULL(
                ${ultimocostopromrecOrd},
                IFNULL(
                  ${ultimocostopromrecf},
                  IFNULL(
                  ${ultimocostoformula},
                  IFNULL(
                    ${costoservicio},
                    fn_precio_compra_promedio(d.deve_articulo, v.ve_moneda, '${fecha1Comparacion}', v.ve_fecha)
                  )
                  )
                )
                ) - (
                IFNULL(
                  ${ultimocostopromrecOrd},
                  IFNULL(
                  ${ultimocostopromrecf},
                  IFNULL(
                    ${ultimocostoformula},
                    IFNULL(
                    ${costoservicio},
                    fn_precio_compra_promedio(d.deve_articulo, v.ve_moneda, '${fecha1Comparacion}', v.ve_fecha)
                    )
                  )
                  )
                ) / 21
                ),
                (${comandosqlauxot} - (${comandosqlauxot} / 21))
              )
              )
            )
            `;
          break;
        case 3: //Último costo
          campospcosto = `
            IF(
              a.ar_iva = 1,
              IF(
              ${comandosqlauxot} = 0,
              IFNULL(
                ${ultimocostopromrecOrd},
                IFNULL(
                ${ultimocostopromrecf},
                IFNULL(
                  ${ultimocostoformula},
                  IFNULL(${costoservicio}, ${ultimcostocompra})
                )
                )
              ),
              ${comandosqlauxot}
              ),
              IF(
              a.ar_iva = 2,
              IF(
                ${comandosqlauxot} = 0,
                IFNULL(
                ${ultimocostopromrecOrd},
                IFNULL(
                  ${ultimocostopromrecf},
                  IFNULL(
                  ${ultimocostoformula},
                  IFNULL(${costoservicio}, ${ultimcostocompra})
                  )
                ) - (
                IFNULL(
                  ${ultimocostopromrecOrd},
                  IFNULL(
                  ${ultimocostopromrecf},
                  IFNULL(
                    ${ultimocostoformula},
                    IFNULL(${costoservicio}, ${ultimcostocompra})
                  )
                  )
                ) / 11
                ),
                (${comandosqlauxot} - (${comandosqlauxot} / 11))
              ),
              IF(
                ${comandosqlauxot} = 0,
                IFNULL(
                ${ultimocostopromrecOrd},
                IFNULL(
                  ${ultimocostopromrecf},
                  IFNULL(
                  ${ultimocostoformula},
                  IFNULL(${costoservicio}, ${ultimcostocompra})
                  )
                )
                ) - (
                IFNULL(
                  ${ultimocostopromrecOrd},
                  IFNULL(
                  ${ultimocostopromrecf},
                  IFNULL(
                    ${ultimocostoformula},
                    IFNULL(${costoservicio}, ${ultimcostocompra})
                  )
                  )
                ) / 21
                ),
                (${comandosqlauxot} - (${comandosqlauxot} / 21))
              )
              )
            )
            `;
          break;
        case 1: //Costo real
          campospcosto = `
        IF(d.deve_costo_art = 0,
            IFNULL(${ultimocostopromrecOrd},
              IFNULL(${ultimocostopromrecf},
                IFNULL(${ultimocostoformula},
                  IFNULL(${costoservicio}, ${ultimcostocompra})
                )
              )
            ),
            d.deve_costo_art
        )`;
          break;
      }
      if (totalizar_grid) {
        camposprecios =
          " IF(a.ar_iva=1, d.deve_precio, IF(a.ar_iva=2, d.deve_precio - d.deve_precio/11, d.deve_precio - d.deve_precio/21)) ";
      } else {
        camposprecios =
          "IF(a.ar_editar_desc = 1, IF(a.ar_iva=1, (SUM(d.deve_precio * d.deve_cantidad) / SUM(d.deve_cantidad)), IF(a.ar_iva=2, (SUM(d.deve_precio * d.deve_cantidad) / SUM(d.deve_cantidad))-(SUM(d.deve_precio * d.deve_cantidad) / SUM(d.deve_cantidad))/11, (SUM(d.deve_precio * d.deve_cantidad) / SUM(d.deve_cantidad))-(SUM(d.deve_precio * d.deve_cantidad) / SUM(d.deve_cantidad))/21)), IF(a.ar_iva=1, d.deve_precio, IF(a.ar_iva=2, d.deve_precio-d.deve_precio/11, d.deve_precio-d.deve_precio/21)))";
      }

      camposcinco = " (SUM(d.deve_cinco)-SUM(d.deve_cinco)/21) ";
      camposcincoiva = " (SUM(d.deve_cinco)/21) AS cinco_discriminado, ";
      camposdiez = " (SUM(d.deve_diez)-SUM(d.deve_diez)/11) ";
      camposdieziva = " (SUM(d.deve_diez)/11) AS diez_discriminado, ";
      camposubtotal =
        " SUM(d.deve_exentas) + (SUM(d.deve_cinco) - (SUM(d.deve_cinco)/21)) + (SUM(d.deve_diez)-(SUM(d.deve_diez)/11)) ";
      campoivatotal =
        " (SUM(d.deve_cinco)-(SUM(d.deve_cinco)/21)) + (SUM(d.deve_diez)-(SUM(d.deve_diez)-11)) ";
      campototalivas =
        " (SUM(d.deve_diez)/11) + (SUM(d.deve_cinco)/21) AS total_descriminado, ";
    }

    if (totalizar_grid) {
      mgroupbyar = " d.deve_articulo";
    } else {
      mgroupbyar = " d.deve_codigo";
    }

    if (bonificacion) {
      innerjoinbonif =
        "INNER JOIN detalle_venta_bonificacion n ON d.deve_codigo = n.d_detalle_venta";
      if (!desglosado_iva) {
        camposcinco = " SUM(n.d_cinco) ";
        camposcincoiva = "";
        camposdiez = " SUM(n.d_diez) ";
        camposdieziva = "";
        camposubtotal = " SUM(n.d_exentas + n.d_cinco + n.d_diez) ";
        campoivatotal = " SUM(n.d_cinco + n.d_diez) ";
        campototalivas = " ";
      } else {
        camposcinco = " (SUM(n.d_cinco)-SUM(n.d_cinco)/21) ";
        camposcincoiva = " (SUM(n.d_cinco)/21) AS cinco_discriminado, ";
        camposdiez = " (SUM(n.d_diez)-SUM(n.d_diez)/11) ";
        camposdieziva = " (SUM(n.d_diez)/11) AS diez_discriminado, ";
        camposubtotal =
          " sum(n.d_exentas) + (SUM(n.d_cinco) - (SUM(n.d_cinco)/21)) + (SUM(n.d_diez)-(SUM(n.d_diez)/11)) ";
        campoivatotal =
          " (SUM(n.d_cinco)-(SUM(n.d_cinco)/21)) + (SUM(n.d_diez)-(SUM(n.d_diez)-11)) ";
        campototalivas =
          " (SUM(n.d_diez)/11) + (SUM(n.d_cinco)/21) AS total_descriminado, ";
      }
    }

    const cantidadNC = `
    (
        SELECT
          IFNULL(SUM(dnc.denc_cantidad), 0) as montoNC
        FROM
          notadecredito ndec
          INNER JOIN detalle_nc dnc ON dnc.denc_nc = ndec.nc_codigo 
          INNER JOIN ventas v2 ON ndec.nc_venta = v2.ve_codigo
        WHERE
          dnc.denc_articulo = d.deve_articulo 
          AND ndec.nc_venta = v.ve_codigo
          AND ndec.nc_estado = 1
          AND ndec.nc_concepto < 4
          AND ndec.nc_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'
      )
    `;

    const cantidadND = `
      (
        SELECT
          IFNULL(SUM(dnd.dnd_cantidad), 0) as montoND
        FROM
          notadevolucioncontado nd
          INNER JOIN detalle_nd_contado dnd ON dnd.dnd_devolucion = nd.nd_codigo
          INNER JOIN ventas v1 ON nd.nd_venta = v1.ve_codigo
        WHERE
          dnd.dnd_articulo = d.deve_articulo 
          AND nd.nd_venta = v.ve_codigo
          AND nd.nd_estado = 1
          AND nd.nd_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'
      )
    `;

    const cantidadParaCosto = `
          (
            SUM(d.deve_cantidad) -
            (${cantidadNC} + ${cantidadND}) 
          )
    `;

    if (ncfechaVentas) {
      montoN1 = `
      IFNULL((SELECT ROUND(SUM(cr.nc_monto), 0) 
          FROM notadecredito cr
          INNER JOIN ventas v1 ON cr.nc_venta = v1.ve_codigo 
          WHERE v1.ve_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}' 
          AND cr.nc_concepto IN (1, 2, 3) 
          AND cr.nc_estado = 1 
          AND cr.nc_venta = v.ve_codigo), 0)
    `;

      montoN2 = `
      IFNULL(
        (SELECT ROUND(SUM(nd.nd_monto), 0) 
         FROM notadevolucioncontado nd 
         INNER JOIN ventas v2 ON nd.nd_venta = v2.ve_codigo
         WHERE v2.ve_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}' 
         AND nd.nd_concepto IN (1, 2, 3) 
         AND nd.nd_estado = 1 
         AND nd.nd_venta = v.ve_codigo), 
        0
      )
    `;

      montoNC = `
      IFNULL((${montoN1} + ${montoN2}), 0)
    `;
    } else {
      montoN1 = `
      IFNULL((SELECT ROUND(SUM(cr.nc_monto), 0) 
          FROM notadecredito cr
          WHERE cr.nc_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}' 
          AND cr.nc_concepto IN (1, 2, 3) 
          AND cr.nc_estado = 1 
          AND cr.nc_venta = v.ve_codigo), 0)
    `;

      montoN2 = `
      IFNULL(
        (SELECT ROUND(SUM(nd.nd_monto), 0) 
         FROM notadevolucioncontado nd 
         WHERE nd.nd_fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}' 
         AND nd.nd_concepto IN (1, 2, 3) 
         AND nd.nd_estado = 1 
         AND nd.nd_venta = v.ve_codigo), 
        0
      )
    `;

      montoNC = `
      IFNULL((${montoN1} + ${montoN2}), 0)
    `;
    }

    const cotizacion_dolar = `
    (SELECT co_monto FROM cotizaciones WHERE co_fecha = v.ve_fecha AND co_moneda = 2)
    `;

    const query = `
      SELECT
          IFNULL(IF(k.al_codbarra='', a.ar_codbarra, k.al_codbarra), a.ar_codbarra) AS ar_codbarra,
          IFNULL(dae.a_descripcion, a.ar_descripcion) AS ar_descripcion,
          ${campospcosto} AS pcosto,
          ${camposprecios} AS precio,
          ${camposcinco} AS cinco,
          ${camposcincoiva}
          ${camposdiez} AS diez,
          ${camposdieziva}
          ${campototalivas}
          ${camposubtotal} AS subtotal,
          ${campoivatotal} AS iva_total,
          ${montoNC} AS montonc,
          v.ve_descuento,
          d.deve_descuento,
          
          ${cotizacion_dolar} AS cotizacion_dolar,

          SUM(d.deve_cantidad) AS cantidad,
          SUM(d.deve_exentas) AS exentas,
          IFNULL(((${camposprecios} - ${campospcosto}) / ${camposprecios}) * 100,0) AS Utilidad_sobre_PrecioCosto_UltimaCompra_Venta,
          IFNULL(((${camposprecios} - ${campospcosto}) / ${campospcosto}) * 100,0) AS Utilidad_sobre_PrecioCosto_UltimaCompra_costo,
          ${cantidadNC} AS cantidadNC,
          ${cantidadND} AS cantidadND,
          ${cantidadParaCosto} AS cantidadParaCosto,
          d.deve_bonificacion AS boni,
          IFNULL(((${camposprecios} - ${campospcosto}) / ${camposprecios}) * 100,0) AS Utilidad_sobre_PrecioCosto_AVG_Ventail,
          IFNULL(ROUND((SELECT AVG(r.dc_precio) FROM detalle_compras r WHERE r.dc_articulo = d.deve_articulo GROUP BY r.dc_articulo)), 0) AS PrecioCostoAVG,
          DATE_FORMAT(v.ve_fecha, '%Y-%m-%d') AS ve_fecha,
          v.ve_hora,
          v.ve_sucursal,
          v.ve_deposito,
          v.ve_cliente,
          v.ve_operador,
          d.deve_articulo,
          a.ar_servicio,
          a.ar_marca,
          a.ar_subcategoria,
          c.cli_ciudad,
          d.deve_talle,
          a.ar_dvl,
          v.ve_moneda,
          v.ve_credito,
          v.ve_estado,
          IFNULL((SELECT p.co_proveedor FROM detalle_compras m INNER JOIN compras p ON m.dc_compra = p.co_codigo WHERE m.dc_articulo = d.deve_articulo LIMIT 1), 0) AS Codigo_Proveedor,
          v.ve_vendedor,
          v.ve_total,
          m.ma_descripcion,
          g.ca_descripcion,
          IFNULL((SELECT o.pro_razon FROM detalle_compras m INNER JOIN compras p ON m.dc_compra = p.co_codigo INNER JOIN proveedores o ON p.co_proveedor = o.pro_codigo WHERE m.dc_articulo = d.deve_articulo LIMIT 1), '') AS desc_Proveedor,
          i.dep_descripcion,
          u.ciu_descripcion,
          v.ve_codigo,
          
          v.ve_descuento,
          c.cli_razon,
          IFNULL(b.op_nombre,'') AS op_nombre,
          IF(v.ve_factura='', v.ve_codigo, v.ve_factura) AS ve_factura,
          l.descripcion,
          a.ar_descripcion AS desc_articulo,
          IFNULL(k.al_lote, '') AS lote,
          IFNULL(DATE_FORMAT(k.al_vencimiento, "%d/%m/%Y"), '') AS vence,
          IFNULL(t.t_abreviado,"") AS r_abre,
          IFNULL(c2.c_descripcion,"") AS r_color,
          IFNULL(k.al_nrotalle,"") AS r_nro,
          IFNULL(secc.s_descripcion, '') AS d_seccion,
          k.al_talle,
          s.sc_descripcion,
          d.deve_codigo 
        FROM
          ventas v
          INNER JOIN detalle_ventas d ON d.deve_venta = v.ve_codigo
          ${innerjoinbonif}
          INNER JOIN articulos a On d.deve_articulo = a.ar_codigo
          INNER JOIN subcategorias s On a.ar_subcategoria = s.sc_codigo
          INNER JOIN clientes c On v.ve_cliente = c.cli_codigo
          INNER JOIN marcas m On a.ar_marca = m.ma_codigo
          INNER JOIN categorias g On s.sc_categoria = g.ca_codigo
          INNER JOIN depositos i On v.ve_deposito = i.dep_codigo
          INNER JOIN ciudades u On c.cli_ciudad = u.ciu_codigo
          LEFT JOIN operadores b On d.deve_vendedor = b.op_codigo
          LEFT JOIN sucursales l On v.ve_sucursal = l.id
          LEFT JOIN detalle_ventas_vencimiento h On h.id_detalle_venta = d.deve_codigo
          LEFT JOIN articulos_lotes k On k.al_codigo = h.loteid
          LEFT JOIN talles t On k.al_talle = t.t_codigo
          LEFT JOIN colores c2 On k.al_color = c2.c_codigo
          LEFT JOIN secciones secc on a.ar_seccion = secc.s_codigo
          LEFT JOIN detalle_articulos_editado dae on d.deve_codigo = dae.a_detalle_venta
      ${where}
      GROUP BY ${mgroupbyar}
      ORDER BY ${mordena}`;
    return db.sql(query);
  }

  //VENTA

  async function agregarCabecera(datos) {
    const primary_key_value = datos.ve_codigo;
    const primary_key_name = "ve_codigo";
    return db.agregar(
      CABECERA_VENTA,
      datos,
      primary_key_value,
      primary_key_name
    );
  }

  async function agregarDetalle(datos) {
    const primary_key_value = datos.deve_codigo;
    const primary_key_name = "deve_codigo";
    return db.agregar(
      DETALLES_VENTA,
      datos,
      primary_key_value,
      primary_key_name
    );
  }

  //CUOTAS

  async function agregarCuotas(datos) {
    const primary_key_value = datos.dvc_codigo;
    const primary_key_name = "dvc_codigo";
    return db.agregar(
      DETALLE_VENTAS_CUOTA,
      datos,
      primary_key_value,
      primary_key_name
    );
  }

  //LOTE Y STOCK

  async function agregarDetalleLote(detalle, lote) {
    return db.sql(
      `INSERT INTO ${LOTE} (id_detalle_venta, lote, loteid) VALUES (${detalle}, '', ${lote})`
    );
  }

  async function actualizarStock(cantidad, ar_codigo, al_codigo) {
    return db.sql(
      `CALL actualizarStockVentalote(${cantidad},  ${ar_codigo}, ${al_codigo})`
    );
  }

  //ASIENTOS CONTABLES

  async function getAsientoAutomatico() {
    const config = await db.sql(
      `SELECT con_automatico FROM config_asiento WHERE con_nroTabla = 1`
    );
    return config[0].con_automatico;
  }

  async function asientoContableVenta(cabeceraId, venta) {
    if (cabeceraId === 0) {
      //Cabecera debe ser creada, es un Insert
      const config = await db.sql(
        `SELECT con_cont_prov, con_concepto FROM config_asiento WHERE con_nroTabla = 1`
      );
      //const cotizacion = await db.sql(`SELECT co_codigo FROM cotizaciones WHERE co_fecha = '${venta.ve_fecha}' AND co_moneda = 2`);
      const ultima_cabecera = await db.sql(
        `SELECT MAX(ac_numero) as num FROM asiento_contable WHERE ac_cierre_asiento = 0`
      );
      let numero = 0;
      if (ultima_cabecera[0]) {
        numero = ultima_cabecera[0].num + 1;
      } else {
        numero = 1;
      }

      let cabecera = {
        ac_codigo: 0,
        ac_sucursal: venta.ve_sucursal,
        ac_moneda: venta.ve_moneda,
        ac_operador: venta.ve_operador,
        ac_documento: venta.ac_referencia,
        ac_numero: numero,
        ac_fecha: venta.ve_fecha,
        ac_totaldebe: venta.ve_total,
        ac_totalhaber: 0, //Hasta que carguemos detalles
        ac_cotizacion: 0,
        ac_referencia: venta.ac_referencia,
        ac_origen: 1,
        ac_fecha_cierre: "0001-01-01",
        ac_fecha_apertura: "0001-01-01",
        ac_fecha_asiento: venta.ve_fecha,
        ac_cotizacion_c: 0,
        ac_tipo_asiento: 0,
        ac_cierre_asiento: 0,
        ac_estado: 1,
      };

      const cabecera_value = 0;
      const cabecera_name = "ac_codigo";
      const nueva_cabecera = await db.agregar(
        CABECERA_ASIENTO,
        cabecera,
        cabecera_value,
        cabecera_name
      );

      let primero = {
        dac_codigo: 0,
        dac_asiento: nueva_cabecera.insertId,
        dac_plan: config[0].con_cont_prov,
        dac_debe: venta.ve_total,
        dac_haber: 0,
        dac_concepto: config[0].con_concepto + " " + venta.ac_referencia,
      };

      await db.sql(`INSERT INTO ${DETALLES_ASIENTO} (dac_asiento, dac_plan, dac_debe, dac_haber, dac_concepto)
                    VALUES (${primero.dac_asiento}, ${primero.dac_plan}, ${primero.dac_debe}, ${primero.dac_haber}, '${primero.dac_concepto}')`);

      return nueva_cabecera.insertId;
    } else {
      //Ya existe, es un update
      db.sql(
        `UPDATE ${CABECERA_ASIENTO} SET ac_totalhaber = ${venta.total_haber} WHERE ac_codigo = ${cabeceraId}`
      );
    }
  }

  async function asientoContableCosto(cabeceraId, venta) {
    if (cabeceraId === 0) {
      //Cabecera debe ser creada, es un Insert
      const config = await db.sql(
        `SELECT con_gravada, con_concepto FROM config_asiento WHERE con_nroTabla = 6`
      );
      //const cotizacion = await db.sql(`SELECT co_codigo FROM cotizaciones WHERE co_fecha = '${venta.ve_fecha}' AND co_moneda = 2`);
      const ultima_cabecera = await db.sql(
        `SELECT MAX(ac_numero) as num FROM asiento_contable WHERE ac_cierre_asiento = 0`
      );
      let numero = 0;
      if (ultima_cabecera[0]) {
        numero = ultima_cabecera[0].num + 1;
      } else {
        numero = 1;
      }

      let cabecera = {
        ac_codigo: 0,
        ac_sucursal: venta.ve_sucursal,
        ac_moneda: venta.ve_moneda,
        ac_operador: venta.ve_operador,
        ac_documento: venta.ac_referencia,
        ac_numero: numero,
        ac_fecha: venta.ve_fecha,
        ac_totaldebe: 0, //Hasta que carguemos detalles
        ac_totalhaber: 0, //Hasta que carguemos detalles
        ac_cotizacion: 0,
        ac_referencia: venta.ac_referencia,
        ac_origen: 16,
        ac_fecha_cierre: "0001-01-01",
        ac_fecha_apertura: "0001-01-01",
        ac_fecha_asiento: venta.ve_fecha,
        ac_cotizacion_c: 0,
        ac_tipo_asiento: 0,
        ac_cierre_asiento: 0,
        ac_estado: 1,
      };

      const cabecera_value = 0;
      const cabecera_name = "ac_codigo";
      const nueva_cabecera = await db.agregar(
        CABECERA_ASIENTO,
        cabecera,
        cabecera_value,
        cabecera_name
      );

      return nueva_cabecera.insertId;
    } else {
      //Ya existe, es un update
      let debe_str = " ";
      let haber_str = " ";

      if (venta.total_debe > 0) {
        debe_str = ` ac_totaldebe = ${venta.total_debe} `;
      }

      if (venta.total_haber > 0) {
        if (venta.total_debe > 0) haber_str = ", ";
        haber_str += `ac_totalhaber = ${venta.total_haber} `;
      }

      db.sql(
        `UPDATE ${CABECERA_ASIENTO} SET ${debe_str}${haber_str} WHERE ac_codigo = ${cabeceraId}`
      );
    }
  }

  async function agregarDetalleAsiento(
    tabla,
    asiento,
    tipo,
    porcentaje,
    debe,
    haber,
    venta
  ) {
    //Tipo: 0=Imponible(Gravadas), 1=IVA
    const config = await db.sql(
      `SELECT * FROM config_asiento WHERE con_nroTabla = ${tabla}`
    );
    let plan = 0;

    if (tipo === 0) {
      if (porcentaje === 10) {
        plan = config[0].con_gravada10;
      } else if (porcentaje === 5) {
        plan = config[0].con_gravada;
      } else {
        plan = config[0].con_exenta;
      }
    }

    if (tipo === 1) {
      if (porcentaje === 10) {
        plan = config[0].con_iva10;
      } else if (porcentaje === 5) {
        plan = config[0].con_iva5;
      }
    }

    return db.sql(`INSERT INTO ${DETALLES_ASIENTO} (dac_asiento, dac_plan, dac_debe, dac_haber, dac_concepto)
                        VALUES (${asiento}, ${plan}, ${debe}, ${haber}, '${
      config[0].con_concepto + " " + venta
    }')`);
  }

  async function actualizarMovimientoParcial(movimientoId, itemsVendidos) {
    try {
      console.log("Iniciando actualizacion de movimiento parcial");

      const detallesActualesQuery = `
        SELECT
            dp_codigo,
            dp_pedido,
            dp_articulo,
            dp_cantidad,
            dp_lote,
            dp_codigolote
          FROM detalle_pedido
          WHERE dp_pedido = ${movimientoId}
        `;

      const detallesActuales = await db.sql(detallesActualesQuery);
      console.log("Detalles actuales del movimiento", detallesActuales);

      // Iterar sobre los items vendidos y actualizar las cantidades
      for (const item of itemsVendidos) {
        console.log("Item a actualizar:", item);
        const detalleActual = detallesActuales.find(
          (detalle) =>
            detalle.dp_articulo === item.deve_articulo &&
            (item.loteid ? detalle.dp_codigolote === item.loteid : true)
        );
        console.log("Detalle actual:", detalleActual);

        if (detalleActual) {
          // Convertir dp_cantidad a número ya que viene como string
          const cantidadActual = parseFloat(detalleActual.dp_cantidad);
          const nuevaCantidad = cantidadActual - item.deve_cantidad;
          console.log("Nueva cantidad:", nuevaCantidad);

          // Registrar la cantidad faltante en la tabla detalle_faltante
          console.log("Registrando cantidad faltante en detalle_faltante");
          await db.sql(
            `INSERT INTO detalle_faltante (d_detalle_pedido, d_cantidad, d_situacion)
                     VALUES (${detalleActual.dp_codigo}, ${item.deve_cantidad}, 0)`
          );

          console.log("Cantidad faltante registrada en detalle_faltante");

          // Actualizar la cantidad en la base de datos
          console.log("Actualizando cantidad en detalle_pedido");
          await db.sql(
            `UPDATE detalle_pedido 
                     SET dp_cantidad = ${nuevaCantidad}
                     WHERE dp_codigo = ${detalleActual.dp_codigo}`
          );
          console.log(
            `Actualizado detalle ${detalleActual.dp_codigo}: cantidad anterior ${detalleActual.dp_cantidad}, nueva cantidad ${nuevaCantidad}`
          );
          console.log("*************************************************");
        } else {
          console.log(
            `No se encontró detalle para el artículo ${item.deve_articulo} con lote ${item.loteid}`
          );
        }
      }

      console.log("Actualización de movimiento parcial completada");
      return true;
    } catch (error) {
      console.error("Error al actualizar movimiento parcial", error);
      throw error;
    }
  }

  async function agregarVentaNuevo(venta, detalle_ventas) {
    try {
      if (venta.pedido != null) {
        try {
          await db.sql(
            `
        UPDATE pedidos
        SET p_estado = 2
        WHERE p_codigo = ${venta.pedido}
      `
          );
          await actualizarMovimientoParcial(venta.pedido, detalle_ventas);
        } catch (error) {
          console.error("Error al actualizar estado del pedido", error);
        }
      }

      if (venta.presupuesto != null) {
        await db.sql(
          `
          UPDATE presupuesto
          SET pre_confirmado= 1
          WHERE pre_codigo= ${venta.presupuesto}
          `
        );
      }

      ventaQuery = await db.sql(
        `
        INSERT INTO ventas (
          ve_codigo,
          ve_cliente,
          ve_operador,
          ve_deposito,
          ve_moneda,
          ve_fecha,
          ve_factura,
          ve_credito,
          ve_saldo,
          ve_vencimiento,
          ve_descuento,
          ve_total,
          ve_cuotas,
          ve_cantCuotas,
          ve_obs,
          ve_vendedor,
          ve_sucursal,
          ve_timbrado,
          ve_pedido,
          ve_hora,
          ve_userpc,
          ve_situacion,
          ve_chofer,
          ve_cdc,
          ve_qr
        )
        VALUES (
          ${venta.ventaId || 0},
          ${venta.cliente},
          ${venta.operador},
          ${venta.deposito},
          ${venta.moneda},
          '${venta.fecha}',
          ${venta.factura ? `'${venta.factura}'` : "''"},  
          ${venta.credito},
          ${venta.saldo},
          '${venta.credito === 0 ? "0001-01-01" : venta.vencimiento}',
          ${venta.descuento},
          ${venta.total},
          ${venta.cuotas},
          ${venta.cantCuotas},
          ${venta.obs ? `'${venta.obs}'` : "''"},     
          ${venta.vendedor},
          ${venta.sucursal},
          ${venta.timbrado || "''"},
          ${venta.pedido || 0},
          '${venta.hora}',
          '${venta.userpc}',
          ${venta.situacion || 1},
          ${venta.chofer || 0},
          '${venta.ve_cdc || ""}',
          '${venta.ve_qr || ""}'
        )
        ON DUPLICATE KEY UPDATE
          ve_factura = ${venta.factura ? `'${venta.factura}'` : "''"}, 
          ve_total = ${venta.total},
          ve_saldo = ${venta.saldo},
          ve_vencimiento = '${
            venta.credito === 0 ? "0001-01-01" : venta.vencimiento
          }',
          ve_metodo = ${venta.metodo || 1}
        `
      );
      const ventaId = ventaQuery.insertId;
      for (const item of detalle_ventas) {
        const detalleVentaQuery = await db.sql(
          `
            INSERT INTO detalle_ventas
            (
              deve_venta,
              deve_articulo,
              deve_cantidad,
              deve_precio,
              deve_descuento,
              deve_exentas,
              deve_cinco,
              deve_diez,
              deve_color,
              deve_bonificacion,
              deve_vendedor,
              deve_codioot, 
              deve_costo,
              deve_costo_art,
              deve_cinco_x,
              deve_diez_x
            )
            VALUES (
              ${ventaId},
              ${item.deve_articulo},
              ${item.deve_cantidad},
              ${item.deve_precio},
              ${item.deve_descuento},
              ${item.deve_exentas},
              ${item.deve_cinco},
              ${item.deve_diez},
              ${item.deve_color || "''"},
              ${item.deve_bonificacion || 0},
              ${item.deve_vendedor},
              ${item.deve_codioot || 0},
              ${item.deve_costo || 0},
              ${item.deve_costo_art || 0},
              ${item.deve_cinco_x || 0},
              ${item.deve_diez_x || 0}
            )
          `
        );
        const detalleVentaId = detalleVentaQuery.insertId;
        await db.sql(
          `
            INSERT INTO detalle_ventas_vencimiento
            (
              id_detalle_venta,
              lote,
              loteid
            )
            VALUES
            (
              ${detalleVentaId},
              '${item.lote || ""}',
              ${item.loteid}
            )
          `
        );
        if (item.deve_bonificacion === 1) {
          await db.sql(
            `
              INSERT INTO detalle_venta_bonificacion
              (
                d_codigo,
                d_detalle_venta,
                d_cantidad,
                d_precio,
                d_exentas,
                d_cinco,
                d_diez
              )
              VALUES
              (
                ${item.deve_bonificacion},
                ${detalleVentaId},
                ${item.deve_cantidad},
                ${item.deve_precio},
                ${item.deve_exentas},
                ${item.deve_cinco},
                ${item.deve_diez}
              )
            `
          );
        }
        if (item.articulo_editado === true) {
          await db.sql(
            `
              INSERT INTO detalle_articulos_editado
              (
                a_detalle_venta,
                a_descripcion
              )
              VALUES
              (
                ${detalleVentaId},
                '${item.deve_descripcion_editada}'
              )
           `
          );
        }

        const cantidadItemsInicial = await db.sql(
          `
           SELECT al_cantidad FROM articulos_lotes WHERE al_codigo = ${item.loteid}
          `
        );

        if (cantidadItemsInicial[0].al_cantidad > item.deve_cantidad) {
          await db.sql(
            `
              UPDATE articulos_lotes
              SET al_cantidad = al_cantidad - ${item.deve_cantidad}
              WHERE al_codigo = ${item.loteid}
            `
          );
        } else {
          await db.sql(
            `CALL actualizarStockVentalote(${item.deve_cantidad}, ${item.deve_codigo}, ${item.loteid})`
          );
        }
      }
      return {
        status: "success",
        message: "Venta agregada correctamente",
        ventaId: ventaId,
      };
    } catch (error) {
      console.error("Error al agregar venta:", error);
      throw error;
    }
  }

  async function agregarVenta(req, res) {
    const { venta, detalle_ventas } = req.body;
    try {
      // Insert venta
      const ventaResult = await db.agregar(
        CABECERA_VENTA,
        {
          ve_cliente: venta.ve_cliente,
          ve_operador: venta.ve_operador,
          ve_deposito: venta.ve_deposito,
          ve_moneda: venta.ve_moneda,
          ve_fecha: venta.ve_fecha,
          ve_factura: venta.ve_factura,
          ve_credito: venta.ve_credito || 0,
          ve_saldo: venta.ve_saldo,
          ve_total: venta.ve_total,
          ve_vencimiento: venta.ve_vencimiento,
          ve_estado: venta.ve_estado || 1,
          ve_devolucion: venta.ve_devolucion || 0,
          ve_procesado: venta.ve_procesado || 0,
          ve_descuento: venta.ve_descuento,
          ve_cuotas: venta.ve_cuotas || 0,
          ve_cantCuotas: venta.ve_cantCuotas || 0,
          ve_obs: venta.ve_obs,
          ve_vendedor: venta.ve_vendedor,
          ve_sucursal: venta.ve_sucursal,
          ve_metodo: venta.ve_metodo || 1,
          ve_aplicar_a: venta.ve_aplicar_a || 0,
          // ve_mantenimiento: venta.ve_mantenimiento || 0,
          ve_retencion: venta.ve_retencion || 0,
          ve_timbrado: venta.ve_timbrado || 0,
          ve_codeudor: venta.ve_codeudor,
          // ve_zafra: venta.ve_zafra || 0,
          ve_pedido: venta.ve_pedido || 0,
          ve_hora: venta.ve_hora,
          ve_userpc: venta.ve_userpc || os.hostname(),
          ve_cdc: venta.ve_cdc || "",
        },
        0,
        "ve_codigo"
      );
      const ventaId = ventaResult.insertId;
      // Insert detalle_ventas
      for (const item of detalle_ventas) {
        await db.agregar(
          DETALLES_VENTA,
          {
            deve_venta: ventaId,
            deve_articulo: item.deve_articulo,
            deve_cantidad: item.deve_cantidad,
            deve_precio: item.deve_precio,
            deve_descuento: item.deve_descuento || 0,
            deve_exentas: item.deve_exentas,
            deve_cinco: item.deve_cinco,
            deve_diez: item.deve_diez,
            deve_devolucion: item.deve_devolucion || 0,
            deve_vendedor: item.deve_vendedor,
            deve_color: item.deve_color || "",
            deve_bonificacion: item.deve_bonificacion,
            deve_talle: item.deve_talle || "",
            deve_codioot: item.deve_codioot || 0,
            deve_costo: item.deve_costo || 0,
            deve_costo_art: item.deve_costo || 0,
            deve_cinco_x: item.deve_cinco_x || 0,
            deve_diez_x: item.deve_diez_x || 0,
          },
          0,
          "deve_codigo"
        );
        await db.sql(`
           UPDATE articulos_lotes 
           SET al_cantidad = al_cantidad - ${item.deve_cantidad}
           WHERE al_articulo = ${item.deve_articulo}
           AND al_deposito = ${venta.ve_deposito}
         `);
      }
      res.status(201).json({
        success: true,
        message: "Venta agregada con éxito",
        body: ventaId,
      });
    } catch (error) {
      console.error("Error al agregar venta:", error);
      res.status(500).json({
        success: false,
        message: "Error al agregar venta",
        error: error.message,
      });
    }
  }

  async function getMetodosPago() {
    return db.sql("SELECT * FROM metodospago WHERE me_estado = 1");
  }

  async function ActualizarDescripcionArticulo(articulo) {
    return db.sql(
      `INSERT INTO detalle_articulos_editado (a_detalle_venta, a_descripcion) VALUES (${articulo.deve_codigo}, '${articulo.ar_descripcion}')`
    );
  }

  async function traerIdDetalleVentas(deve_venta) {
    return db.sql(
      `SELECT deve_codigo as detalle_venta_id,
      deve_articulo as ar_codigo,
      ar_descripcion as nombre_original
       FROM detalle_ventas
       INNER JOIN articulos a ON a.ar_codigo = deve_articulo
       WHERE deve_venta = ${deve_venta}
      `
    );
  }

  async function idUltimaVenta() {
    return db.sql("SELECT MAX(ve_codigo) as id FROM ventas");
  }

  async function anularVenta(ventaId, userId, clientIp, metodo, obs) {
    let ventaServicioQuery = await db.sql(`
      SELECT ve.ve_servicio
      FROM ventas ve
      WHERE ve.ve_codigo = ${ventaId}
    `);

    let ventaServicio = ventaServicioQuery[0].ve_servicio;

    try {
      const existeRetencion = await db.sql(`
      SELECT rt.r_codigo
      FROM retenciones rt
      INNER JOIN detalle_retencion_v dvr ON dvr.dr_retencion = rt.r_codigo
      WHERE dvr.dr_venta = ${ventaId}
      AND rt.r_estado = 1
     `);

      if (existeRetencion && existeRetencion.length > 0) {
        throw new Error(
          "No se puede anular la venta porque tiene retenciones asociadas"
        );
      }

      const existeCobro = await db.sql(`
        SELECT deco_detalleCaja
        FROM detalle_caja_cobro
        WHERE deco_venta = ${ventaId}
      `);

      await db.sql("BEGIN");

      if (existeCobro && existeCobro.length > 0) {
        // Si existe cobro, anulamos el registro en detalle_caja_metodo
        await db.sql(`
          UPDATE detalle_caja_metodo 
          SET obs = 'Anulado, ${obs}'
          WHERE dcm_deca = ${existeCobro[0].deco_detalleCaja}
        `);

        // Actualizamos el estado en detalle_caja
        await db.sql(`
        UPDATE detalle_caja
        SET deca_estado = 0 
        WHERE deca_codigo = ${existeCobro[0].deco_detalleCaja}
      `);

        await db.sql(`
        UPDATE operacion_caja
        SET oc_obs = 'Anulado, ${obs}'
        WHERE oc_codigo = (
          SELECT deca_operacion 
          FROM detalle_caja 
          WHERE deca_codigo = ${existeCobro[0].deco_detalleCaja}
        )
      `);
      }

      if (metodo === 0) {
        // metodo = 0 solo anula la venta y no toca los datos
        // metodo = 1 anula la venta y elimina el registro y guarda los datos en vental para tener un respaldo
        // Solo cambia el estado
        await db.sql(`
          UPDATE ventas 
          SET ve_estado = 0
          WHERE ve_codigo = ${ventaId}
        `);
      } else {
        // Primero guarda los datos en vental como respaldo
        await db.sql(`
          INSERT INTO ventasl (
            ve_codigo,
            ve_cliente,
            ve_operador,
            ve_deposito,
            ve_moneda,
            ve_fecha,
            ve_factura,
            ve_credito,
            ve_saldo,
            ve_total,
            ve_vencimiento,
            ve_estado,
            ve_devolucion,
            ve_procesado,
            ve_descuento,
            ve_cuotas,
            ve_cantCuotas,
            ve_obs,
            ve_vendedor,
            ve_timbrado,
            ve_razon,
            ve_ruc,
            ve_venta,
            ve_hora,
            ve_userpc,
            ve_cdc,
            ve_qr
          )
          SELECT 
            v.ve_codigo,
            v.ve_cliente,
            v.ve_operador,
            v.ve_deposito,
            v.ve_moneda,
            v.ve_fecha,
            v.ve_factura,
            v.ve_credito,
            v.ve_saldo,
            v.ve_total,
            v.ve_vencimiento,
            v.ve_estado,
            v.ve_devolucion,
            v.ve_procesado,
            v.ve_descuento,
            v.ve_cuotas,
            v.ve_cantCuotas,
            v.ve_obs,
            v.ve_vendedor,
            v.ve_timbrado,
            c.cli_razon,
            c.cli_ruc,
            v.ve_codigo,
            v.ve_hora,
            v.ve_userpc,
            v.ve_cdc,
            v.ve_qr
          FROM ventas v
          LEFT JOIN clientes c ON v.ve_cliente = c.cli_codigo
          WHERE v.ve_codigo = ${ventaId}
        `);

        // Luego actualiza vaciando los campos
        await db.sql(`
          UPDATE ventas 
          SET ve_estado = 0,
              ve_timbrado = '',
              ve_factura = ''
          WHERE ve_codigo = ${ventaId}
        `);

        // Procesa facturas relacionadas
        const facturasRelacionadas = await db.sql(`
          SELECT v_factura 
          FROM factura_venta 
          WHERE v_venta = ${ventaId}
        `);

        if (facturasRelacionadas && facturasRelacionadas.length > 0) {
          await db.sql(`
            UPDATE factura_ventas 
            SET ve_estado = 0,
                ve_factura = ''
            WHERE ve_codigo IN (
              SELECT v_factura 
              FROM factura_venta 
              WHERE v_venta = ${ventaId}
            )
          `);
        }
        //seccion para anular asientos contables
        const codigoAsientoAnular = await db.sql(
          `
            SELECT ac_codigo, ac_origen FROM asiento_contable WHERE ac_codigo = ${ventaId} AND ac_origen IN (1, 16)
          `
        );

        if (codigoAsientoAnular && codigoAsientoAnular.length > 0) {
          for (const asiento of codigoAsientoAnular) {
            const queryAnulacion = `
              UPDATE asiento_contable
              SET ac_estado = 0
              WHERE ac_codigo = ${asiento.ac_codigo}
            `;
            await db.sql(queryAnulacion);
          }
        }

        const existeTablaServicios = await db.sql(`
            SHOW TABLES LIKE 'ventas_servicios'
          `);

        if (existeTablaServicios && existeTablaServicios.length > 0) {
          const queryAnulacion = `
            UPDATE ventas_servicios vs
            INNER JOIN grua_servicios g
            ON vs.gruas = g.gr_codigo
            INNER JOIN ventas v
            ON vs.venta = v.ve_codigo
            SET g.gr_estado = 0
            WHERE v.ve_codigo = ${ventaId}
            `;
          await db.sql(queryAnulacion);
        }

        const existeTablaFacturaEscribania = await db.sql(
          `
              SHOW TABLES LIKE 'venta_factura_escribania'
            `
        );

        if (
          existeTablaFacturaEscribania &&
          existeTablaFacturaEscribania.length > 0
        ) {
          const queryAnulacion = `
              UPDATE
                venta_factura_escribania vs
              INNER JOIN factura_escribania g
              ON vs.f_factura = g.f_codigo
              SET g.f_situacion = 0
              WHERE vs.f_venta = ${ventaId}
            `;
          await db.sql(queryAnulacion);
        }

        const existeTablaVentaOrden = await db.sql(
          `
              SHOW TABLES LIKE 'venta_orden'
            `
        );

        if (existeTablaVentaOrden && existeTablaVentaOrden.length > 0) {
          const queryAnulacion = `
            UPDATE
              orden_trabajos ot
            INNER JOIN ventaorden vo ON vo.vo_orden = ot.o_codigo
            INNER JOIN ventas v ON v.ve_codigo = vo.vo_venta
            SET
              ot.o_estado = 0
            WHERE v.ve_codigo = ${ventaId}
            `;
          await db.sql(queryAnulacion);
        }
      }
      const clientName = await db.sql(`
        SELECT cli_razon 
        FROM clientes 
        WHERE cli_codigo = ${userId}
      `);

      await db.sql(`
        INSERT INTO anulacionventa (usuario, venta, obs, fecha)
        VALUES (
          '${clientName[0].cli_razon}@${clientIp}',
          ${ventaId},
          '${obs}',
          DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')
        )
      `);

      if (ventaServicio === 0) {
        // formula para pintura

        const articulosADevolver = await db.sql(`
        SELECT deve_articulo, deve_cantidad 
        FROM detalle_ventas
        WHERE deve_venta = ${ventaId}
      `);

        for (const articulo of articulosADevolver) {
          const existeDetallePintura = await db.sql(
            `
           SELECT
               f.d_stock,
               f.d_cantidad
             FROM
               detalle_formula_articulos f
             WHERE
               f.d_detalle = ${articulo.deve_articulo}
          `
          );

          if (existeDetallePintura.length > 0) {
            for (const detalle of existeDetallePintura) {
              let codigoFormula = detalle.d_stock;
              let cantidadFormula = detalle.d_cantidad;

              await db.sql(
                `
                  UPDATE articulos_lotes
                  SET al_cantidad = al_cantidad + ${cantidadFormula}
                  WHERE al_codigo = ${codigoFormula}
                `
              );
            }
          }

          const existeDetalleEnsamble = await db.sql(
            `
              SELECT
                ae.ae_cantidad,
                ae.ae_articulo,
                ar.ar_referenciaid
              FROM
                articulos_ensamble ae
              WHERE
                ae.ae_articulo = ${articulo.deve_articulo}
                AND ae.ae_estado = 1
            `
          );

          if (existeDetalleEnsamble.length > 0) {
            for (const detalle of existeDetalleEnsamble) {
              let codigoEnsamble = detalle.ae_articulo;
              let cantidadEnsamble = detalle.ae_cantidad;
              let referenciaEnsamble = detalle.ae_referenciaid;

              await db.sql(`
                  UPDATE articulos_lotes
                  SET al_cantidad = al_cantidad + ${cantidadEnsamble}
                  WHERE al_codigo = ${referenciaEnsamble}
                `);
            }
          }

          await db.sql(`
          UPDATE articulos_lotes
          SET al_cantidad = al_cantidad + ${articulo.deve_cantidad}
          WHERE al_articulo = ${articulo.deve_articulo}
        `);
        }
      }

      // Devolución de stock común para ambos métodos

      await db.sql("COMMIT");
      return true;
    } catch (error) {
      await db.sql("ROLLBACK");
      throw error;
    }
  }

  async function cobrarVenta(ventaId) {
    const primary_key_name = "ve_codigo";
    const primary_key_value = ventaId;
    const data = { ve_saldo: 0 };
    return db.actualizar(
      CABECERA_VENTA,
      data,
      primary_key_value,
      primary_key_name
    );
  }

  // controlador.js
  async function graficoVentas(tipo) {
    let query;

    switch (tipo) {
      case "hoy":
        query = `
              SELECT 
                  DATE_FORMAT(ve_fecha, '%Y-%m-%d') as fecha,
                  HOUR(ve_hora) as hora,
                  COUNT(*) as cantidad_ventas,
                  SUM(ve_total) as total_ventas,
                  ve_codigo as id
              FROM ventas 
              WHERE DATE(ve_fecha) = CURDATE()
              GROUP BY HOUR(ve_hora), ve_codigo
              ORDER BY HOUR(ve_hora) ASC, ve_codigo ASC`;
        break;

      case "semana":
        query = `
              SELECT 
                  CASE 
                      WHEN DAYOFWEEK(ve_fecha) = 1 THEN 'Dom'
                      WHEN DAYOFWEEK(ve_fecha) = 2 THEN 'Lun'
                      WHEN DAYOFWEEK(ve_fecha) = 3 THEN 'Mar'
                      WHEN DAYOFWEEK(ve_fecha) = 4 THEN 'Mier'
                      WHEN DAYOFWEEK(ve_fecha) = 5 THEN 'Juev'
                      WHEN DAYOFWEEK(ve_fecha) = 6 THEN 'Vier'
                      WHEN DAYOFWEEK(ve_fecha) = 7 THEN 'Sab'
                  END as dia,
                  COUNT(*) as cantidad_ventas,
                  SUM(ve_total) as total_ventas
              FROM ventas 
              WHERE ve_fecha BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()
              GROUP BY DAYOFWEEK(ve_fecha)
              ORDER BY DAYOFWEEK(ve_fecha) ASC`;
        break;

      case "mes":
        query = `
              SELECT 
                  DAY(ve_fecha) as dia,
                  COUNT(*) as cantidad_ventas,
                  SUM(ve_total) as total_ventas
              FROM ventas 
              WHERE MONTH(ve_fecha) = MONTH(CURDATE()) AND YEAR(ve_fecha) = YEAR(CURDATE())
              GROUP BY DAY(ve_fecha)
              ORDER BY DAY(ve_fecha) ASC`;
        break;

      case "año":
        query = `
              SELECT 
                  CASE 
                      WHEN MONTH(ve_fecha) = 1 THEN 'Ene'
                      WHEN MONTH(ve_fecha) = 2 THEN 'Feb'
                      WHEN MONTH(ve_fecha) = 3 THEN 'Mar'
                      WHEN MONTH(ve_fecha) = 4 THEN 'Abr'
                      WHEN MONTH(ve_fecha) = 5 THEN 'May'
                      WHEN MONTH(ve_fecha) = 6 THEN 'Jun'
                      WHEN MONTH(ve_fecha) = 7 THEN 'Jul'
                      WHEN MONTH(ve_fecha) = 8 THEN 'Ago'
                      WHEN MONTH(ve_fecha) = 9 THEN 'Sep'
                      WHEN MONTH(ve_fecha) = 10 THEN 'Oct'
                      WHEN MONTH(ve_fecha) = 11 THEN 'Nov'
                      WHEN MONTH(ve_fecha) = 12 THEN 'Dic'
                  END as mes,
                  COUNT(*) as cantidad_ventas,
                  SUM(ve_total) as total_ventas
              FROM ventas 
              WHERE YEAR(ve_fecha) = YEAR(CURDATE())
              GROUP BY MONTH(ve_fecha)
              ORDER BY MONTH(ve_fecha) ASC`;
        break;

      default:
        throw new Error("Tipo de gráfico inválido");
    }
    return db.sql(query);
  }

  async function totalVentasPorPeriodo(tipo) {
    let query;

    switch (tipo) {
      case "hoy":
        query = `
              SELECT 
                  SUM(ve_total) as total_ventas
              FROM ventas 
              WHERE DATE(ve_fecha) = CURDATE()`;
        break;

      case "semana":
        query = `
              SELECT 
                  SUM(ve_total) as total_ventas
              FROM ventas 
              WHERE ve_fecha BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()`;
        break;

      case "mes":
        query = `
              SELECT 
                  SUM(ve_total) as total_ventas
              FROM ventas 
              WHERE MONTH(ve_fecha) = MONTH(CURDATE()) AND YEAR(ve_fecha) = YEAR(CURDATE())`;
        break;

      case "año":
        query = `
              SELECT 
                  SUM(ve_total) as total_ventas
              FROM ventas 
              WHERE YEAR(ve_fecha) = YEAR(CURDATE())`;
        break;

      default:
        throw new Error("Tipo de periodo inválido");
    }
    return db.sql(query);
  }

  async function cantidadVentasPorPeriodo(tipo) {
    let query;

    switch (tipo) {
      case "hoy":
        query = `
              SELECT 
                  COUNT(*) as cantidad_ventas
              FROM ventas 
              WHERE DATE(ve_fecha) = CURDATE()`;
        break;

      case "semana":
        query = `
              SELECT 
                  COUNT(*) as cantidad_ventas
              FROM ventas 
              WHERE ve_fecha BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()`;
        break;

      case "mes":
        query = `
              SELECT 
                  COUNT(*) as cantidad_ventas
              FROM ventas 
              WHERE MONTH(ve_fecha) = MONTH(CURDATE()) AND YEAR(ve_fecha) = YEAR(CURDATE())`;
        break;

      case "año":
        query = `
              SELECT 
                  COUNT(*) as cantidad_ventas
              FROM ventas 
              WHERE YEAR(ve_fecha) = YEAR(CURDATE())`;
        break;

      default:
        throw new Error("Tipo de periodo inválido");
    }
    return db.sql(query);
  }

  async function cantidadArticulosVendidosPorPeriodo(tipo) {
    let query;

    switch (tipo) {
      case "hoy":
        query = `
              SELECT 
                  SUM(deve.deve_cantidad) as cantidad_articulos
              FROM detalle_ventas deve
              JOIN ventas v ON deve.deve_venta = v.ve_codigo
              WHERE DATE(v.ve_fecha) = CURDATE()`;
        break;

      case "semana":
        query = `
              SELECT 
                  SUM(deve.deve_cantidad) as cantidad_articulos
              FROM detalle_ventas deve
              JOIN ventas v ON deve.deve_venta = v.ve_codigo
              WHERE v.ve_fecha BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()`;
        break;

      case "mes":
        query = `
              SELECT 
                  SUM(deve.deve_cantidad) as cantidad_articulos
              FROM detalle_ventas deve
              JOIN ventas v ON deve.deve_venta = v.ve_codigo
              WHERE MONTH(v.ve_fecha) = MONTH(CURDATE()) AND YEAR(v.ve_fecha) = YEAR(CURDATE())`;
        break;

      case "año":
        query = `
              SELECT 
                  SUM(deve.deve_cantidad) as cantidad_articulos
              FROM detalle_ventas deve
              JOIN ventas v ON deve.deve_venta = v.ve_codigo
              WHERE YEAR(v.ve_fecha) = YEAR(CURDATE())`;
        break;

      default:
        throw new Error("Tipo de periodo inválido");
    }
    return db.sql(query);
  }

  async function getVentaParaImpresion(ventaId) {
    const query = `
      SELECT
        ve.ve_codigo as codigo,
        case when ve.ve_credito = 1 then 'CREDITO' else 'CONTADO' end as tipo_venta,
        date_format(ve.ve_fecha, '%d/%m/%Y') as fecha_venta,
        date_format(ve.ve_hora, '%H:%i:%s') as hora_venta,
        date_format(ve.ve_vencimiento, '%d/%m/%Y') as fecha_vencimiento,
        op.op_nombre as cajero,
        op2.op_nombre as vendedor,
        cli.cli_razon as cliente,
        cli.cli_dir as direccion,
        cli.cli_tel as telefono,
        cli.cli_ruc as ruc,
        cli.cli_mail as cliente_correo,
        ve.ve_total as subtotal,
        mo.mo_descripcion as moneda,
        dep.dep_descripcion as deposito,
        ve.ve_descuento as total_descuento,
        (ve.ve_total - ve.ve_descuento) as total_a_pagar,
        SUM(deve.deve_exentas) as total_exentas,
        SUM(deve.deve_cinco) as total_cinco,
        SUM(deve.deve_diez) as total_diez,
        ve.ve_timbrado as timbrado,
        ve.ve_factura as factura,
        ve.ve_obs as observacion,
        ve.ve_cdc,
        ve.ve_qr,
        (SELECT EXISTS(SELECT 1 FROM config_recibo_electronica WHERE c_sucursal = ve.ve_sucursal AND c_estado = 1)) as usa_fe,
        IFNULL((SELECT co_monto FROM cotizaciones WHERE co_fecha = ve.ve_fecha AND co_moneda = 2 ORDER BY co_codigo DESC LIMIT 1),
        (SELECT co_monto FROM cotizaciones WHERE  co_moneda = 2 ORDER BY co_codigo DESC LIMIT 1)
        ) as cotizacion,
        date_format(
          (
            SELECT d_fecha_in FROM definicion_ventas WHERE d_nrotimbrado = ve.ve_timbrado
            AND d_comprobante = 1 AND d_activo = 1 AND d_sucursal = ve.ve_sucursal order by d_codigo asc LIMIT 1
          ),
          '%d/%m/%Y'
        ) as factura_valido_desde,
        date_format(
          (
            SELECT d_fecha_vence FROM definicion_ventas WHERE d_nrotimbrado = ve.ve_timbrado
            AND d_comprobante = 1 AND d_activo = 1 AND d_sucursal = ve.ve_sucursal order by d_codigo asc LIMIT 1
          ),
          '%d/%m/%Y'
        ) as factura_valido_hasta,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'codigo', deve.deve_articulo,
            'descripcion', IFNULL(dae.a_descripcion, ar.ar_descripcion),
            'cantidad', deve.deve_cantidad,
            'precio', deve.deve_precio,
            'descuento', deve.deve_descuento,
            'total', deve.deve_cantidad * deve.deve_precio,
            'exentas', deve.deve_exentas,
            'cinco', deve.deve_cinco,
            'diez', deve.deve_diez,
            'lote', dvv.lote,
            'fecha_vencimiento', al.al_vencimiento,
            'control_vencimiento', ar.ar_vencimiento
          )
        ) as detalles,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'sucursal_nombre', suc.descripcion,
            'sucursal_direccion', suc.direccion,
            'sucursal_telefono', suc.tel,
            'sucursal_empresa', suc.titular,
            'sucursal_ruc', suc.ruc_emp,
            'sucursal_matriz', CASE WHEN suc.matriz = 1 THEN 'Matriz' ELSE 'Nombre' END,
            'sucursal_ciudad', ciu.ciu_descripcion
          )
        ) as sucursal_data,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'nombre', cf.c_desc_nombre,
            'fantasia', cf.c_desc_fantasia,
            'direccion', cf.c_direccion,
            'telefono', cf.c_telefono,
            'ruc', cf.c_ruc,
            'correo', cf.c_correo,
            'descripcion_establecimiento', cf.c_descr_establecimiento,
            'dato_establecimiento', cf.c_dato2_establecimiento
          )
        ) as configuracion_factura_electronica
      FROM ventas ve
      INNER JOIN detalle_ventas deve ON ve.ve_codigo = deve.deve_venta
      INNER JOIN articulos ar ON deve.deve_articulo = ar.ar_codigo
      LEFT JOIN detalle_articulos_editado dae ON deve.deve_codigo = dae.a_detalle_venta
      LEFT JOIN detalle_ventas_vencimiento dvv ON deve.deve_codigo = dvv.id_detalle_venta
      LEFT JOIN articulos_lotes al ON dvv.loteid = al.al_codigo
      LEFT JOIN operadores op ON ve.ve_operador = op.op_codigo
      LEFT JOIN operadores op2 ON ve.ve_vendedor = op2.op_codigo
      LEFT JOIN clientes cli ON ve.ve_cliente = cli.cli_codigo
      LEFT JOIN sucursales suc ON ve.ve_sucursal = suc.id
      LEFT JOIN sucursal_ciudad sc ON suc.id = sc.sucursal
      LEFT  JOIN ciudades ciu ON sc.ciudad = ciu.ciu_codigo
      INNER JOIN monedas mo ON ve.ve_moneda = mo.mo_codigo
      INNER JOIN depositos dep ON ve.ve_deposito = dep.dep_codigo
      LEFT JOIN config_factura_electronica cf ON ve.ve_sucursal = cf.c_sucursal
      WHERE ve.ve_codigo = ${ventaId}
    `;

    console.log(query);

    const result = await db.sql(query);
    return result[0];
  }

  async function obtenerVentaParaEdicion(ventaId) {
    const query = `
      SELECT
      ve.ve_codigo as id,
      ve.ve_vendedor as vendedor,
      ve.ve_cliente as cliente,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'codigo', deve.deve_codigo,
          'articulo', deve.deve_articulo,
          'cantidad', deve.deve_cantidad,
          'precio', deve.deve_precio,
          'descuento', deve.deve_descuento,
          'lote', dvv.lote,
          'lote_id', dvv.loteid
        )
      ) as items
      FROM ventas ve
      INNER JOIN detalle_ventas deve ON ve.ve_codigo = deve.deve_venta
      INNER JOIN detalle_ventas_vencimiento dvv ON deve.deve_codigo = dvv.id_detalle_venta
      WHERE ve.ve_codigo = ${ventaId}
    `;
    return db.sql(query);
  }

  const actualizarCdc = async (codigo, cdc, qr) => {
    const query = `
      UPDATE ventas
      SET ve_cdc = '${cdc}', ve_qr = '${qr}'
      WHERE ve_codigo = ${codigo}
    `;
    return db.sql(query);
  };

  const getVentasParaAgenda = async (vendedor, cliente, busqueda) => {
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
        ve.ve_codigo as id,
        date_format(ve.ve_fecha, '%d/%m/%Y') as fecha,
        ( JSON_ARRAYAGG(
          JSON_OBJECT(
            'codigo', deve.deve_codigo,
            'cod_barras', ar.ar_codbarra,
            'descripcion', ar.ar_descripcion,
            'precio', deve.deve_precio,
            'cantidad', deve.deve_cantidad,
            'total', deve.deve_cantidad * deve.deve_precio
          )
        )) as articulos
      FROM ventas ve
      INNER JOIN detalle_ventas deve ON ve.ve_codigo = deve.deve_venta
      INNER JOIN articulos ar ON deve.deve_articulo = ar.ar_codigo
      LEFT JOIN articulos_lotes al ON ar.ar_codigo = al.al_codigo
      INNER JOIN detalle_ventas_vencimiento dvv ON deve.deve_codigo = dvv.id_detalle_venta
      WHERE ve.ve_cliente = ${cliente} ${where}
      GROUP BY ve.ve_codigo
      ORDER BY ve.ve_fecha DESC
      LIMIT 10 
    `;
    console.log(query);

    return db.sql(query);
  };

  return {
    uno,
    modificar,
    getCabeceras,
    getDetalles,
    getDetallesCliente,
    getResumen,
    agregarCabecera,
    agregarDetalle,
    agregarCuotas,
    agregarDetalleLote,
    actualizarStock,
    getAsientoAutomatico,
    asientoContableVenta,
    asientoContableCosto,
    agregarDetalleAsiento,
    agregarVenta,
    getMetodosPago,
    ActualizarDescripcionArticulo,
    traerIdDetalleVentas,
    idUltimaVenta,
    anularVenta,
    cobrarVenta,
    graficoVentas,
    totalVentasPorPeriodo,
    cantidadVentasPorPeriodo,
    cantidadArticulosVendidosPorPeriodo,
    consultaRuteo,
    calcularTotalesInforme,
    getVentaParaImpresion,
    agregarVentaNuevo,
    obtenerVentaParaEdicion,
    actualizarCdc,
    getVentasParaAgenda
  };
};
