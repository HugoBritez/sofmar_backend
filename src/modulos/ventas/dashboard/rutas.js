const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')

router.get('/', resumen)
router.get('/presupuestos/', presupuestos)

async function resumen (req, res, next){
  try {
    const hoy = new Date();
    // const mes_actual_date = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    // const mes_anterior_date = new Date(hoy.getFullYear(), hoy.getMonth()-1, 1);
    // const mes_actual_inicio = `${mes_actual_date.getFullYear()}-${("0" + (mes_actual_date.getMonth()+1)).toString().slice(-2)}-${("0" + (mes_actual_date.getDate())).toString().slice(-2)}`;
    // const mes_anterior_inicio = `${mes_anterior_date.getFullYear()}-${("0" + (mes_anterior_date.getMonth()+1)).toString().slice(-2)}-${("0" + (mes_anterior_date.getDate())).toString().slice(-2)}`;

    /////////////////////Clientes activos, saldos y valor de stock
    const clientes = await controlador.clientes();
    let clientes_saldog = 0;
    let clientes_saldod = 0;
    if (clientes.length > 0){
      for (c in clientes){
        //Saldos
        const saldos = await controlador.saldo_clientes(clientes[c].cli_codigo);

        for (s in saldos){
          if (saldos[s].mo_codigo === 1) clientes_saldog += parseFloat(saldos[s].saldo);
          if (saldos[s].mo_codigo === 2) clientes_saldod += parseFloat(saldos[s].saldo);
          // if (saldos[s].mo_codigo === 3) clientes_saldor = parseFloat(saldos[s].saldo);
          // if (saldos[s].mo_codigo === 4) clientes_saldop = parseFloat(saldos[s].saldo);
        }
      }
    }
    
    const proveedores = await controlador.proveedores();
    let proveedores_saldog = 0;
    let proveedores_saldod = 0;
    if (proveedores.length > 0){
      for (p in proveedores){
        //Saldos
        const saldos = await controlador.saldo_proveedores(proveedores[p].pro_codigo);

        for (s in saldos){
          if (saldos[s].mo_codigo === 1) proveedores_saldog += parseFloat(saldos[s].saldo);
          if (saldos[s].mo_codigo === 2) proveedores_saldod += parseFloat(saldos[s].saldo);
          // if (saldos[s].mo_codigo === 3) proveedores_saldor = parseFloat(saldos[s].saldo);
          // if (saldos[s].mo_codigo === 4) proveedores_saldop = parseFloat(saldos[s].saldo);
        }
      }
    }

    const valor_stock = await controlador.valor_stock();

    const saldos = {
      clientes_activos: clientes.length,
      clientes_saldog: clientes_saldog,
      clientes_saldod: clientes_saldod,
      proveedores_saldog: proveedores_saldog,
      proveedores_saldod: proveedores_saldod,
      valor_stock_gs: valor_stock[0].venta_guaranies,
      valor_stock_ds: valor_stock[0].venta_dolares,
    };

    const caja_habilitada = await controlador.cajaHabilitada();
    const saldo_banco = await controlador.saldoBanco();
    const cheques_diferidos = await controlador.chequesDiferidos();

    /////////////////////Gráficos
    const ventas_por_mes = await controlador.ventasPorMes(`${hoy.getFullYear()}-01-01`, `${hoy.getFullYear()}-12-31`);
    const compras_por_mes = await controlador.comprasPorMes(`${hoy.getFullYear()}-01-01`, `${hoy.getFullYear()}-12-31`);
    const cobros_por_mes = await controlador.cobrosPorMes(`${hoy.getFullYear()}-01-01`, `${hoy.getFullYear()}-12-31`);
    const pagos_por_mes = await controlador.pagosPorMes(`${hoy.getFullYear()}-01-01`, `${hoy.getFullYear()}-12-31`);

    const items = [{...saldos}, [...caja_habilitada], [...saldo_banco], [...cheques_diferidos], [...ventas_por_mes], [...compras_por_mes], [...cobros_por_mes],  [...pagos_por_mes]];

    respuesta.success(req, res, items, 200); 
  } catch (err) {
    next(err);
  }
}

async function presupuestos (req, res, next){
  try {
    const presupuestos = await controlador.presupuestos(`${req.query.pres_desde}`, `${req.query.pres_hasta}`);
    const pres_tabla = await controlador.presTabla(`${req.query.pres_desde}`, `${req.query.pres_hasta}`);

    const items = [{...presupuestos[0]}, [...pres_tabla]];

    respuesta.success(req, res, items, 200); 
  } catch (err) {
    next(err);
  }
}

module.exports = router;