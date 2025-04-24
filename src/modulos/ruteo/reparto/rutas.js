const express = require("express");
const seguridad = require("../../../middleware/seguridad");
const router = express.Router();
const respuesta = require("../../../red/respuestas.js");
const controlador = require("./index.js");
const auth = require("../../../auth/index.js");

router.post("/insertar", seguridad(), insertarReparto);
router.get("/listar", seguridad(), listarReparto);
router.get("/listar-detalle", seguridad(), listarDetalleReparto);
router.get("/listar-rutas", seguridad(), listarRutas);
router.get("/fetch-ventas", seguridad(), fetchVentas);
router.get("/fetch-pedidos", seguridad(), fetchPedidos);
router.get("/detalle-ventas", seguridad(), fetchDetalleVentas);
router.get("/detalle-pedidos", seguridad(), fetchDetallePedidos);
router.get("/marcar-salida-ruta", seguridad(), marcarSalidaRuta);
router.get("/marcar-llegada-ruta", seguridad(), marcarLlegadaRuta);
router.get("/marcar-llegada-entrega", seguridad(), marcarLlegadaEntrega);
router.get("/marcar-salida-entrega", seguridad(), marcarSalidaEntrega);
router.get("/camiones", seguridad(), fetchCamiones);
router.get("/choferes", seguridad(), fetchChoferes);
router.get("/resumen-repartos", seguridad(), resumenRepartos);

async function resumenRepartos(req, res, next) {
  try {
    console.log(req.query);
    const fecha_desde = req.query.fecha_desde;
    const fecha_hasta = req.query.fecha_hasta;
    const sucursales = req.query.sucursales || null;
    const choferes = req.query.choferes || null;
    const camiones = req.query.camiones || null;
    const tipos = req.query.tipos || null;
    const id_entrega = req.query.id_entrega || null;
    const result = await controlador.resumenRepartos(
      fecha_desde,
      fecha_hasta,
      sucursales,
      choferes,
      camiones,
      tipos,
      id_entrega
    );
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function fetchCamiones(req, res, next) {
  try {
    const query = req.query;
    const result = await controlador.fetchCamiones(query);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function fetchChoferes(req, res, next) {
  try {
    const query = req.query;
    const result = await controlador.fetchChoferes(query);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function marcarSalidaRuta(req, res, next) {
  try {
    const query = req.query;
    const result = await controlador.marcarSalidaRuta(query);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function marcarLlegadaRuta(req, res, next) {
  try {
    const query = req.query;
    const result = await controlador.marcarLlegadaRuta(query);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function marcarLlegadaEntrega(req, res, next) {
  try {
    console.log(req.query);
    const id = req.query.id;
    // Manejar chat_id como array si viene como chat_id[]
    const chat_id = Array.isArray(req.query.chat_id)
      ? req.query.chat_id
      : req.query.chat_id;
    const latitud = req.query.latitud;
    const longitud = req.query.longitud;
    const result = await controlador.marcarLlegadaEntrega(
      id,
      chat_id,
      latitud,
      longitud
    );
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function marcarSalidaEntrega(req, res, next) {
  try {
    console.log(req.query);
    const id = req.query.id;
    // Manejar chat_id como array si viene como chat_id[]
    const chat_id = Array.isArray(req.query.chat_id)
      ? req.query.chat_id
      : req.query.chat_id;
    const latitud = req.query.latitud;
    const longitud = req.query.longitud;
    const result = await controlador.marcarSalidaEntrega(
      id,
      chat_id,
      latitud,
      longitud
    );
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function fetchVentas(req, res, next) {
  try {
    const query = req.query;
    const result = await controlador.fetchVentas(query);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function fetchPedidos(req, res, next) {
  try {
    const query = req.query;
    const result = await controlador.fetchPedidos(query);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function fetchDetallePedidos(req, res, next) {
  try {
    const id = req.query.id;
    const result = await controlador.fetchDetallePedidos(id);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function fetchDetalleVentas(req, res, next) {
  try {
    const id = req.query.id;
    const result = await controlador.fetchDetalleVentas(id);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function listarRutas(req, res, next) {
  try {
    console.log(req.query);
    const query = req.query;
    const result = await controlador.listarRutas(query);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function insertarReparto(req, res, next) {
  try {
    console.log(req.body);
    const datos = req.body;
    const result = await controlador.insertarReparto(datos);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function listarReparto(req, res, next) {
  try {
    console.log(req.query);
    const id = req.query.id;
    const result = await controlador.listarReparto(id);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function listarDetalleReparto(req, res, next) {
  try {
    console.log(req.query);
    const query = req.query;
    const result = await controlador.listarDetalleReparto(query);
    respuesta.success(req, res, result, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = router;
