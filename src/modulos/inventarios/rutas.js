const express = require("express");
const seguridad = require("../../middleware/seguridad");
const router = express.Router();
const respuesta = require("../../red/respuestas");
const controlador = require("./index.js");
const auth = require("../../auth/index.js");

router.get("/", seguridad(), get_inventario);

async function get_inventario(req, res) {
  try {
    const { inventario_id, nro_inventario, deposito, sucursal } = req.query;
    const resultado = await controlador.get_inventario(
      inventario_id,
      nro_inventario,
      deposito,
      sucursal
    );

    // Llamar a success con req como primer parámetro
    respuesta.success(req, res, resultado, 200);
  } catch (error) {
    console.error("Error en get_inventario:", error);
    respuesta.error(req, res, "Error interno del servidor", 500);
  }
}

router.get("/all", seguridad(), get_inventarios);

async function get_inventarios(req, res) {
  try {
    const { estado, deposito, sucursal, nro_inventario } = req.query;
    const resultado = await controlador.get_inventarios(
      estado,
      deposito,
      sucursal,
      nro_inventario
    );

    // Llamar a success con req como primer parámetro
    respuesta.success(req, res, resultado, 200);
  } catch (error) {
    console.error("Error en get_inventario:", error);
    respuesta.error(req, res, "Error interno del servidor", 500);
  }
}

router.post("/", seguridad(), crear_inventario);

async function crear_inventario(req, res) {
  try {
    const { inventario } = req.body;
    console.log(inventario);
    const resultado = await controlador.crear_inventario(inventario);
    respuesta.success(req, res, resultado, 200);
  } catch (error) {
    console.error("Error en crear_inventario:", error);
    respuesta.error(req, res, "Error interno del servidor", 500);
  }
}

router.post("/items", seguridad(), insertar_items_inventario);

async function insertar_items_inventario(req, res, next) {
  try {
    console.log("req.body", req.body);
    const { inventario_id, filtros, deposito } = req.body;

    // Validar que los parámetros requeridos existan
    if (!inventario_id || !deposito) {
      return respuesta.error(
        req,
        res,
        "El ID del inventario y el depósito son obligatorios",
        400
      );
    }

    // Asegurarse de que filtros sea un objeto válido
    const filtrosNormalizados = {
      categorias: filtros?.categorias || [],
      marcas: filtros?.marcas || [],
      secciones: filtros?.secciones || [],
      articulos: filtros?.articulos || [],
    };

    const resultado = await controlador.insertar_items_inventario(
      inventario_id,
      deposito,
      filtrosNormalizados
    );

    // Si hay error en el resultado, enviar como error
    if (resultado.error) {
      return respuesta.error(req, res, resultado.mensaje, 400);
    }

    return respuesta.success(req, res, resultado, 200);
  } catch (error) {
    // Usar next(error) para consistencia con el resto del codebase
    next(error);
  }
}

router.post("/items/escanear", seguridad(), escanear_item_inventario);

async function escanear_item_inventario(req, res) {
  console.log("req.body", req.body);
  const {
    id_articulo,
    id_lote,
    cantidad,
    lote,
    talle_id,
    color_id,
    vencimiento,
    codigo_barras,
    id_inventario,
    ubicacion_id,
    sub_ubicacion_id,
  } = req.body;
  const resultado = await controlador.scannear_item_inventario(
    id_articulo,
    id_lote,
    cantidad,
    lote,
    talle_id,
    color_id,
    vencimiento,
    codigo_barras,
    id_inventario,
    ubicacion_id,
    sub_ubicacion_id
  );
  respuesta.success(req, res, resultado, 200);
}

router.post("/cerrar", seguridad(), cerrar_inventario);

async function cerrar_inventario(req, res) {
  const { id } = req.body;
  const resultado = await controlador.cerrar_inventario(id);
  respuesta.success(req, res, resultado, 200);
}

router.post("/autorizar", seguridad(), autorizar_inventario);

async function autorizar_inventario(req, res) {
  const { id, operador, sucursal, deposito, nro_inventario } = req.body;
  const resultado = await controlador.autorizar_inventario(
    id,
    operador,
    sucursal,
    deposito,
    nro_inventario
  );
  respuesta.success(req, res, resultado, 200);
}

router.get("/items", seguridad(), get_items_inventario);

async function get_items_inventario(req, res) {
  const {
    nro_inventario,
    scanneado,
    deposito,
    sucursal,
    buscar,
    id_inventario,
  } = req.query;
  const resultado = await controlador.get_items_inventario(
    nro_inventario,
    scanneado,
    deposito,
    sucursal,
    buscar,
    id_inventario
  );
  respuesta.success(req, res, resultado, 200);
}

router.get("/escanear", seguridad(), escanear_inventario);

async function escanear_inventario(req, res) {
  console.log("req.query", req.query);
  const { nro_inventario, id_inventario, busqueda, deposito } = req.query;
  const resultado = await controlador.get_items_a_escanear(
    nro_inventario,
    id_inventario,
    busqueda,
    deposito
  );
  respuesta.success(req, res, resultado, 200);
}

router.get("/disponibles", seguridad(), get_disponibles);

async function get_disponibles(req, res) {
  const { estado, deposito } = req.query;
  const resultado = await controlador.inventariosDisponibles(estado, deposito);
  respuesta.success(req, res, resultado, 200);
}

router.get("/anomalias", seguridad(), get_anomalias);

async function get_anomalias(req, res) {
  const { nro_inventario, sucursal, deposito } = req.query;
  const resultado = await controlador.reporteDeAnomalias(
    nro_inventario,
    sucursal,
    deposito
  );
  respuesta.success(req, res, resultado, 200);
}

router.get("/reporte", seguridad(), get_reporte);

async function get_reporte(req, res) {
  const { id_inventario, categorias, incluir_sin_cambios, fecha_inicio, fecha_fin, deposito } = req.query;
  const resultado = await controlador.reporte_inventario(
    id_inventario,
    categorias,
    incluir_sin_cambios,
    fecha_inicio,
    fecha_fin,
    deposito
  );
  respuesta.success(req, res, resultado, 200);
}

router.post(
  "/actualizar-cantidad-inicial",
  seguridad(),
  actualizar_cantidad_inicial
);

async function actualizar_cantidad_inicial(req, res, next) {
  try {
    const { id_inventario, id_articulo, id_lote, cantidad } = req.body;
    
    // Agregar logs de depuración
    console.log('Datos recibidos:', {
      id_inventario,
      id_articulo,
      id_lote,
      cantidad,
      bodyCompleto: req.body
    });

    const resultado = await controlador.actualizar_cantidad_inicial(
      id_inventario,
      id_articulo,
      id_lote,
      cantidad
    );

    if (resultado.error) {
      return respuesta.error(req, res, resultado.mensaje, 400);
    }

    return respuesta.success(req, res, resultado);
  } catch (error) {
    console.error("Error detallado en actualizar_cantidad_inicial:", error);
    return respuesta.error(req, res, "Error interno del servidor", 500);
  }
}

router.post("/anular", seguridad(), anular_inventario);

async function anular_inventario(req, res) {
  const { id } = req.body;
  const resultado = await controlador.anular_inventario(id);
  respuesta.success(req, res, resultado, 200);
}

module.exports = router;
