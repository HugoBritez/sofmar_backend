const express = require("express");
const seguridad = require("../../../middleware/seguridad");
const router = express.Router();
const respuesta = require("../../../red/respuestas.js");
const controlador = require("./index.js");
const auth = require("../../../auth/index.js");

router.get("/", seguridad(), uno);
router.post("/agregar", seguridad(), agregar);
router.get("/detalles", seguridad(), detalles);
router.get("/pedido-estados", seguridad(), pedido_estados);
router.post("/consultas", seguridad(), consultas);
router.post("/autorizar", seguridad(), autorizar);
router.post("/agregar-pedido", controlador.agregarPedido);
router.post ('/confirmarPedido', seguridad(), confirmarPedido)
router.post('/actualizarParcial', seguridad(), actualizarPedidoParcial)
router.get('/consulta-pedidos', seguridad(), pedidosNuevo)
router.post('/update-observacion-pedido', seguridad(), updateObservacionPedido)
router.get('/preparacion-pedido', seguridad(), pedidosPreparar)
router.post('/iniciar-preparacion-pedido', seguridad(), iniciarPreparacionPedido)
router.get('/traer-pedidos-disponibles', seguridad(), traerPedidosAPreparar)
router.get('/traer-items-por-pedido', seguridad(), traerItemsPorPedido)
router.post('/cargar-pedido-preparado', seguridad(), cargarPedidoPreparado)
router.post('/registrar-cajas', seguridad(), registrarCajas)
router.get('/numero-cajas', seguridad(), numeroCajas)
router.get('/obtener', seguridad(), obtenerPedidosParaVenta)
router.get('/reporte-de-preparacion', seguridad(), reportePreparacionPedidos)
router.get('/pedidos-agenda', seguridad(), pedidosAgenda)
router.get('/pedidos-faltantes', seguridad(), pedidosFaltantes)
router.post('/insertar-detalle-faltante', seguridad(), insertarDetalleFaltante)
router.post('/reprocesar-pedido', seguridad(), reprocesarPedido)


async function reprocesarPedido(req, res, next){
  try{
    console.log('llego');
    console.log(req.body);
    const { id_pedido, detalle } = req.body.datos;
    console.log('id', id_pedido);
    console.log('detalle', detalle);
    
    const result = await controlador.rehacerPedidoConFaltantes({
      pedido_id: id_pedido,
      detalles: detalle
    });
    respuesta.success(req, res, result, 200);
  }catch(err){
    next(err);
  }
}

async function pedidosFaltantes(req, res, next){
  try{
    const result = await controlador.getPedidosFaltantes(req.query);
    respuesta.success(req, res, result, 200);
  }catch(err){  
    next(err);
  }
}

async function insertarDetalleFaltante(req, res, next){
  try{
    const result = await controlador.insertarDetalleFaltante(req.body);
    respuesta.success(req, res, result, 200);
  }catch(err){
    next(err);
  }
}

async function reportePreparacionPedidos(req, res, next){
  try{
    const result = await controlador.reportePreparacionPedidos(req.query.fecha_desde, req.query.fecha_hasta);
    respuesta.success(req, res, result, 200);
  }catch(err){
    next(err);
  }
}

async function obtenerPedidosParaVenta(req, res, next){
  try{
    const result = await controlador.obtenerPedidosParaVenta(req.query.id);
    respuesta.success(req, res, result, 200);
  }catch(err){
    next(err);
  }
}

async function numeroCajas(req, res, next){
  try{
    const result = await controlador.getNumeroCajas(req.query.id);
    respuesta.success(req, res, result, 200);
  }catch(err){
    next(err);
  }
}

async function registrarCajas(req, res, next){
  try{
    const {pedidoId, numeroCajas, verificadoPor} = req.body;
    const result = await controlador.insertarCantidadDeCajas(pedidoId, numeroCajas, verificadoPor);
    respuesta.success(req, res, result, 200);
  }catch(err){
    next(err);
  }
}

async function traerItemsPorPedido(req, res, next){
  try{
    const result = await controlador.traerItemsPorPedido(req.query.id, req.query.buscar);
    respuesta.success(req, res, result, 200);
  }catch(err){
    next(err);
  }
}

async function traerPedidosAPreparar(req, res, next){
  try{
    console.log("llego");
    console.log(req.query);
    const result = await controlador.traerPedidosAPreparar(req.query.deposito_id);
    respuesta.success(req, res, result, 200);
  }catch(err){
    next(err);
  }
}

async function iniciarPreparacionPedido(req, res, next) {
  try {
    // Ahora esperamos un array de IDs
    console.log(req.body);
    const pedidoIds = req.body.pedido_ids;
    const preparadoPor = req.body.preparado_por;
    const result = await controlador.iniciarPreparacionPedido(pedidoIds, preparadoPor);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function pedidosPreparar(req, res, next){
  try{
    console.log(req.query);
    const result = await controlador.prepararPedido(req.query.id, req.query.consolidar, req.query.cliente, req.query.fecha_desde, req.query.fecha_hasta, req.query.estado);
    respuesta.success(req, res, result, 200);
  }catch(err){
    next(err);
  }
}

async function pedidosNuevo(req, res, next){
  try{
    const fecha_desde = req.query.fecha_desde
    const fecha_hasta = req.query.fecha_hasta
    const nro_pedido = req.query.nro_pedido
    const articulo = req.query.articulo
    const clientes = req.query.clientes
    const vendedores = req.query.vendedores
    const sucursales = req.query.sucursales
    const estado = req.query.estado
    const moneda = req.query.moneda
    const factura = req.query.factura
    const result = await controlador.getPedidosNuevo(fecha_desde, fecha_hasta, nro_pedido, articulo, clientes, vendedores, sucursales, estado, moneda, factura)
    respuesta.success(req, res, result, 200)
  }catch(err){
    next(err)
  }
}

async function actualizarPedidoParcial (req, res, next){
  try{
    const {codigo, items} = req.body
    const result = await controlador.actualizarPedidoParcial(codigo, items)
    if (result){
      respuesta.success(req, res, result, 200)
   }else{
      respuesta.error(req, res, 'Error al actualizar presupuesto', 500)
    }
  }catch(err){
    next(err)
  }
}

async function confirmarPedido(req, res, next) {
  try{
    const pedidoId = req.body.id;
    const result = await controlador.confirmarPedido(pedidoId);
    respuesta.success(req, res, result, 204);
  } catch(err){
    next(err);
  }
}


async function uno(req, res, next) {
  try {
    const item = await controlador.uno(req.query.cod);
    respuesta.success(req, res, item, 200);
  } catch (err) {
    next(err);
  }
}

async function consultas(req, res, next) {
  try {
    const bod = req.body;
    const items = await controlador.getCabeceras(
      bod.fecha_desde,
      bod.fecha_hasta,
      bod.sucursal,
      bod.cliente,
      bod.vendedor,
      bod.articulo,
      bod.moneda,
      bod.factura,
      bod.limit
    );

    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function detalles(req, res, next) {
  try {
    const items = await controlador.getDetalles(req.query.cod);

    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function agregar(req, res, next) {
  try {
    //Carga cabecera de pedido - Tabla "pedidos"
    const pedido = req.body.pedido;
    const total_pedido = pedido.p_total;
    delete pedido.p_total;
    const articulos = req.body.tabla;

    //Carga detalle - Para luego cargar tablas "detalle_pedido"
    let detalles = [];
    let detalle = null;

    const porc_descuento =
      (100 * pedido.p_descuento) / (total_pedido + pedido.p_descuento) / 100;
    let subtotal_detalle = 0;

    if (pedido.p_codigo === 0) {
      //Es una carga nueva
      const primera_sec = await controlador.primeraSecuenciaArea();
      if (primera_sec.length > 0) pedido.p_area = primera_sec[0].ac_area;
      let pedido_nuevo = await controlador.agregarCabecera(pedido);

      for (i = 0; i < articulos.length; i++) {
        let descuento_calculado = Math.round(
          (articulos[i].tabla_precio_venta - articulos[i].tabla_descuento) *
            porc_descuento
        );
        let bonif_num = 0;
        if (articulos[i].tabla_venta_bonif === "B") bonif_num = 1;

        detalle = {
          dp_codigo: 0,
          dp_pedido: pedido_nuevo.insertId,
          dp_articulo: articulos[i].tabla_ar_codigo,
          dp_cantidad: articulos[i].tabla_cantidad,
          dp_precio:
            articulos[i].tabla_precio_venta -
            articulos[i].tabla_descuento -
            descuento_calculado,
          dp_descuento: articulos[i].tabla_descuento + descuento_calculado,
          dp_exentas: 0,
          dp_cinco: 0,
          dp_diez: 0,
          dp_lote: articulos[i].tabla_lote,
          dp_vence: articulos[i].tabla_vence,
          dp_vendedor: pedido.p_operador,
          dp_codigolote: articulos[i].tabla_al_codigo,
          dp_porcomision: 0,
          dp_actorizado: 0,
          dp_bonif: bonif_num,
          dp_facturado: 0,
        };

        subtotal_detalle =
          articulos[i].tabla_cantidad *
          (articulos[i].tabla_precio_venta -
            articulos[i].tabla_descuento -
            descuento_calculado);

        switch (articulos[i].tabla_iva) {
          case 1: //Exentas
            detalle.dp_exentas = subtotal_detalle;
            break;
          case 2: //10%
            detalle.dp_diez = subtotal_detalle;
            break;
          case 3: //5%
            detalle.dp_cinco = subtotal_detalle;
            break;
        }

        detalles.push(detalle);
      }

      for (d = 0; d < detalles.length; d++) {
        nuevo_detalle = await controlador.agregarDetalle(detalles[d]);
      }

      respuesta.success(req, res, pedido_nuevo.insertId, 200);
    } else {
      //Es una modificación
      await controlador.agregarCabecera(pedido); //Actualizar cabecera

      const para_eliminar = await controlador.getDetalles(pedido.p_codigo); //Traemos los detalles existentes para comparar eliminados

      for (i = 0; i < articulos.length; i++) {
        let descuento_calculado = Math.round(
          (articulos[i].tabla_precio_venta - articulos[i].tabla_descuento) *
            porc_descuento
        );
        let bonif_num = 0;
        if (articulos[i].tabla_venta_bonif === "B") bonif_num = 1;

        for (c = 0; c < para_eliminar.length; c++) {
          if (articulos[i].tabla_codigo === para_eliminar[c].det_codigo) {
            para_eliminar.splice(c, 1); //Sacamos de la cola a eliminar si existe aún
            break;
          }
        }

        detalle = {
          dp_codigo: articulos[i].tabla_codigo,
          dp_pedido: pedido.p_codigo,
          dp_articulo: articulos[i].tabla_ar_codigo,
          dp_cantidad: articulos[i].tabla_cantidad,
          dp_precio:
            articulos[i].tabla_precio_venta -
            articulos[i].tabla_descuento -
            descuento_calculado,
          dp_descuento: articulos[i].tabla_descuento + descuento_calculado,
          dp_exentas: 0,
          dp_cinco: 0,
          dp_diez: 0,
          dp_lote: articulos[i].tabla_lote,
          dp_vence: articulos[i].tabla_vence,
          dp_vendedor: pedido.p_operador,
          dp_codigolote: articulos[i].tabla_al_codigo,
          dp_porcomision: 0,
          dp_actorizado: 0,
          dp_bonif: bonif_num,
          dp_facturado: 0,
        };

        subtotal_detalle =
          articulos[i].tabla_cantidad *
          (articulos[i].tabla_precio_venta -
            articulos[i].tabla_descuento -
            descuento_calculado);

        switch (articulos[i].tabla_iva) {
          case 1: //Exentas
            detalle.dp_exentas = subtotal_detalle;
            break;
          case 2: //10%
            detalle.dp_diez = subtotal_detalle;
            break;
          case 3: //5%
            detalle.dp_cinco = subtotal_detalle;
            break;
        }

        detalles.push(detalle);
      }

      for (d = 0; d < detalles.length; d++) {
        await controlador.agregarDetalle(detalles[d]);
      }

      for (p = 0; p < para_eliminar.length; p++) {
        await controlador.eliminarDetalle(para_eliminar[p].det_codigo);
      }

      respuesta.success(req, res, pedido.p_codigo, 200);
    }
  } catch (err) {
    next(err);
  }
}

async function autorizar(req, res, next) {
  try {
    const item = await controlador.autorizar(req.body.pedido, req.body.user, req.body.username, req.body.password);
    respuesta.success(req, res, item, 200);
  } catch (err) {
    next(err);
  }
}

async function pedido_estados(req, res, next) {
  try {
    const item = await controlador.pedido_estados(req.query.cod);
    respuesta.success(req, res, item, 200);
  } catch (err) {
    next(err);
  }
}

async function updateObservacionPedido(req, res, next) {
  try {
    const { pedidoId, observacion } = req.body;
    const result = await controlador.updateObservacionPedido(pedidoId, observacion);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function cargarPedidoPreparado(req, res, next){
  try{
    const {pedidoId, cantidad} = req.body;
    const result = await controlador.cargarPedidoPreparado(pedidoId, cantidad);
    respuesta.success(req, res, result, 200);
  }catch(err){
    next(err);
  }

}

async function pedidosAgenda(req, res, next){
  try{
    const result = await controlador.getPedidosParaAgenda(req.query.vendedor, req.query.cliente, req.query.busqueda)
    respuesta.success(req, res, result, 200)
  }catch(err){
    next(err);
  }

}
module.exports = router;
