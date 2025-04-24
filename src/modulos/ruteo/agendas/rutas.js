const express = require("express");
const seguridad = require("../../../middleware/seguridad");
const router = express.Router();
const respuesta = require("../../../red/respuestas.js");
const controlador = require("./index.js");
const auth = require("../../../auth/index.js");

router.post("/", todos);
router.get("/notas/:id", seguridad(), notas);
router.get("/localizaciones/:id", seguridad(), localizaciones);

router.get("/graficos", seguridad(), graficos);

router.post("/agregar", seguridad(), agregar);
router.post("/nueva-nota", seguridad(), agregarNota);
router.post("/registrar-llegada", seguridad(), registrarLlegada);
router.post("/registrar-salida", seguridad(), registrarSalida);
router.post("/finalizar-visita", seguridad(), finalizarVisita);
router.post("/reagendar-visita", seguridad(), reagendarVisita);
router.post("/anular-visita", seguridad(), anularVisita);

router.get("/:id", seguridad(), uno);
router.put("/:id", seguridad(), eliminar);

router.post("/contarvisitas", seguridad(), contarVisitas);
router.post("/tiempopromedio", seguridad(), tiempoPromedio);
router.post("/top-vendedores", seguridad(), topVendedores);
router.post("/top-clientes", seguridad(), topClientes);
router.post("/grafico-general", seguridad(), graficoGeneral);
router.post('/grafico-por-vendedor', seguridad(), graficoPorVendedor);
router.post('/consultar-ventas-y-detalles', seguridad(), consultarVentasYDetalles);
router.post('/consultar-pedidos-y-detalles', seguridad(), consultarPedidosYDetalles);


async function consultarPedidosYDetalles(req, res, next) {
  try {
    const items = await controlador.consultarPedidosYDetalles(req.body.cliente);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
} 

async function consultarVentasYDetalles(req, res, next) {
  try {
    const items = await controlador.consultarVentasYDetalles(req.body.cliente);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }

}

async function graficoPorVendedor(req, res, next) {
  try {
    const items = await controlador.obtenerDatosGraficoPorVendedor(
      req.body.desde,
      req.body.hasta,
      req.body.vendedor
    );
    respuesta.success(req, res, items, 200);
    console.log(items);
  } catch (err) {
    next(err);
  }
}

async function graficoGeneral(req, res, next) {
  try {
    console.log(req.body);
    const items = await controlador.obtenerDatosGrafico(
      req.body.desde,
      req.body.hasta
    );
    respuesta.success(req, res, items, 200);
    console.log(items);
  } catch (err) {
    next(err);
  }
}

async function topClientes(req, res, next) {
  try {
    const items = await controlador.topClientes(req.body.desde, req.body.hasta);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function topVendedores(req, res, next) {
  try {
    const items = await controlador.topVendedores(
      req.body.desde,
      req.body.hasta
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function contarVisitas(req, res, next) {
  try {
    const items = await controlador.contarAgendamientos(
      req.body.desde,
      req.body.hasta,
      req.body.vendedor
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function tiempoPromedio(req, res, next) {
  try {
    const items = await controlador.tiempoPromedioVisitas(
      req.body.desde,
      req.body.hasta,
      req.body.vendedor
    );
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function uno(req, res, next) {
  try {
    const item = await controlador.uno(req.params.id);
    respuesta.success(req, res, item, 200);
  } catch (err) {
    next(err);
  }
}

async function notas(req, res, next) {
  try {
    const items = await controlador.notas(req.params.id);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function localizaciones(req, res, next) {
  try {
    const items = await controlador.localizaciones(req.params.id);
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function graficos(req, res, next) {
  try {
    const hoy = new Date();
    const mes_actual_date = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const mes_anterior_date = new Date(
      hoy.getFullYear(),
      hoy.getMonth() - 1,
      1
    );
    const mes_actual_inicio = `${mes_actual_date.getFullYear()}-${(
      "0" +
      (mes_actual_date.getMonth() + 1)
    )
      .toString()
      .slice(-2)}-${("0" + mes_actual_date.getDate()).toString().slice(-2)}`;
    const mes_anterior_inicio = `${mes_anterior_date.getFullYear()}-${(
      "0" +
      (mes_anterior_date.getMonth() + 1)
    )
      .toString()
      .slice(-2)}-${("0" + mes_anterior_date.getDate()).toString().slice(-2)}`;

    const agendamientos = await controlador.agendamientos(
      req.query.desde,
      req.query.hasta,
      req.query.user,
      mes_actual_inicio,
      mes_anterior_inicio
    );
    const clientes = await controlador.clientes(mes_actual_inicio);
    const ruteos = await controlador.ruteos(
      req.query.desde,
      req.query.hasta,
      req.query.user,
      mes_actual_inicio,
      mes_anterior_inicio
    );
    const ruteo_por_vendedor = await controlador.ruteoPorVendedor(
      req.query.desde,
      req.query.hasta
    );
    const planificaciones_por_mes = await controlador.planificacionesPorMes(
      `${hoy.getFullYear()}-01-01`,
      `${hoy.getFullYear()}-12-31`
    );
    const planificaciones_por_vend = await controlador.planificacionesPorVend(
      `${hoy.getFullYear()}-01-01`,
      `${hoy.getFullYear()}-12-31`
    );
    const items = [
      { ...agendamientos[0] },
      { ...clientes[0] },
      { ...ruteos[0] },
      [...ruteo_por_vendedor],
      { ...planificaciones_por_mes },
      { ...planificaciones_por_vend },
    ];
    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function todos(req, res, next) {
  try {
    console.log(req.body);
    const bod = req.body;

    const validarVendedor = (vendedor) => {
      if (Array.isArray(vendedor)) {
        return vendedor.length > 0 ? vendedor : null;
      }
      return vendedor > 0 ? vendedor : null;
    };
    const items = await controlador.todos(
      bod.fecha_desde,
      bod.fecha_hasta,
      bod.cliente && bod.cliente.length > 0 ? bod.cliente : null,
      validarVendedor(bod.vendedor),
      bod.visitado,
      bod.estado,
      bod.planificacion,
      bod.notas,
      bod.orden

    );

    respuesta.success(req, res, items, 200);
  } catch (err) {
    next(err);
  }
}

async function agregar(req, res, next) {
  try {
    await controlador.agregar(req.body);
    let message = "";
    if (req.body.a_codigo == 0) {
      message = "Guardado con éxito";
    } else {
      message = "Item no guardado";
    }
    respuesta.success(req, res, message, 201);
  } catch (error) {
    next(error);
  }
}

async function agregarNota(req, res, next) {
  try {
    await controlador.agregarNota(req.body);
    let message = "";
    if (req.body.an_codigo == 0) {
      message = "Guardado con éxito";
    } else {
      message = "Item no guardado";
    }
    respuesta.success(req, res, message, 201);
  } catch (error) {
    next(error);
  }
}

async function registrarLlegada(req, res, next) {
  try {
    console.log(req.body);
    await controlador.agregarLocalizacion(req.body);
    let message = "";
    if (req.body.l_codigo == 0) {
      message = "Guardado con éxito";
    } else {
      message = "Item no guardado";
    }
    respuesta.success(req, res, message, 201);
  } catch (error) {
    next(error);
  }
}


async function registrarSalida(req, res, next) {
  try {
    await controlador.registrarSalida(req.body.l_agenda, req.body.l_hora_fin);
    respuesta.success(req, res, "Salida registrada con éxito", 201);
  } catch (error) {
    next(error);
  }
}


async function reagendarVisita(req, res, next) {
  try {
    await controlador.reagendarVisita(
      req.body.a_codigo,
      req.body.a_prox_llamada,
      req.body.a_hora_prox
    );
    respuesta.success(req, res, "Reagendado con éxito", 201);
  } catch (error) {
    next(error);
  }
}

async function anularVisita(req, res, next) {
  try {
    await controlador.anularVisita(req.body.a_codigo);
    respuesta.success(req, res, "Anulado con éxito", 201);
  } catch (error) {
    next(error);
  }
}

async function finalizarVisita(req, res, next) {
  try {
    await controlador.finalizarVisita(
      req.body.a_codigo,
      req.body.a_latitud,
      req.body.a_longitud
    );

    let message = "";
    if (req.body.l_codigo == 0) {
      message = "Guardado con éxito";
    } else {
      message = "Item no guardado";
    }
    respuesta.success(req, res, message, 201);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    await controlador.eliminar(req.params.id);
    respuesta.success(req, res, "Item eliminado satisfactoriamente!", 200);
  } catch (err) {
    next(err);
  }
}

router.post('/subvisitas', seguridad(), crearSubvisita);
router.get('/subvisitas/todos', seguridad(), getSubvisitas);
router.post('/subvisitas/actualizar', seguridad(), actualizarSubvisita);

async function actualizarSubvisita(req, res, next) {
  try {
    console.log(req.body);
    await controlador.actualizarSubvisita(req.body);
    respuesta.success(req, res, "Subvisita actualizada con éxito", 201);
  } catch (error) {
    next(error);
  }
}

async function crearSubvisita(req, res, next) {
  try {
    await controlador.crearSubvisita(req.body);
    respuesta.success(req, res, "Subvisita creada con éxito", 201);
  } catch (error) {
    next(error);
  }
}

async function getSubvisitas(req, res, next) {
  try { 
    const items = await controlador.getSubvisitas(req.query.id_agenda);
    respuesta.success(req, res, items, 200);
  } catch (error) {
    next(error);
  }
}



module.exports = router;
