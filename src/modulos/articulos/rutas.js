const express = require("express");
const seguridad = require("../../middleware/seguridad");
const router = express.Router();
const respuesta = require("../../red/respuestas.js");
const controlador = require("./index.js");
const auth = require("../../auth/index.js");

router.get("/", seguridad(), todos);
router.get("/lista-barra", seguridad(), listar_por_barra);
router.get("/directa", seguridad(), todosDirecta);
router.get("/uno", seguridad(), uno);
router.get("/barra", seguridad(), barra);
router.get("/pedido-remision", seguridad(), enPedidoRemision);
router.post("/informe", seguridad(), informe_stock);
router.post("/resumen-comprasventas", seguridad(), resumen_comprasventas);
router.post("/ver_lotes_talle", seguridad(), ver_lotes_talle);
router.post("/agregar-inventario", agregarInventario);
router.post("/agregar-item-inventario", agregarItemInventario);
router.post(
  "/agregar-item-inventario-con-vencimiento",
  agregarItemInventarioConVencimiento
);
router.post("/agregar-item", agregarItem);
router.get("/ultimo-nro-inventario", seguridad(), ultimoNroInventario);
router.post("/insertar-reconteo", seguridad(), insertarReconteo);
router.get("/reporte-reconteo", seguridad(), reporte_reconteo);
router.get("/todos", seguridad(), todosNuevo);
router.get("/categorias-articulos", seguridad(), categoriasArticulos);
router.get("/marcas-articulos", seguridad(), marcasArticulos);
router.get("/secciones-articulos", seguridad(), seccionesArticulos);
router.get("/toma-inventario-items", seguridad(), tomaInventario);
router.get("/toma-inventario-scanner", seguridad(), tomaInventarioScanner);
router.post(
  "/insertar-item-conteo-scanner",
  seguridad(),
  insertarItemConteoScanner
);
router.post(
  "/insertar-inventario-auxiliar",
  seguridad(),
  insertarInventarioAuxiliar
);
router.post(
  "/insertar-inventario-auxiliar-items",
  seguridad(),
  insertarInventarioAuxiliarItems
);
router.post("/insertar-conteo-scanner", seguridad(), insertarConteoScanner);
router.get(
  "/ultimo-inventario-auxiliar",
  seguridad(),
  ultimoInventarioAuxiliar
);
router.post(
  "/cerrar-inventario-auxiliar",
  seguridad(),
  cerrarInventarioAuxiliar
);
router.get(
  "/mostrar-items-inventario-auxiliar",
  seguridad(),
  mostrarItemsInventarioAuxiliar
);
router.get(
  "/mostrar-items-inventario-auxiliar-principal",
  seguridad(),
  mostrarItemsInventarioAuxiliarPrincipal
);
router.post(
  "/scannear-item-inventario-auxiliar",
  seguridad(),
  scannearItemInventarioAuxiliar
);
router.get("/reporte-anomalias", seguridad(), reporteAnomalias);
router.get("/consulta-articulos", seguridad(), consultaArticulosSimplificado);
router.get("/inventarios-disponibles", seguridad(), inventariosDisponibles);
router.get(
  "/anular-inventario-auxiliar",
  seguridad(),
  anularInventarioAuxiliar
);
router.get("/reporte-inventario", seguridad(), reporte_inventario);
router.get("/buscar-articulos", seguridad(), buscarArticulos);

router.get('/pedido', seguridad(), pedidosArticulo)

async function pedidosArticulo(req, res, next){
  try {
    const items = await controlador.getArticulosEnPedidos(req.query.articulo_id, req.query.id_lote);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}


async function anularInventarioAuxiliar(req, res, next) {
  try {
    const items = await controlador.anularInventarioAuxiliar(req.query.id);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function inventariosDisponibles(req, res, next) {
  try {
    console.log(req.query);
    const items = await controlador.inventariosDisponibles(
      req.query.estado,
      req.query.deposito,
      req.query.sucursal
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function consultaArticulosSimplificado(req, res, next) {
  try {
    console.log(req.query);
    const items = await controlador.consultaArticulosSimplificado(
      req.query.articulo_id,
      req.query.busqueda,
      req.query.codigo_barra,
      req.query.moneda,
      req.query.stock,
      req.query.deposito,
      req.query.marca,
      req.query.categoria,
      req.query.ubicacion,
      req.query.proveedor,
      req.query.cod_interno
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function buscarArticulos(req, res, next) {
  try {
    const items = await controlador.buscarArticulos(
      req.query.articulo_id,
      req.query.busqueda,
      req.query.codigo_barra,
      req.query.moneda,
      req.query.stock,
      req.query.deposito,
      req.query.marca,
      req.query.categoria,
      req.query.ubicacion,
      req.query.proveedor,
      req.query.cod_interno,
      req.query.lote,
      req.query.negativo
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}
async function reporteAnomalias(req, res, next) {
  try {
    const items = await controlador.reporteDeAnomalias(
      req.query.nro_inventario,
      req.query.sucursal,
      req.query.deposito
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function scannearItemInventarioAuxiliar(req, res, next) {
  try {
    console.log(req.body);
    const items = await controlador.scannearItemInventarioAuxiliar(
      req.body.id_articulo,
      req.body.id_lote,
      req.body.cantidad,
      req.body.lote,
      req.body.codigo_barras,
      req.body.id_inventario
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function mostrarItemsInventarioAuxiliar(req, res, next) {
  try {
    const items = await controlador.mostrarItemsDelInventarioAuxiliar(
      req.query.id,
      req.query.id_inventario,
      req.query.buscar,
      req.query.deposito
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function mostrarItemsInventarioAuxiliarPrincipal(req, res, next) {
  try {
    console.log(req.query);
    const items = await controlador.mostrarItemsDelInventarioAuxiliarPrincipal(
      req.query.id,
      req.query.scanneado,
      req.query.deposito,
      req.query.sucursal,
      req.query.buscar,
      req.query.id_inventario
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function cerrarInventarioAuxiliar(req, res, next) {
  try {
    console.log(req.body);
    const items = await controlador.cerrarInventarioAuxiliar(
      req.body.id,
      req.body.operador,
      req.body.sucursal,
      req.body.deposito,
      req.body.nro_inventario,
      req.body.autorizado
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function ultimoInventarioAuxiliar(req, res, next) {
  try {
    console.log(req.query);
    const items = await controlador.ultimoInventarioAuxiliar(
      req.query.deposito,
      req.query.sucursal,
      req.query.nro_inventario
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function insertarItemConteoScanner(req, res, next) {
  try {
    const items = await controlador.insertarItemConteoScanner(req.body);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function insertarInventarioAuxiliar(req, res, next) {
  try {
    console.log(req.body);
    const inventario = req.body;
    const inventario_items = req.body.inventario_items;
    const items = await controlador.insertarInventarioAuxiliar(
      inventario,
      inventario_items
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function insertarInventarioAuxiliarItems(req, res, next) {
  try {
    console.log(req.body);
    const items = await controlador.insertarInventarioAuxiliarItems(
      req.body.inventario_items,
      req.body.inventario_id
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function insertarConteoScanner(req, res, next) {
  try {
    const { cantidad, id_articulo, id_lote, id_inventario } = req.body;
    const items = await controlador.insertarConteoScanner(
      cantidad,
      id_articulo,
      id_lote,
      id_inventario
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function tomaInventarioScanner(req, res, next) {
  try {
    const { deposito_id, articulo_id, ubicacion, sub_ubicacion, categorias } =
      req.query;
    const items = await controlador.itemTomaInventarioScanner(
      deposito_id,
      articulo_id,
      ubicacion,
      sub_ubicacion,
      categorias
    );
    respuesta.success(req, res, items, 200);
  } catch (error) {
    next(error);
  }
}
async function tomaInventario(req, res, next) {
  try {
    console.log(req.query);
    const {
      deposito_id,
      articulo_id,
      ubicacion,
      sub_ubicacion,
      categorias,
      marcas,
    } = req.query;
    const items = await controlador.itemTomaInventario(
      deposito_id,
      articulo_id,
      ubicacion,
      sub_ubicacion,
      categorias,
      marcas
    );
    respuesta.success(req, res, items, 200);
  } catch (error) {
    next(error);
  }
}

async function categoriasArticulos(req, res, next) {
  try {
    const items = await controlador.categoriasArticulos();
    respuesta.success(req, res, items, 200);
  } catch (error) {
    next(error);
  }
}

async function marcasArticulos(req, res, next) {
  try {
    const items = await controlador.marcasArticulos();
    respuesta.success(req, res, items, 200);
  } catch (error) {
    next(error);
  }
}

async function seccionesArticulos(req, res, next) {
  try {
    const items = await controlador.seccionesArticulos();
    respuesta.success(req, res, items, 200);
  } catch (error) {
    next(error);
  }
}

async function todosNuevo(req, res, next) {
  try {
    console.log("###Esta es la query ###", req.query);

    const busqueda = req.query.busqueda;
    const deposito = req.query.deposito;
    const stock = req.query.stock;
    const marca = req.query.marca;
    const categoria = req.query.categoria;
    const subcategoria = req.query.subcategoria;
    const proveedor = req.query.proveedor;
    const ubicacion = req.query.ubicacion;
    const servicio = req.query.servicio;
    const moneda = req.query.moneda;
    const unidadMedida = req.query.unidadMedida;
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 50;
    const tipoValorizacionCosto = req.query.tipoValorizacionCosto;

    const items = await controlador.todosNuevo(
      busqueda,
      deposito,
      stock,
      marca,
      categoria,
      subcategoria,
      proveedor,
      ubicacion,
      servicio,
      moneda,
      unidadMedida,
      pagina,
      limite,
      tipoValorizacionCosto
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function reporte_reconteo(req, res, next) {
  try {
    console.log(req.query);
    const { marca, deposito, categoria, proveedor } = req.query;

    const items = await controlador.reporte_reconteo({
      marca,
      deposito,
      categoria,
      proveedor,
    });
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

router.get("/traer-todos-los-articulos", async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 50;

    const articulos = await controlador.traerTodosLosArticulos(
      pagina,
      limite,
      req.query
    );
    res.json(articulos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function ultimoNroInventario(req, res, next) {
  try {
    const items = await controlador.nroUltimoInventario();
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function agregarItem(req, res, next) {
  try {
    const datos = req.body;
    const items = await controlador.insertarArticulo(datos);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function insertarReconteo(req, res, next) {
  try {
    console.log(req.body);
    const item = req.body;
    const items = await controlador.insertar_reconteo(item);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function agregarInventario(req, res, next) {
  try {
    console.log(req.body);
    const consulta = req.body;
    const items = await controlador.insertarInventario(consulta);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function agregarItemInventario(req, res, next) {
  try {
    const consulta = req.body;
    const items = await controlador.insertarItemInventario(consulta);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function agregarItemInventarioConVencimiento(req, res, next) {
  try {
    const consulta = req.body;
    const items = await controlador.insertarItemInventarioConVencimiento(
      consulta
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function todos(req, res, next) {
  try {
    console.log(req.query);
    const items = await controlador.todos(
      req.query.buscar,
      req.query.id_deposito,
      req.query.stock
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function resumen_comprasventas(req, res, next) {
  try {
    const consulta = req.body;

    const fecha_desde = consulta.fecha_desde;
    const fecha_hasta = consulta.fecha_hasta;
    const depositos = consulta.codigos.depositos.toString();
    const articulos = consulta.codigos.articulos.toString();
    const marcas = consulta.codigos.marcas.toString();
    const categorias = consulta.codigos.categorias.toString();
    const subcategorias = consulta.codigos.subcategorias.toString();
    const proveedores = consulta.codigos.proveedores.toString();
    const moneda = consulta.codigos.moneda;
    const tipo_valorizacion = consulta.codigos.tipo_valorizacion;
    const talles =
      consulta.codigos.talles_ropa.toString() +
      consulta.codigos.talles_calzado.toString();
    const colores = consulta.codigos.colores.toString();

    const items = await controlador.resumen_comprasventas(
      fecha_desde,
      fecha_hasta,
      depositos,
      articulos,
      marcas,
      categorias,
      subcategorias,
      proveedores,
      moneda,
      tipo_valorizacion,
      talles,
      colores
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function informe_stock(req, res, next) {
  try {
    const consulta = req.body;

    const depositos = consulta.depositos.toString();
    const articulos = consulta.articulos.toString();
    const ubicaciones = consulta.ubicaciones.toString();
    const sububicaciones = consulta.sububicaciones.toString();
    const categorias = consulta.categorias.toString();
    const subcategorias = consulta.subcategorias.toString();
    const marcas = consulta.marcas.toString();
    const presentaciones = consulta.presentaciones.toString();
    const proveedores = consulta.proveedores.toString();
    const lineas = consulta.lineas.toString();
    const bloques = consulta.bloques.toString();
    const moneda = consulta.moneda;
    const est_stock = consulta.est_stock;
    const tipo_valorizacion = consulta.tipo_valorizacion;
    const talles =
      consulta.talles_ropa.toString() + consulta.talles_calzado.toString();
    const colores = consulta.colores.toString();

    const items = await controlador.informe_stock(
      depositos,
      articulos,
      ubicaciones,
      sububicaciones,
      categorias,
      subcategorias,
      marcas,
      presentaciones,
      proveedores,
      lineas,
      bloques,
      moneda,
      est_stock,
      tipo_valorizacion,
      talles,
      colores
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function listar_por_barra(req, res, next) {
  try {
    const items = await controlador.listar_por_barra();
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function todosDirecta(req, res, next) {
  try {
    console.log(req.query);
    const items = await controlador.todosDirecta(
      req.query.busqueda,
      req.query.deposito,
      req.query.stock
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function uno(req, res, next) {
  try {
    const items = await controlador.uno(
      req.query.articulo,
      req.query.deposito,
      req.query.lote
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function barra(req, res, next) {
  try {
    const items = await controlador.barra(
      req.query.articulo,
      req.query.deposito,
      req.query.lote
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function enPedidoRemision(req, res, next) {
  try {
    const items = await controlador.enPedidoRemision(
      req.query.articulo,
      req.query.lote
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function ver_lotes_talle(req, res, next) {
  try {
    const articulos_codigos = req.body;
    const items = await controlador.ver_lotes_talle(articulos_codigos);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function reporte_inventario(req, res, next) {
  try {
    const items = await controlador.reporte_inventario(req.query);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}
module.exports = router;
