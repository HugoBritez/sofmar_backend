const TABLA = "agendas";
const NOTAS = "agendas_notas";
const LOCALIZACIONES = "localizacion";

module.exports = function (dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require("../../DB/mysql.js");
  }

  function todos(
    fecha_desde,
    fecha_hasta,
    cliente,
    vendedor,
    visitado,
    estado,
    planificacion,
    notas,
    orden
  ) {


    console.log('vendedor', vendedor);

    let where = "1=1 ";
    let having = "";
    let order = "";
    if (fecha_desde != "") where += ` AND a_fecha >= '${fecha_desde}'`;
    if (fecha_hasta != "") where += ` AND a_fecha <= '${fecha_hasta}'`;


    if (cliente > 0 || cliente != null) where += ` AND a_cliente IN  (${cliente})`;
    if (vendedor > 0 && vendedor != null) where += ` AND a_vendedor IN (${vendedor})`;
    if (visitado != -1) where += ` AND a_visitado = ${visitado}`;


    if (estado != -1) where += ` AND a_estado = ${estado}`;
    if (planificacion != -1) where += ` AND a_planificacion = ${planificacion}`;
    if (notas == 0) having += " HAVING cant_notas = 0";
    if (notas == 1) having += " HAVING cant_notas > 0";

    switch (orden) {
      case "0": //Prioridad
        order = "ORDER BY a_prioridad DESC, a_fecha ASC";
        break;
      case "1": //Código
        order = "ORDER BY a_codigo ASC";
        break;
      case "2": //Fecha
        order = "ORDER BY a_fecha DESC, a_hora ASC";
        break;
    }

    let query = `SELECT
                    a.*,
                    IFNULL(a_prox_acti, "") AS prox_acti,
                    IF(a_visitado=0, 'No', 'Sí') AS visitado,
                    IF(a_prioridad=0, "Común", IF(a_prioridad=1, "Baja", IF(a_prioridad=2, "Moderada", IF(a_prioridad=3, "Alta", "-")))) AS prioridad,
                    IF(a_visitado_prox=0, 'No', 'Sí') AS visita_prox,
                    IF(a_planificacion=0, 'No', 'Sí') AS planificacion,
                    DATE_FORMAT(a_fecha, '%Y-%m-%d') AS fecha,
                    DATE_FORMAT(a_prox_llamada, '%Y-%m-%d') AS f_prox,
                    cli.cli_codigo as cliente_id,
                    cli.cli_razon AS cliente,
                    (SELECT SUM(ve_saldo) FROM ventas WHERE ve_cliente = cli.cli_codigo AND ve_estado = 1) AS deudas_cliente,
                    cli.cli_ruc,
                    cli.cli_tel,
                    cli.cli_dir,
                    op.op_codigo AS vendcod,
                    op.op_nombre AS vendedor,
                    l.l_latitud,
                    l.l_longitud,
                    l.l_hora_inicio,
                    l.l_hora_fin,
                    IF(l.l_hora_inicio IS NOT NULL AND l.l_hora_inicio != '', 1, 0) AS visita_en_curso,
                    CASE 
                      WHEN TIMESTAMPDIFF(MINUTE, 
                        CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'), ' ', l.l_hora_inicio),
                        CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'), ' ', l.l_hora_fin)
                      ) < 60 THEN 
                        CONCAT(TIMESTAMPDIFF(MINUTE, 
                          CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'), ' ', l.l_hora_inicio),
                          CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'), ' ', l.l_hora_fin)
                        ), ' minutos')
                      ELSE 
                        CONCAT(
                          FLOOR(TIMESTAMPDIFF(MINUTE, 
                            CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'), ' ', l.l_hora_inicio),
                            CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'), ' ', l.l_hora_fin)
                          ) / 60), ' horas ',
                          MOD(TIMESTAMPDIFF(MINUTE, 
                            CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'), ' ', l.l_hora_inicio),
                            CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'), ' ', l.l_hora_fin)
                          ), 60), ' minutos'
                        )
                    END AS tiempo_transcurrido,
                    IF(l.l_hora_inicio IS NOT NULL AND l.l_hora_inicio != '', 1, 0) AS visita_en_curso,
                    (SELECT COUNT(a_codigo) FROM agendas WHERE a_cliente = cli.cli_codigo) AS total_visitas_cliente,
                    (SELECT COUNT(a_codigo) FROM agendas b WHERE b.a_vendedor = a.a_vendedor) AS mis_visitas,
                    (SELECT COUNT(a_codigo) FROM agendas c WHERE c.a_vendedor = a.a_vendedor AND c.a_cliente = a.a_cliente) AS mis_visitas_cliente,
                    COUNT(DISTINCT an.an_codigo) AS cant_notas,
                    (
                      SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                          'id', an_codigo,
                          'fecha', DATE_FORMAT(an_fecha, '%d/%m/%Y'),
                          'hora', TIME_FORMAT(an_hora, '%H:%i'),
                          'nota', an_nota
                        )
                      ) 
                      FROM (
                        SELECT DISTINCT an_codigo, an_fecha, an_hora, an_nota 
                        FROM agendas_notas 
                        WHERE an_agenda_id = a.a_codigo
                      ) temp_notas
                    ) AS notas,
                    (
                      SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                          'id', id,
                          'nombre_cliente', nombre_cliente,
                          'motivo_visita', motivo_visita,
                          'resultado_visita', resultado_visita
                        )
                      )
                      FROM (
                        SELECT DISTINCT id, nombre_cliente, motivo_visita, resultado_visita 
                        FROM agenda_subvisitas 
                        WHERE id_agenda = a.a_codigo
                      ) temp_subvisitas
                    ) AS subvisitas
                    FROM
                    agendas a
                    INNER JOIN clientes cli ON a.a_cliente = cli.cli_codigo
                    INNER JOIN operadores op ON a.a_vendedor = op.op_codigo
                    LEFT JOIN agendas_notas an ON a.a_codigo = an.an_agenda_id
\                    LEFT JOIN localizacion l ON a.a_codigo = l.l_agenda
                  WHERE
                    ${where}
                  GROUP BY a_codigo
                    ${order} ${having}`;

    console.log(query);
    return db.sql(query);
  }
  
  function notas(id) {
    const campos = " *, DATE_FORMAT(an_fecha, '%Y-%m-%d') AS fecha ";
    const where = `an_agenda_id = ${id} `;
    return db.todos(NOTAS, campos, where);
  }

  function localizaciones(id) {
    const campos =
      " *, DATE_FORMAT(l_fecha, '%Y-%m-%d') AS fecha, IF(l_acuracia<50, 'Precisa', IF(l_acuracia BETWEEN 50 AND 100, 'Moderada', 'Imprecisa')) AS ubicacion";
    const where = `l_agenda = ${id} `;
    return db.todos(LOCALIZACIONES, campos, where);
  }

  function agregar(datos) {
    const primary_key_value = datos.a_codigo;
    const primary_key_name = "a_codigo";
    return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
  }

  function agregarNota(datos) {
    const primary_key_value = 0;
    const primary_key_name = "an_codigo";
    return db.agregar(NOTAS, datos, primary_key_value, primary_key_name);
  }

  function registrarLlegada(id) {
    const query = `UPDATE ${TABLA} SET a_visitado = 1 WHERE a_codigo = ${id}`;
    console.log(query);
    return db.sql(query);
  }

  function registrarSalida(l_agenda, l_hora_fin) {
    const query = `UPDATE ${LOCALIZACIONES} SET l_hora_fin = TIME_FORMAT(NOW(), '%H:%i') WHERE l_agenda = ${l_agenda}`;
    return db.sql(query);
  }

  function finalizarVisita(id, latitud, longitud) {
    const query = `UPDATE ${TABLA} SET a_visitado = 1, a_latitud = ${latitud}, a_longitud = ${longitud} WHERE a_codigo = ${id}`;
    return db.sql(query);
  }

  function reagendarVisita(a_codigo, a_prox_llamada, a_hora_prox, a_dias) {
    const query = `UPDATE ${TABLA} SET a_fecha = '${a_prox_llamada}', a_hora = '${a_hora_prox}', a_dias = '${a_dias}' WHERE a_codigo = ${a_codigo}`;
    return db.sql(query);
  }

  function anularVisita(a_codigo) {
    const query = `UPDATE ${TABLA} SET a_estado = 0 WHERE a_codigo = ${a_codigo}`;
    return db.sql(query);
  }

  function agregarLocalizacion(datos) {
    const primary_key_value = datos.l_codigo;
    const primary_key_name = "l_codigo";
    return db.agregar(
      LOCALIZACIONES,
      datos,
      primary_key_value,
      primary_key_name
    );
  }


  function uno(id) {
    const primary_key = `a_codigo = ${id} `;
    const campos = " * ";
    return db.uno(TABLA, primary_key, campos);
  }

  function eliminar(id) {
    const where_update = "a_codigo = " + id;
    const set_campo = " a_estado = 0 ";
    return db.eliminar(TABLA, where_update, set_campo);
  }

  async function agendamientos(
    desde,
    hasta,
    user,
    mes_actual_inicio,
    mes_anterior_inicio
  ) {
    let where_user = "";
    if (user != 0) where_user = `a_operador = ${user} AND`;
    const query = `SELECT
                    (SELECT COUNT(a_codigo) FROM agendas WHERE ${where_user} a_fecha BETWEEN '${desde}' AND '${hasta}') AS agendamientos,
                    (SELECT COUNT(a_codigo) FROM agendas WHERE ${where_user} a_estado = 1 AND a_planificacion = 1 AND a_fecha BETWEEN '${desde}' AND '${hasta}') AS planificaciones,
                    (SELECT COUNT(a_codigo) FROM agendas WHERE ${where_user} a_estado = 1 AND a_visitado = 1 AND a_fecha BETWEEN '${desde}' AND '${hasta}') AS cerrados,
                    (SELECT COUNT(a_codigo) FROM agendas WHERE ${where_user} a_estado = 1 AND a_visitado = 0 AND a_fecha BETWEEN '${desde}' AND '${hasta}') AS pendientes,
                    (SELECT COUNT(a_codigo) FROM agendas WHERE ${where_user} a_fecha BETWEEN '${mes_actual_inicio}' AND LAST_DAY('${mes_actual_inicio}')) AS agendamientos_actual,
                    (SELECT COUNT(a_codigo) FROM agendas WHERE ${where_user} a_fecha BETWEEN '${mes_anterior_inicio}' AND LAST_DAY('${mes_anterior_inicio}')) AS agendamientos_anterior,
                    (SELECT COUNT(a_codigo) FROM agendas WHERE ${where_user} a_estado = 1 AND a_visitado = 1 AND a_fecha BETWEEN '${mes_actual_inicio}' AND LAST_DAY('${mes_actual_inicio}')) AS cerrados_actual,
                    (SELECT COUNT(a_codigo) FROM agendas WHERE ${where_user} a_estado = 1 AND a_visitado = 0 AND a_fecha BETWEEN '${mes_actual_inicio}' AND LAST_DAY('${mes_actual_inicio}')) AS pendientes_actual,
                    (SELECT COUNT(a_codigo) FROM agendas WHERE ${where_user} a_estado = 1 AND a_visitado = 1 AND a_fecha BETWEEN '${mes_anterior_inicio}' AND LAST_DAY('${mes_anterior_inicio}')) AS cerrados_anterior,
                    (SELECT COUNT(a_codigo) FROM agendas WHERE ${where_user} a_estado = 1 AND a_visitado = 0 AND a_fecha BETWEEN '${mes_anterior_inicio}' AND LAST_DAY('${mes_anterior_inicio}')) AS pendientes_anterior,

                    (SELECT COUNT(a_codigo) FROM agendas WHERE ${where_user} a_estado = 1 AND a_planificacion = 1 AND a_visitado = 0 AND a_fecha BETWEEN '${desde}' AND '${hasta}') AS plan_no_visitadas,
                    (SELECT COUNT(a_codigo) FROM agendas WHERE ${where_user} a_estado = 0 AND a_planificacion = 1 AND a_fecha BETWEEN '${desde}' AND '${hasta}') AS plan_anuladas`;

    return db.sql(query);
  }

  async function contarAgendamientos(desde, hasta, vendedor) {
    let where = "";
    if (vendedor != 0) {
      where = `a_vendedor = ${vendedor} AND `;
    }
    const query = `SELECT
                    COUNT(a_codigo) AS total_general,
                    SUM(CASE WHEN a_visitado = 1 THEN 1 ELSE 0 END) AS visitados,
                    SUM(CASE WHEN a_visitado = 0 THEN 1 ELSE 0 END) AS no_visitados,
                    SUM(CASE WHEN a_estado = 0 THEN 1 ELSE 0 END) AS anulados
                  FROM
                    agendas
                  WHERE
                    ${where}
                    a_fecha BETWEEN '${desde}' AND '${hasta}'`;

    return db.sql(query);
  }

  async function tiempoPromedioVisitas(desde, hasta, vendedor) {
    let where = "";
    if (vendedor != 0) where = `l_operador = ${vendedor} AND `;
    const query = `SELECT
                  AVG(TIMESTAMPDIFF(MINUTE, l_hora_inicio, l_hora_fin)) AS tiempo_promedio_visita
                FROM
                  localizacion
                WHERE
                  ${where}
                  l_estado = 1
                  AND l_hora_fin IS NOT NULL
                  AND l_hora_inicio IS NOT NULL
                  AND l_hora_fin != ''
                  AND l_hora_inicio != ''
                  AND TIMESTAMPDIFF(SECOND, l_hora_inicio, l_hora_fin) >= 60
                  AND l_fecha BETWEEN '${desde}' AND '${hasta}'`;

    return db.sql(query);
  }

  async function topVendedores(desde, hasta) {
    const query = `SELECT
                  COUNT(a_codigo) AS cantidad,
                  a_vendedor,
                  op_nombre,
                  (select count(*) from operadores op
                    inner join operador_roles orol on orol.or_operador = op.op_codigo
                    where orol.or_rol = 5 and op.op_estado = 1) as vendedores_activos,
                  (SELECT SUM(ve_total) 
                   FROM ventas 
                   WHERE ve_vendedor = a_vendedor 
                   AND ve_fecha BETWEEN '${desde}' AND '${hasta}') AS total_ventas
                FROM
                  agendas
                  INNER JOIN operadores ON a_vendedor = op_codigo
                WHERE
                  a_fecha BETWEEN '${desde}' AND '${hasta}'
                GROUP BY a_vendedor
                ORDER BY total_ventas DESC`;
    return db.sql(query);
  }

  async function topClientes(desde, hasta) {
    const query = `SELECT
                    COUNT(a_codigo) AS cantidad,
                    a_cliente as cliente_id,
                    cli_razon as cliente_nombre,
                    (SELECT SUM(ve_total) 
                     FROM ventas 
                     WHERE ve_cliente = a_cliente 
                     AND ve_fecha BETWEEN '${desde}' AND '${hasta}') AS total_ventas
                  FROM
                    agendas
                    INNER JOIN clientes ON a_cliente = cli_codigo
                  WHERE
                    a_fecha BETWEEN '${desde}' AND '${hasta}'
                  GROUP BY a_cliente
                  ORDER BY total_ventas DESC
                  LIMIT 3`;
    return db.sql(query);
  }

  async function obtenerDatosGrafico(desde, hasta) {
    const diffInDays =
      (new Date(hasta) - new Date(desde)) / (1000 * 60 * 60 * 24);
    let interval;
    let dateFormat;

    // Determinar el intervalo de agrupación
    if (diffInDays <= 1) {
      interval = "HOUR";
      dateFormat = "%H:00:00"; // Agrupar por hora
    } else if (diffInDays <= 7) {
      interval = "DAY";
      dateFormat = "%d"; // Agrupar por día
    } else {
      interval = "THREE_DAYS";
      dateFormat = "%m-%d"; // Agrupar por fecha, luego agrupar de 3 en 3
    }

    // Consulta SQL con formato de fecha
    const query = `
    SELECT
      DATE_FORMAT(a_fecha, '${dateFormat}') AS fecha,
      SUM(CASE WHEN a_visitado = 1 THEN 1 ELSE 0 END) AS visitados,
      SUM(CASE WHEN a_visitado = 0 THEN 1 ELSE 0 END) AS no_visitados
    FROM
      agendas
    WHERE
      a_fecha BETWEEN '${desde}' AND '${hasta}'
    GROUP BY fecha
    ORDER BY fecha;
  `;

    // Ejecutar la consulta
    const results = await db.sql(query);

    // Si el intervalo es de tres días, agrupar manualmente los resultados
    if (interval === "THREE_DAYS") {
      const groupedResults = [];
      for (let i = 0; i < results.length; i += 3) {
        const group = results.slice(i, i + 3);
        const visitados = group.reduce(
          (sum, item) => sum + parseInt(item.visitados),
          0
        );
        const no_visitados = group.reduce(
          (sum, item) => sum + parseInt(item.no_visitados),
          0
        );
        groupedResults.push({
          fecha: group[0].fecha, // Fecha del primer elemento del grupo
          visitados,
          no_visitados,
        });
      }
      return groupedResults;
    }

    return results;
  }

  async function obtenerDatosGraficoPorVendedor(desde, hasta, vendedor) {
    const diffInDays =
      (new Date(hasta) - new Date(desde)) / (1000 * 60 * 60 * 24);
    let interval;
    let dateFormat;
    let where = "";

    // Añadir condición de vendedor si es necesario
    if (vendedor !== 0) {
      where = `a_vendedor = ${vendedor} AND `;
    }

    // Determinar el formato de fecha y el intervalo de agrupación
    if (diffInDays <= 1) {
      interval = "HOUR";
      dateFormat = "%Y-%m-%d %H:00:00"; // Agrupar por hora
    } else if (diffInDays <= 7) {
      interval = "DAY";
      dateFormat = "%Y-%m-%d"; // Agrupar por día
    } else {
      interval = "THREE_DAYS";
      dateFormat = "%Y-%m-%d"; // Agrupar por fecha, se procesará en grupos de 3 días
    }

    // Construir la consulta SQL
    const query = `
    SELECT
      DATE_FORMAT(a_fecha, '${dateFormat}') AS fecha,
      SUM(CASE WHEN a_visitado = 1 THEN 1 ELSE 0 END) AS visitados,
      SUM(CASE WHEN a_visitado = 0 THEN 1 ELSE 0 END) AS no_visitados
    FROM
      agendas
    WHERE
      ${where}
      a_fecha BETWEEN '${desde}' AND '${hasta}'
    GROUP BY fecha
    ORDER BY fecha;
  `;

    // Ejecutar la consulta
    const results = await db.sql(query);

    // Agrupación manual de resultados si el intervalo es de tres días
    if (interval === "THREE_DAYS") {
      const groupedResults = [];
      for (let i = 0; i < results.length; i += 3) {
        const group = results.slice(i, i + 3);
        const visitados = group.reduce(
          (sum, item) => sum + parseInt(item.visitados, 10),
          0
        );
        const no_visitados = group.reduce(
          (sum, item) => sum + parseInt(item.no_visitados, 10),
          0
        );
        groupedResults.push({
          fecha: group[0].fecha, // Fecha del primer elemento del grupo
          visitados,
          no_visitados,
        });
      }
      return groupedResults;
    }

    return results;
  }

  async function clientes(mes_actual) {
    const query = `SELECT
                    COUNT(cli_codigo) AS total_clientes,
                    (SELECT COUNT(cli_codigo) FROM clientes WHERE cli_fechaAd BETWEEN '${mes_actual}' AND LAST_DAY('${mes_actual}')) AS clientes_mes
                  FROM clientes`;

    return db.sql(query);
  }

  async function ruteos(desde, hasta, user, mes_actual, mes_anterior) {
    let where_user = "";
    if (user != 0) where_user = `l_operador = ${user} AND`;
    const query = `SELECT
                    (SELECT COUNT(l_codigo) AS total FROM localizacion WHERE ${where_user} l_estado = 1 AND l_fecha BETWEEN '${desde}' AND '${hasta}') AS total,
                    (SELECT COUNT(l_codigo) as mes_actual FROM localizacion WHERE ${where_user} l_estado = 1 AND l_fecha BETWEEN '${mes_actual}' AND LAST_DAY('${mes_actual}')) AS mes_actual,
                    (SELECT COUNT(l_codigo) as mes_anterior FROM localizacion WHERE ${where_user} l_estado = 1 AND l_fecha BETWEEN '${mes_anterior}' AND LAST_DAY('${mes_anterior}')) AS mes_anterior`;

    return db.sql(query);
  }

  async function ruteoPorVendedor(desde, hasta) {
    const query = `SELECT
                    COUNT(l_codigo) as cantidad,
                    l_operador,
                    op_nombre
                  FROM
                    localizacion
                    INNER JOIN operadores ON l_operador = op_codigo
                  WHERE
                    l_estado = 1
                    AND l_fecha BETWEEN '${desde}' AND '${hasta}'
                  GROUP BY l_operador
                  ORDER BY cantidad DESC`;

    return db.sql(query);
  }

  async function planificacionesPorMes(desde, hasta) {
    const query = `SELECT
                    COUNT(a.a_codigo) AS mensual_total,
                    COUNT(CASE WHEN a.a_visitado = 1 THEN a.a_codigo END) AS mensual_visitado,
                    MONTH(a.a_fecha) AS mes
                  FROM
                    agendas a
                  WHERE
                    a.a_estado = 1
                    AND a.a_planificacion = 1
                    AND a.a_fecha BETWEEN '${desde}' AND '${hasta}'
                  GROUP BY
                    MONTH(a.a_fecha)`;

    return db.sql(query);
  }

  async function planificacionesPorVend(desde, hasta) {
    const query = `SELECT
                    COUNT(a_codigo) AS cantidad,
                    a_vendedor,
                    op_nombre,
                    a_vendedor AS operador_principal,
                    (SELECT COUNT(a_codigo) AS cantidad_si FROM agendas WHERE a_visitado = 1 AND a_vendedor = operador_principal) AS cant_visitado
                  FROM
                    agendas
                    INNER JOIN operadores ON a_vendedor = op_codigo
                  WHERE
                    a_fecha BETWEEN '${desde}' AND '${hasta}'
                  GROUP BY a_vendedor
                  ORDER BY cantidad DESC
                  LIMIT 10`;

    return db.sql(query);
  }

  async function consultarPedidosYDetalles(cliente) {
    const query = `
    SELECT
      p_codigo as id_pedido,
      DATE_FORMAT(p_fecha, '%Y-%m-%d') as fecha_pedido,
      cli.cli_razon as cliente,
      op.op_nombre as vendedor,
      (SELECT SUM(dp_precio * dp_cantidad) FROM detalle_pedido WHERE dp_pedido = p_codigo) as total_pedido,

      (SELECT JSON_ARRAYAGG(JSON_OBJECT(
        'id_detalle', dp_codigo,
        'id_producto', dp_articulo,
        'producto', ar.ar_descripcion,
        'cantidad', FLOOR(dp_cantidad),
        'precio', dp_precio
      )) FROM detalle_pedido dp 
      INNER JOIN articulos ar ON dp_articulo = ar.ar_codigo
      WHERE dp_pedido = p_codigo) as detalles
    FROM pedidos
    INNER JOIN clientes cli ON p_cliente = cli.cli_codigo
    INNER JOIN operadores op ON p_vendedor = op.op_codigo
    WHERE
      p_cliente = ${cliente}
    ORDER BY p_fecha DESC
    LIMIT 3
    `;
    console.log(query);
    return db.sql(query);
  }

  async function consultarVentasYDetalles(cliente) {
    const query = `

    SELECT
      ve_codigo as id_venta,
      DATE_FORMAT(ve_fecha, '%Y-%m-%d') as fecha_venta,
      ve_total as total_venta,
      cli.cli_razon as cliente,
      op.op_nombre as vendedor,

      (SELECT JSON_ARRAYAGG(JSON_OBJECT(
        'id_detalle', deve_codigo,
        'id_producto', deve_articulo,
        'producto', ar.ar_descripcion,
        'cantidad', FLOOR(deve_cantidad),
        'precio', deve_precio
      )) FROM detalle_ventas deve 
      INNER JOIN articulos ar ON deve_articulo = ar.ar_codigo
      WHERE deve.deve_venta = ve_codigo) as detalles
    FROM ventas
    INNER JOIN clientes cli ON ve_cliente = cli.cli_codigo
    INNER JOIN operadores op ON ve_vendedor = op.op_codigo
    WHERE
      ve_cliente = ${cliente}
    ORDER BY ve_fecha DESC
    LIMIT 3
    `;
    console.log(query);
    return db.sql(query);
  }

  async function crearSubvisita(datos) {
    const query = `INSERT INTO agenda_subvisitas (id_cliente, id_agenda, nombre_cliente, motivo_visita, resultado_visita) VALUES (${datos.id_cliente}, ${datos.id_agenda}, '${datos.nombre_cliente}', '${datos.motivo_visita}', '${datos.resultado_visita}')`
    return db.sql(query);
  }

  async function actualizarSubvisita(datos) {
    // Extraer el ID y los campos a actualizar
    const { id, ...camposActualizar } = datos;
    
    // Construir la parte SET del query dinámicamente
    const setCampos = Object.entries(camposActualizar)
        .map(([key, value]) => {
            // Si el valor es string o es null, añadir comillas
            const valorFormateado = value === null ? 'NULL' :
                typeof value === 'string' ? `'${value}'` : value;
            return `${key} = ${valorFormateado}`;
        })
        .join(', ');
    
    const query = `UPDATE agenda_subvisitas SET ${setCampos} WHERE id = ${id}`;
    return db.sql(query);
  }

  async function getSubvisitas(id_agenda) {
    const query = `SELECT id, nombre_cliente, motivo_visita, resultado_visita FROM agenda_subvisitas WHERE id_agenda = ${id_agenda}`
    return db.sql(query);
  }

  return {
    todos,
    notas,
    localizaciones,
    agregar,
    agregarNota,
    registrarLlegada,
    registrarSalida,
    finalizarVisita,
    agregarLocalizacion,
    uno,
    eliminar,
    agendamientos,
    clientes,
    ruteos,
    ruteoPorVendedor,
    planificacionesPorMes,
    planificacionesPorVend,
    reagendarVisita,
    anularVisita,
    contarAgendamientos,
    tiempoPromedioVisitas,
    topClientes,
    topVendedores,
    obtenerDatosGrafico,
    obtenerDatosGraficoPorVendedor,
    consultarVentasYDetalles,
    consultarPedidosYDetalles,
    crearSubvisita,
    getSubvisitas,
    actualizarSubvisita,
  };
};
