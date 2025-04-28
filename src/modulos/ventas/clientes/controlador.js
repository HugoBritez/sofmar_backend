const TABLA = 'clientes c';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }
    
    function getClientes(string_busqueda, id, id_cliente, estado = 1, limite ) {
      let where = `WHERE cli_estado = 1`;
      if(estado === 'true'){
        where = "WHERE 1=1";
      }
      if(id_cliente){
        where += ` AND cli_codigo = ${id_cliente}`;
      }
      if(id){
        where += ` AND cli_interno = ${id}`;
      }
      if (string_busqueda) {  
        where += ` AND (cli_razon LIKE '%${string_busqueda}%' OR cli_descripcion LIKE '%${string_busqueda}%' OR cli_ruc LIKE '%${string_busqueda}%')`;
      }

      const query = `
        SELECT
            cli_codigo,
            cli_razon, 
            cli_descripcion,
            cli_ruc,
            cli_interno,
            cli_ciudad,
            zo.zo_descripcion as zona,
            ciu.ciu_descripcion as cli_ciudad_descripcion,
            dep.dep_codigo as cli_departamento,
            dep.dep_descripcion,
            d.d_codigo as cli_distrito,
            d.d_descripcion as cli_distrito_descripcion,
            FORMAT(ROUND(cli_limitecredito), 0, 'es_ES') AS cli_limitecredito,
            FORMAT(ROUND(IFNULL((
               SELECT SUM(ve_saldo)
               FROM ventas
               WHERE ve_cliente = cli_codigo
               AND ve_credito = 1
               AND ve_estado = 1
            ), 0)), 0, 'es_ES') AS deuda_actual,
            FORMAT(ROUND(cli_limitecredito - IFNULL((
               SELECT COALESCE(SUM(ve_saldo), 0)
               FROM ventas
               WHERE ve_cliente = cli_codigo
               AND ve_credito = 1
               AND ve_estado = 1
            ), 0)), 0, 'es_ES') AS credito_disponible,
            cli_vendedor as vendedor_cliente,
            cli_dir,
            cli_tel,
            cli_mail,
            cli_ci,
            cli_tipo_doc,
            cli_estado as estado
        FROM clientes 
        INNER JOIN ciudades ciu ON cli_ciudad = ciu.ciu_codigo
        INNER JOIN distritos d ON ciu.ciu_distrito = d.d_codigo
        INNER JOIN departamentos dep ON cli_departamento = dep.dep_codigo
        LEFT JOIN zonas zo ON zo.zo_codigo = cli_zona
        ${where} ${limite ? `LIMIT ${limite}` : "LIMIT 5"}`;

      console.log(query);
      return db.sql(query);
    }


    function todos(string_busqueda, vendedor=0){
        const campos = " * "
        let where = "cli_estado = 1"
        
        if (vendedor > 0) {
            where += ` AND cli_vendedor = ${vendedor}`;
        }
        // Solo agregar condición de búsqueda si hay texto válido
        if (string_busqueda && string_busqueda.trim().length > 0) {
            where += ` AND (cli_razon LIKE '%${string_busqueda}%' OR cli_descripcion LIKE '%${string_busqueda}%' OR cli_ruc LIKE '%${string_busqueda}%')`
            // Limitar resultados solo cuando hay búsqueda
            where += " LIMIT 100";
        }
        console.log(string_busqueda);
        console.log(where);
        return db.todos(TABLA, campos, where);
    }


    function todos_por_vendedor(vendedor){
        const query = `SELECT c.* FROM clientes c WHERE c.cli_estado = 1 AND c.cli_vendedor = ${vendedor} LIMIT 100`;

        return db.sql(query);
    }


    function agregar(datos){
        const primary_key_value = datos.cli_codigo;
        const primary_key_name = "cli_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const query = `SELECT
                          c.cli_codigo, c.cli_interno, c.cli_razon, c.cli_descripcion, c.cli_ci, c.cli_ruc, c.cli_dir, c.cli_tel, c.cli_mail, c.cli_limitecredito, c.cli_plazo, c.cli_tipo_doc,

                          o.op_nombre AS agente,
                          p.p_descripcion AS plazo,

                          cds.ciu_codigo AS ciu_codigo,
                          cds.ciu_descripcion AS ciu_descripcion,
                          t.d_cod_interno AS dist_codigo,
	                        t.d_descripcion AS dist_descripcion,
                          d.dep_codigo,
                          d.dep_descripcion
                        FROM
                          clientes c
                          INNER JOIN operadores o ON c.cli_agente = o.op_codigo
                          INNER JOIN tipo_plazo p ON c.cli_plazo = p.p_codigo

                          INNER JOIN ciudades cds ON c.cli_ciudad = cds.ciu_codigo
                          INNER JOIN distritos t on cds.ciu_distrito = t.d_codigo
                          INNER JOIN departamentos d ON c.cli_departamento = d.dep_codigo
                        WHERE c.cli_codigo = ${id}`;
        return db.sql(query);
    }
    
    function eliminar(id){
        const where_update = "c.cli_codigo = " + id;
        const set_campo = " cli_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    function saldo(id){
        const query = `SELECT m.mo_codigo,
                        (SELECT IfNull(Sum(v.ve_saldo), 0) AS saldo FROM ventas v WHERE v.ve_moneda = m.mo_codigo AND v.ve_cliente = ${id} AND v.ve_credito = 1 AND v.ve_estado = 1) as saldo
                        FROM monedas m`;
        return db.sql(query);
    }

    async function ultimos(id){
      let ult_compra = "0001-01-01";
      let ult_pago = "0001-01-01";

      const ult_compra_query = `SELECT DATE_FORMAT(ve_fecha, '%Y-%m-%d') AS ve_fecha FROM ventas WHERE ve_cliente = ${id} ORDER BY ve_fecha DESC LIMIT 1`;
      const ult_compra_array = await db.sql(ult_compra_query);
      if (ult_compra_array.length > 0) ult_compra = ult_compra_array[0].ve_fecha;

      const ult_pago_query = `SELECT MAX(getultimocobro(dvc_venta, dvc_numero)) AS fecha_pago FROM detalle_ventas_cuota d WHERE dvc_venta IN (SELECT ve_codigo FROM ventas WHERE ve_cliente = ${id})`;
      const ult_pago_array = await db.sql(ult_pago_query);
      /*if (ult_pago_array[0].fecha_pago != null)*/ ult_pago = ult_pago_array[0].fecha_pago;

      const resultado = {ult_compra: ult_compra, ult_pago: ult_pago};
      return resultado
    }

    return{
        todos, agregar, uno, eliminar, saldo, ultimos, todos_por_vendedor, getClientes
    } 
}