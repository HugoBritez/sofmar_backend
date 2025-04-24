const express = require("express");
const seguridad = require("../../middleware/seguridad");
const router = express.Router();
const respuesta = require("../../red/respuestas.js");
const controlador = require("./index.js");
const auth = require("../../auth/index.js");

router.get("/", seguridad(), getFacturas);

async function getFacturas(req, res, next) {
  try {
    const {
      deposito,
      sucursal,
      nro_proveedor,
      fecha_desde,
      fecha_hasta,
      nro_factura,
      verificado,
    } = req.query;
    const response = await controlador.getFacturas(
      deposito,
      sucursal,
      nro_proveedor,
      fecha_desde,
      fecha_hasta,
      nro_factura,
      verificado
    );
    respuesta.success(req, res, response, 200);
  } catch (error) {
    next(error);
  }
}

router.get("/items", seguridad(), getItems);

async function getItems(req, res, next) {
  try {
    const { id_ingreso } = req.query;
    const response = await controlador.getItems(id_ingreso);
    respuesta.success(req, res, response, 200);
  } catch (error) {
    next(error);
    return respuesta.error(req, res, error, 500);
  }
}

router.post("/verificar", seguridad(), verificarCompra);

async function verificarCompra(req, res, next) {
  try {
    const { id_compra, user_id } = req.body;
    const response = await controlador.verificarCompra(id_compra, user_id);
    respuesta.success(req, res, response, 200);
  } catch (error) {
    next(error);
    return respuesta.error(req, res, error, 500);
  }
}

router.post("/verificar-item", seguridad(), verificarItem);

async function verificarItem(req, res, next) {
  try {
    const { id_detalle, cantidad } = req.body;
    if (!id_detalle) {
      return respuesta.error(res, "El id del detalle es requerido", 500);
    }
    if (!cantidad) {
      return respuesta.error(res, "La cantidad es requerida", 500);
    }
    const response = await controlador.verificarItem(id_detalle, cantidad);
    respuesta.success(req, res, response, 200);
  } catch (error) {
    next(error);
    return respuesta.error(req, res, error, 500);
  }
}

router.post("/confirmar", seguridad(), confirmarVerificacion);

async function confirmarVerificacion(req, res, next) {
  try {
    console.log('AQUI ESTAN LOS BODY', req.body)
    const { id_compra, factura_compra, deposito_transitorio, deposito_destino, items, user_id, operador_id } = req.body;
    if (!id_compra) {
      return respuesta.error(res, "El id de la compra es requerido", 500);
    }
    const response = await controlador.confirmarVerificacion(id_compra, factura_compra, deposito_transitorio, deposito_destino, items, user_id, operador_id);
    respuesta.success(req, res, response, 200);
  } catch (error) {
    next(error);
    return respuesta.error(req, res, error, 500);
  }
}

router.get("/items-a-escanear", seguridad(), getItemsAEscanear);

async function getItemsAEscanear(req, res, next) {
  try {
    const { id_compra, busqueda } = req.query;
    const response = await controlador.getItemsAEscanear(id_compra, busqueda);
    respuesta.success(req, res, response, 200);
  } catch (error) {
    next(error);
    return respuesta.error(req, res, error, 500);
  }
}

router.get('/reporte-ingresos', seguridad(), reporteIngresos);

async function reporteIngresos(req, res, next) {
  try {
    const { deposito, sucursal, nro_proveedor, fecha_desde, fecha_hasta, nro_factura, verificado } = req.query;
    const response = await controlador.reporteIngresos(deposito, sucursal, nro_proveedor, fecha_desde, fecha_hasta, nro_factura, verificado);
    respuesta.success(req, res, response, 200);
  } catch (error) {
    next(error);
    return respuesta.error(req, res, error, 500);
  }
}

module.exports = router;
