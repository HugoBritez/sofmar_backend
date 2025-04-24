const CLIENTES = 'clientes';
const PROVEEDORES = 'proveedores';

module.exports = function(dbInyectada) {

  let db = dbInyectada;

  if(!db){
      db = require('../../DB/mysql.js');
  }

  function clientes(){
    const campos = " cli_codigo ";
    let where = ` cli_estado = 1 `;
    return db.todos(CLIENTES, campos, where);
  }

  function saldo_clientes(id){
    const query = `SELECT m.mo_codigo,
                    (SELECT IfNull(Sum(v.ve_saldo), 0) AS saldo FROM ventas v WHERE v.ve_moneda = m.mo_codigo AND v.ve_cliente = ${id} AND v.ve_credito = 1 AND v.ve_estado = 1) as saldo
                    FROM monedas m`;
    return db.sql(query);
  }

  function proveedores(){
    const campos = " pro_codigo ";
    let where = ` pro_estado = 1 `;    
    return db.todos(PROVEEDORES, campos, where);
  }

  function saldo_proveedores(id){
    const query = `SELECT m.mo_codigo,
                    (SELECT IfNull(Sum(c.co_saldo), 0) AS saldo FROM compras c WHERE c.co_moneda = m.mo_codigo AND c.co_proveedor = ${id} AND c.co_credito = 1 AND c.co_estado = 1) as saldo
                    FROM monedas m`;
    return db.sql(query);
  }

  function valor_stock(){
    const query = `SELECT
                    SUM(ar.ar_pvg) AS venta_guaranies,
                    SUM(ar.ar_pvd) AS venta_dolares
                  FROM
                    articulos ar
                    INNER JOIN articulos_lotes al ON al.al_articulo = ar.ar_codigo
                  WHERE
                    ar.ar_estado = 1
                    AND al.al_cantidad > 0
                    AND ar.ar_incluir_inventario = 1`;
    return db.sql(query);
  }

  async function cajaHabilitada(){
    const query = `SELECT
                    f.cd_descripcion AS caja,
                    IFNULL(
                        (SELECT
                          SUM(dmmc.monto) AS debe
                        FROM
                          operacion_caja_chica occ
                          INNER JOIN detalle_caja_chica dcc ON dcc.d_caja_chica = occ.o_codigo
                          INNER JOIN metodospago m ON occ.o_metodo = m.me_codigo
                          INNER JOIN operadores o ON occ.o_operador = o.op_codigo
                          INNER JOIN detalle_caja_ch_metodo dmmc ON dmmc.dccm_deca = dcc.d_codigo
                          INNER JOIN cuentas c ON occ.o_cuenta = c.cu_codigo
                        WHERE
                          dcc.d_estado = 1
                          AND c.cu_tipo =1
                          AND dmmc.dccm_metodo = 1
                          AND occ.o_reposicion < 3
                          AND occ.o_caja=j.ca_codigo),0) - IFNULL(                        
                        (SELECT
                          SUM(dmmc.monto) AS debe
                        FROM
                          operacion_caja_chica occ
                          INNER JOIN detalle_caja_chica dcc ON dcc.d_caja_chica = occ.o_codigo
                          INNER JOIN metodospago m ON occ.o_metodo = m.me_codigo
                          INNER JOIN operadores o ON occ.o_operador = o.op_codigo
                          INNER JOIN detalle_caja_ch_metodo dmmc ON dmmc.dccm_deca = dcc.d_codigo
                          INNER JOIN cuentas c ON occ.o_cuenta = c.cu_codigo
                        WHERE
                          dcc.d_estado = 1
                          AND c.cu_tipo = 2
                          AND dmmc.dccm_metodo = 1
                          AND occ.o_reposicion < 3
                          AND occ.o_caja=j.ca_codigo),0) AS saldo,
                    IF(j.ca_moneda=1,1,2) AS t
                  FROM
                    caja j
                    INNER JOIN cajadef f ON j.ca_definicion = f.cd_codigo
                  WHERE
                    j.ca_estado = 1
                    AND j.ca_situacion = 1
                    AND j.ca_tipo_caja = 1`;
                    
    return db.sql(query);
  }

  async function saldoBanco(){
    const query = `SELECT
                  CONCAT(b.ba_descripcion,' ',m.mo_descripcion) AS banco,
                  IFNULL(
                    (SELECT
                      IFNULL(SUM(mcc.mc_debe),0.00) AS saldo
                    FROM
                      movimientoscuentabco mcc
                      INNER JOIN movcuenta mc ON mcc.mc_movimiento = mc.mc_codigo
                    WHERE
                      mc.mc_cuenta = cb.cb_codigo
                      AND mc.mc_estado = 1
                      AND mc.mc_tipo in(1,6)),0.00) - (IFNULL(
                        (SELECT
                          IFNULL(SUM(mcc.mc_haber),0.00) AS saldo
                        FROM
                          movimientoscuentabco mcc
                          INNER JOIN movcuenta mc ON mcc.mc_movimiento = mc.mc_codigo
                        WHERE
                          mc.mc_cuenta = cb.cb_codigo
                          AND mc.mc_estado = 1
                          AND mc.mc_tipo in(2,5)),0.00) + IFNULL(
                            (SELECT
                              IFNULL(SUM(dmvc.dmc_importe),0.00) AS saldoChepro
                            FROM
                              movcuenta mc
                              INNER JOIN detalle_mov_chequera dmvc ON mc.mc_codigo = dmvc.dmc_movimiento
                            WHERE
                              mc.mc_cuenta = cb.cb_codigo
                              AND dmvc.dmc_situacion=1
                              AND dmvc.dmc_estado = 1),0.00) + IFNULL(
                                (SELECT
                                  IFNULL(SUM(dmch.dmc_monto),0.00) AS saldo
                                FROM
                                  movimientoscuentabco mcc
                                  INNER JOIN movcuenta mc ON mcc.mc_movimiento = mc.mc_codigo
                                  INNER JOIN detalle_mov_cheque dmch ON mc.mc_codigo = dmch.dmc_mov
                                WHERE
                                  mc.mc_cuenta = cb.cb_codigo
                                  AND dmch.dmc_estado = 0
                                  AND mc.mc_tipo in(1)),0.00)) AS saldo,
                  IF (cb.cb_moneda=1,3,4) as t
                FROM
                  cuentasbco cb
                  INNER JOIN bancos b ON cb.cb_banco = b.ba_codigo
                  INNER JOIN monedas m ON cb.cb_moneda = m.mo_codigo
                WHERE
                  cb.cb_estado = 1
                ORDER BY cb.cb_banco`;
                    
    return db.sql(query);
  }

  async function chequesDiferidos(){
    const query = `SELECT
                    CONCAT(b.ba_descripcion,' ',m.mo_descripcion) AS banco,
                    SUM(cd.importe) AS total,
                    IF(c.moneda=1,5,6) AS t
                  FROM
                    cheque_cobros_detalle cd
                    INNER JOIN cheques_cobros c ON cd.idChequeCobro = c.id
                    INNER JOIN bancos b ON cd.banco = b.ba_codigo
                    INNER JOIN monedas m ON c.moneda = m.mo_codigo
                  WHERE
                    cd.estado = 1
                    AND c.estado = 1
                    AND cd.depositado = 0 
                    AND cd.id NOT IN (SELECT de.d_referencia FROM detalle_efectivizar de INNER JOIN efectivizar_cheques ON de.d_efectivizar = efectivizar_cheques.e_codigo WHERE de.d_referencia = cd.id AND efectivizar_cheques.e_estado = 1)
                  GROUP BY
                    cd.banco, c.moneda`;
                    
    return db.sql(query);
  }

  async function ventasPorMes(desde, hasta){
    const query = `SELECT
                    SUM(ve.ve_total) AS ventas,
                    MONTH(ve.ve_fecha) AS mes
                  FROM
                    ventas ve
                  WHERE
                    ve.ve_estado = 1
                    AND ve.ve_fecha BETWEEN '${desde}' AND '${hasta}'
                  GROUP BY
                    MONTH(ve.ve_fecha)`;
    
    return db.sql(query);
  }

  async function comprasPorMes(desde, hasta){
    const query = `SELECT
                    SUM(co.co_total) AS compras,
                    MONTH(co.co_fecha) AS mes
                  FROM
                    compras co
                  WHERE
                    co.co_estado = 1
                    AND co.co_fecha BETWEEN '${desde}' AND '${hasta}'
                  GROUP BY
                    MONTH(co.co_fecha)`;

    return db.sql(query);
  }

  async function cobrosPorMes(desde, hasta){
    const query = `SELECT
                      mes,
                      SUM(cobros) AS total_cobros
                  FROM (
                      SELECT
                        SUM(d.deca_monto) AS cobros,
                        MONTH(o.oc_fecha) AS mes                        
                      FROM
                        operacion_caja o
                        INNER JOIN detalle_caja d ON d.deca_operacion = o.oc_codigo
                      WHERE
                        oc_cuenta = 2
                        AND oc_fecha BETWEEN '${desde}' AND '${hasta}'
                      GROUP BY
                        MONTH(oc_fecha)

                      UNION ALL

                      SELECT
                        SUM(d.d_monto) AS cobros,
                        MONTH(o.o_fecha) AS mes
                      FROM
                        operacion_caja_chica o
                        INNER JOIN detalle_caja_chica d ON d.d_caja_chica = o.o_codigo
                      WHERE
                        o.o_cuenta = 2
                        AND o.o_fecha BETWEEN '${desde}' AND '${hasta}'
                      GROUP BY
                        MONTH(o.o_fecha)
                  ) AS combined_result
                  GROUP BY
                      mes`;
    
    return db.sql(query);
  }

  async function pagosPorMes(desde, hasta){
    const query = `SELECT
                      mes,
                      SUM(pagos) AS total_pagos
                  FROM (
                      SELECT
                        SUM(d.deca_monto) AS pagos,
                        MONTH(o.oc_fecha) AS mes                        
                      FROM
                        operacion_caja o
                        INNER JOIN detalle_caja d ON d.deca_operacion = o.oc_codigo
                      WHERE
                        oc_cuenta = 4
                        AND oc_fecha BETWEEN '${desde}' AND '${hasta}'
                      GROUP BY
                        MONTH(oc_fecha)

                      UNION ALL

                      SELECT
                        SUM(d.d_monto) AS pagos,
                        MONTH(o.o_fecha) AS mes
                      FROM
                        operacion_caja_chica o
                        INNER JOIN detalle_caja_chica d ON d.d_caja_chica = o.o_codigo
                      WHERE
                        o.o_cuenta = 4
                        AND o.o_fecha BETWEEN '${desde}' AND '${hasta}'
                      GROUP BY
                        MONTH(o.o_fecha)
                  ) AS combined_result
                  GROUP BY
                      mes`;

    return db.sql(query);
  }

  async function presupuestos(desde, hasta){
    const query = `SELECT
    (SELECT COUNT(pre_codigo) FROM presupuesto WHERE pre_estado = 1 AND pre_fecha BETWEEN '${desde}' AND '${hasta}') AS presupuestos,
    (SELECT COUNT(pre_codigo) FROM presupuesto WHERE pre_estado = 1 AND pre_confirmado = 1 AND pre_fecha BETWEEN '${desde}' AND '${hasta}') AS presupuestos_realizados`;
    
    return db.sql(query);
  }

  async function presTabla(desde, hasta){
    const query = `SELECT
                    pre_operador,
                    op_nombre,
                    SUM(CASE WHEN pre_confirmado = 1 THEN 1 ELSE 0 END) AS confirmados,
                    COUNT(*) AS total,
                    CASE 
                      WHEN COUNT(*) > 0 THEN ROUND((SUM(CASE WHEN pre_confirmado = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2)
                      ELSE 0 
                    END AS efectividad
                  FROM
                    presupuesto
                    INNER JOIN operadores ON pre_operador = op_codigo
                  WHERE
                    pre_estado = 1
                    AND pre_fecha BETWEEN '${desde}' AND '${hasta}'
                  GROUP BY
                    op_codigo`;
    
    return db.sql(query);
  }

  return{
    clientes, saldo_clientes, proveedores, saldo_proveedores, valor_stock,
    cajaHabilitada, saldoBanco, chequesDiferidos,
    ventasPorMes, comprasPorMes, cobrosPorMes, pagosPorMes,
    presupuestos, presTabla
  } 
}