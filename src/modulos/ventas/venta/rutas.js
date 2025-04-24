const express = require("express");
const seguridad = require("../../../middleware/seguridad");
const router = express.Router();
const respuesta = require("../../../red/respuestas.js");
const controlador = require("./index.js");
const auth = require("../../../auth/index.js");

const os = require("os");

router.post("/agregarVenta", seguridad(), controlador.agregarVenta);
router.post("/agregar-venta-nuevo", seguridad(), agregarVentaNuevo);
router.post("/agregar", seguridad(), agregar);
router.get("/detalles", seguridad(), detalles);
router.get("/cliente/", seguridad(), cliente);
router.post("/consultas", seguridad(), consultas);
router.post("/modificar", seguridad(), modificar);
router.post("/resumen", resumen);
router.post("/resumen-totales", resumenTotales);
router.get("/", seguridad(), uno);
router.get("/metodosPago", seguridad(), metodosPago);
router.post("/insertarDescripcion", insertarDescripcion);
router.get("/getDetalleId/:id", traerIdDetalleVentas);
router.get("/idUltimaVenta", seguridad(), idUltimaVenta);
router.post("/anular-venta", anularVenta);
router.post("/cobrar-venta", seguridad(), cobrarVenta);
router.get('/ventas-data', seguridad(), ventasData);
router.get('/contar-ventas', seguridad(), contarVentas);
router.get('/total-ventas', seguridad(), totalVentas);
router.get('/contar-articulos', seguridad(), contarArticulosVendidos);
router.get('/consulta-ruteo', seguridad(), consultaRuteo);
router.get('/venta-imprimir', seguridad(), ventaImprimir);
router.get('/venta-edicion', seguridad(), ventaEdicion);
router.post('/actualizar-cdc', seguridad(), actualizarCdc);
router.get('/ventas-agenda', seguridad(), ventasAgenda);


//HOLA SOY UN TEST 222

async function ventasAgenda(req, res, next){
  try{
    const result = await controlador.getVentasParaAgenda(req.query.vendedor, req.query.cliente, req.query.busqueda)
    respuesta.success(req, res, result, 200)
  }catch(err){
    next(err)
  }
}
async function actualizarCdc(req, res, next){
  try{
    console.log(req.body)
    const {codigo, cdc, qr} = req.body
    const result = await controlador.actualizarCdc(codigo, cdc, qr)
    respuesta.success(req, res, result, 200)
  }catch(err){
    next(err)
  }
}

async function ventaEdicion(req, res, next){
  try{
    const result = await controlador.obtenerVentaParaEdicion(req.query.id)
    respuesta.success(req, res, result, 200)
  }catch(err){
    next(err)
  }
}

async function agregarVentaNuevo(req, res, next) {
  try {
    const { venta, detalle_ventas } = req.body;
    console.log("Datos recibidos:", {
      venta: venta,
      detalle_ventas: detalle_ventas
    });
    const result = await controlador.agregarVentaNuevo(venta, detalle_ventas);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}


async function ventaImprimir(req, res, next) {
  try {
    const ventaId = req.query.ventaId;
    const result = await controlador.getVentaParaImpresion(ventaId);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function consultaRuteo(req, res, next) {
  try {
    const datos = req.query;
    const result = await controlador.consultaRuteo(datos);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function contarArticulosVendidos(req, res, next) {
  try {
    const tipo = req.query.tipo;
    const result = await controlador.cantidadArticulosVendidosPorPeriodo(tipo);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    console.error('Error en contarArticulosVendidos:', err.message);
    next(err);
  }
}


async function contarVentas(req, res, next) {
  try {
    const tipo = req.query.tipo;
    const result = await controlador.cantidadVentasPorPeriodo(tipo);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    console.error('Error en contarVentas:', err.message);
    next(err); 
  }
}


async function totalVentas(req, res, next) {
  try {
    const tipo = req.query.tipo;
    const result = await controlador.totalVentasPorPeriodo(tipo);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    console.error('Error en contarVentas:', err.message);
    next(err); 
  }
}

async function ventasData(req, res, next) {
  try {
    const tipo = req.query.tipo; 
    console.log(`Tipo recibido: ${tipo}`);
    const result = await controlador.graficoVentas(tipo);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    console.error('Error en ventasData:', err.message);
    next(err);
  }
}

async function cobrarVenta(req, res, next) {
  try {
    const ventaId = req.body.ventaId;
    const result = await controlador.cobrarVenta(ventaId);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function anularVenta(req, res, next) {
  try {
    const { codigo, userId, metodo, obs } = req.body;

    if (!codigo) {
      return res.status(400).json({ error: "codigo is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Get client IP properly
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    const result = await controlador.anularVenta(
      codigo,
      userId,
      clientIp,
      metodo,
      obs
    );

    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
}
async function idUltimaVenta(req, res, next) {
  try {
    const items = await controlador.idUltimaVenta();
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function metodosPago(req, res, next) {
  try {
    const items = await controlador.getMetodosPago();
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function traerIdDetalleVentas(req, res, next) {
  try {
    const items = await controlador.traerIdDetalleVentas(req.params.id);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function insertarDescripcion(req, res, next) {
  try {
    const items = await controlador.ActualizarDescripcionArticulo(req.body);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function uno(req, res, next) {
  try {
    const item = await controlador.uno(req.query.id);
    respuesta.success(req, res, item, 200);
  } catch (err) {
    next(err);
  }
}

async function consultas(req, res, next) {
  try {
    const bod = req.body;
    const page = bod.page || 1;  // Default to page 1
    const itemsPorPagina = bod.itemsPorPagina || 50
    const items = await controlador.getCabeceras(
      bod.fecha_desde,
      bod.fecha_hasta,
      bod.sucursal,
      bod.cliente,
      bod.vendedor,
      bod.articulo,
      bod.moneda,
      bod.factura,
      bod.venta,
      bod.estadoVenta,
      bod.remisiones,
      bod.listarFacturasSinCDC,
      page,
      itemsPorPagina
    );

    console.log(req.body);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function modificar(req, res, next) {
  try {
    const bod = req.body;
    const items = await controlador.modificar(
      bod.ve_codigo,
      bod.ve_credito,
      bod.fecha,
      bod.vencimiento,
      bod.ve_factura,
      bod.ve_timbrado,
      bod.ve_sucursal,
      bod.ve_obs
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

async function cliente(req, res, next) {
  try {
    const items = await controlador.getDetallesCliente(
      req.query.desde,
      req.query.hasta,
      req.query.cod,
      req.query.art
    );

    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function resumen(req, res, next) {
  try {
    console.log(req.body);
    const bod = req.body;
    const items = await controlador.getResumen(
      bod.fecha_desde,
      bod.fecha_hasta,
      bod.hora_inicio || "00:00",
      bod.hora_fin || "23:59",
      (bod.sucursales || []).join(","),
      (bod.depositos || []).join(","),
      (bod.clientes || []).join(","),
      (bod.vendedores || []).join(","),
      (bod.articulos || []).join(","),
      (bod.tipos_articulo || []).join(","),
      (bod.marcas || []).join(","),
      (bod.categorias || []).join(","),
      (bod.subcategorias || []).join(","),
      (bod.ciudades || []).join(","),
      (bod.talles || []).join(","),
      (Array.isArray(bod.condiciones) ? bod.condiciones : [bod.condiciones]).join(","),
      (Array.isArray(bod.situaciones) ? bod.situaciones : [bod.situaciones]).join(","),
      (bod.movimientos || []).join(","),
      (bod.secciones || []).join(","),
      bod.moneda || 0,
      bod.tipo_valorizacion || 0,
      bod.buscar_codigo || 0,
      bod.buscar_factura || 0,
      bod.calculo_promedio || false,
      bod.aplica_nc || false,
      bod.orden || false,
      bod.desglosado_iva || false,
      bod.desglosado_factura || false,
      bod.agrupar_fecha || false,
      bod.totalizar_grid || false,
      bod.bonificacion || false,
      bod.ncfechaVentas || false
    );

    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}


async function resumenTotales(req, res, next) {
  try {
    console.log(req.body);
    const bod = req.body;
    const items = await controlador.calcularTotalesInforme(
      bod.fecha_desde,
      bod.fecha_hasta,
      bod.hora_inicio || "00:00",
      bod.hora_fin || "23:59",
      (bod.sucursales || []).join(","),
      (bod.depositos || []).join(","),
      (bod.clientes || []).join(","),
      (bod.vendedores || []).join(","),
      (bod.articulos || []).join(","),
      (bod.tipos_articulo || []).join(","),
      (bod.marcas || []).join(","),
      (bod.categorias || []).join(","),
      (bod.subcategorias || []).join(","),
      (bod.ciudades || []).join(","),
      (bod.talles || []).join(","),
      (Array.isArray(bod.condiciones)
        ? bod.condiciones
        : [bod.condiciones]
      ).join(","),
      (Array.isArray(bod.situaciones)
        ? bod.situaciones
        : [bod.situaciones]
      ).join(","),
      (bod.movimientos || []).join(","),
      (bod.secciones || []).join(","),
      bod.moneda || 0,
      bod.tipo_valorizacion || 0,
      bod.buscar_codigo || 0,
      bod.buscar_factura || 0,
      bod.calculo_promedio || false,
      bod.aplica_nc || false,
      bod.orden || false,
      bod.desglosado_iva || false,
      bod.desglosado_factura || false,
      bod.agrupar_fecha || false,
      bod.totalizar_grid || false,
      bod.bonificacion || false,
      bod.ncfechaVentas || false
    );

    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function agregar(req, res, next) {
  try {
    //Carga cabecera de venta - Tabla "ventas"
    const venta = req.body.venta;
    venta.ve_userpc = os.hostname();
    const articulos = req.body.tabla;
    let venta_nueva = await controlador.agregarCabecera(venta);

    const porc_descuento =
      (100 * venta.ve_descuento) / (venta.ve_total + venta.ve_descuento) / 100;

    venta.ac_referencia = venta_nueva.insertId;

    //Verifica y carga asiento de venta con su primer detalle, y cabecera de asiento de costo - Tabla "asiento_contable" y "detalle_asiento_contable"
    const con_automatico = await controlador.getAsientoAutomatico();
    let asiento_venta = null;
    let asiento_costo = null;

    if (con_automatico === 1) {
      asiento_venta = await controlador.asientoContableVenta(0, venta);
      asiento_costo = await controlador.asientoContableCosto(0, venta);
    }

    let subtotal_detalle = 0;
    let iva = 0;

    let total_haber_exentas = 0;
    let total_haber_iva_10 = 0;
    let total_haber_imp_10 = 0;
    let total_haber_iva_5 = 0;
    let total_haber_imp_5 = 0;
    let total_haber = 0;

    let costo_exentas = 0;
    let costo_10 = 0;
    let costo_5 = 0;
    let costo_total = 0;

    //Carga detalle - Para luego cargar tablas "detalle_ventas" y "detalle_asiento_contable"
    let detalles = [];
    let detalle = null;
    let nuevo_detalle = 0;

    for (i = 0; i < articulos.length; i++) {
      let descuento_calculado = Math.round(
        (articulos[i].tabla_precio_venta - articulos[i].tabla_descuento) *
          porc_descuento
      );

      detalle = {
        deve_codigo: 0,
        deve_venta: venta_nueva.insertId,
        deve_articulo: articulos[i].tabla_ar_codigo,
        deve_cantidad: articulos[i].tabla_cantidad,
        deve_precio:
          articulos[i].tabla_precio_venta -
          articulos[i].tabla_descuento -
          descuento_calculado,
        deve_descuento: articulos[i].tabla_descuento + descuento_calculado,
        deve_exentas: 0,
        deve_cinco: 0,
        deve_diez: 0,
        deve_devolucion: 0,
        deve_vendedor: venta.ve_operador,
        deve_color: articulos[i].tabla_color,
        deve_bonificacion: 0,
        deve_talle: "",
        deve_codioot: 0,
        deve_costo: 0,

        al_codigo: articulos[i].tabla_al_codigo,
      };

      subtotal_detalle =
        articulos[i].tabla_cantidad *
        (articulos[i].tabla_precio_venta -
          articulos[i].tabla_descuento -
          descuento_calculado);

      switch (articulos[i].tabla_iva) {
        case 1: //Exentas
          detalle.deve_exentas = subtotal_detalle;
          total_haber_exentas += subtotal_detalle;
          costo_exentas += parseFloat(articulos[i].tabla_precio_costo);

          break;
        case 2: //10%
          detalle.deve_diez = subtotal_detalle;
          costo_10 += parseFloat(articulos[i].tabla_precio_costo);
          //total_haber += subtotal_detalle;

          iva = Math.round(subtotal_detalle / 11);
          total_haber_iva_10 += iva;
          total_haber_imp_10 += subtotal_detalle - iva;

          break;
        case 3: //5%
          detalle.deve_cinco = subtotal_detalle;
          costo_5 += parseFloat(articulos[i].tabla_precio_costo);
          //total_haber += subtotal_detalle;

          iva = Math.round(subtotal_detalle / 21);
          total_haber_iva_5 += iva;
          total_haber_imp_5 += subtotal_detalle - iva;

          break;
      }

      detalles.push(detalle);
    }

    if (con_automatico === 1) {
      total_haber =
        total_haber_exentas +
        total_haber_imp_10 +
        total_haber_iva_10 +
        total_haber_imp_5 +
        total_haber_iva_5;
      costo_total = costo_exentas + costo_10 + costo_5;

      //Actualiza el total_haber en cabecera de Asiento Venta
      await controlador.asientoContableVenta(asiento_venta, {
        total_debe: 0,
        total_haber: total_haber,
      });

      //Cargamos detalles del asiento venta, por gravada e IVA según lo que se haya sumado en total de cada categoría
      if (total_haber_exentas > 0) {
        await controlador.agregarDetalleAsiento(
          1,
          asiento_venta,
          0,
          0,
          0,
          total_haber_exentas,
          venta_nueva.insertId
        );
      }

      if (total_haber_imp_10 > 0 && total_haber_iva_10 > 0) {
        await controlador.agregarDetalleAsiento(
          1,
          asiento_venta,
          0,
          10,
          0,
          total_haber_imp_10,
          venta_nueva.insertId
        );
        await controlador.agregarDetalleAsiento(
          1,
          asiento_venta,
          1,
          10,
          0,
          total_haber_iva_10,
          venta_nueva.insertId
        );
      }

      if (total_haber_imp_5 > 0 && total_haber_iva_5 > 0) {
        await controlador.agregarDetalleAsiento(
          1,
          asiento_venta,
          0,
          5,
          0,
          total_haber_imp_5,
          venta_nueva.insertId
        );
        await controlador.agregarDetalleAsiento(
          1,
          asiento_venta,
          1,
          5,
          0,
          total_haber_iva_5,
          venta_nueva.insertId
        );
      }

      //COSTO DE MERCADERÍAS GRAVADAS POR EL IVA
      await controlador.agregarDetalleAsiento(
        6,
        asiento_costo,
        0,
        10,
        costo_total,
        0,
        venta_nueva.insertId
      );
      //COSTOS SEGÚN 5%, 10% o EXENTAS
      if (costo_exentas > 0)
        await controlador.agregarDetalleAsiento(
          6,
          asiento_costo,
          0,
          0,
          0,
          costo_exentas,
          venta_nueva.insertId
        );
      if (costo_10 > 0)
        await controlador.agregarDetalleAsiento(
          6,
          asiento_costo,
          1,
          10,
          0,
          costo_10,
          venta_nueva.insertId
        );
      if (costo_5 > 0)
        await controlador.agregarDetalleAsiento(
          6,
          asiento_costo,
          1,
          5,
          0,
          costo_5,
          venta_nueva.insertId
        );
      //Actualizar cabecera
      await controlador.asientoContableCosto(asiento_costo, {
        total_debe: costo_total,
        total_haber: costo_total,
      });
    }

    for (d = 0; d < detalles.length; d++) {
      lote_aux = detalles[d].al_codigo;
      delete detalles[d].al_codigo;

      nuevo_detalle = await controlador.agregarDetalle(detalles[d]);
      //Carga detalle lote/vencimiento - Tabla "detalle_ventas_vencimiento"
      controlador.agregarDetalleLote(nuevo_detalle.insertId, lote_aux);
      //Actualiza stock - Tabla "articulos_lotes"
      controlador.actualizarStock(
        detalles[d].deve_cantidad,
        detalles[d].deve_articulo,
        lote_aux
      );
    }

    if (req.body.cuotasCredito != undefined) {
      //Si tiene este array, ya que venta directa celular no tiene
      for (c = 0; c < req.body.cuotasCredito.length; c++) {
        //Recorremos cada cuota
        req.body.cuotasCredito[c].dvc_venta = venta_nueva.insertId; //Le cargamos el ID de la venta actual
        controlador.agregarCuotas(req.body.cuotasCredito[c]); //Insert a base de datos
      }
    }

    respuesta.success(req, res, venta_nueva.insertId, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = router;
