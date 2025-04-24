const express = require("express");
const config = require("./config");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const usuarios = require("./modulos/usuarios/rutas.js");
const menu = require("./modulos/menu/rutas.js");
const permisos = require("./modulos/permisos/rutas.js");
const parametros = require("./modulos/parametros/rutas.js");
const configuraciones = require("./modulos/configuraciones/configuraciones/rutas.js");
const config_fact_elect = require("./modulos/configuraciones/config-factura-electronica/rutas.js");

const pacientes = require("./modulos/pacientes/rutas.js");
const sucursales = require("./modulos/sucursales/rutas.js");
const ciudades = require("./modulos/ciudades/rutas.js");
const depositos = require("./modulos/depositos/rutas.js");
const doctores = require("./modulos/doctores/rutas.js");
const maquinas = require("./modulos/maquinas/rutas.js");
const articulos = require("./modulos/articulos/rutas.js");
const agendamientos = require("./modulos/agendamientos/rutas.js");
const disponibilidades = require("./modulos/disponibilidades/rutas.js");
const reserva_turno = require("./modulos/reserva-turno/rutas.js");
const consultas = require("./modulos/consultas/rutas.js");
const atenciones = require("./modulos/atenciones/rutas.js");
const bloques = require("./modulos/bloques/rutas.js");
const boxes = require("./modulos/boxes/rutas.js");
const preagendamientos = require("./modulos/preagendamientos/rutas.js");
const especialidad = require("./modulos/especialidad/rutas.js");
const especialidades = require("./modulos/especialidades/rutas.js");

const prestadores = require("./modulos/prestadores/rutas.js");
const beneficiarios = require("./modulos/seguros/beneficiarios/rutas.js");
const seguro_visaciones = require("./modulos/seguros/visaciones/rutas.js");
const seguro_servicios = require("./modulos/seguros/servicios/rutas.js");
const seguro_detalle_cuota = require("./modulos/seguros/detalle-cuota/rutas.js");
const procedimiento_especialidad = require("./modulos/seguros/procedimiento-especialidad/rutas.js");

const dashboard_comercial = require("./modulos/ventas/dashboard/rutas.js");
const clientes = require("./modulos/ventas/clientes/rutas.js");
const definicion_ventas = require("./modulos/ventas/definicion-ventas/rutas.js");
const vendedores = require("./modulos/ventas/vendedores/rutas.js");
const pedidos = require("./modulos/ventas/pedidos/rutas.js");
const presupuestos = require("./modulos/ventas/presupuestos/rutas.js");
const venta = require("./modulos/ventas/venta/rutas.js");
const ventas_bonos = require("./modulos/ventas/ventas-bonos/rutas.js");
const listasprecios = require("./modulos/ventas/listasprecios/rutas.js");
const dvl = require("./modulos/ventas/division-vl/rutas.js");

const categorias = require("./modulos/stock/categorias/rutas.js");
const subcategorias = require("./modulos/stock/subcategorias/rutas.js");
const secciones = require("./modulos/stock/secciones/rutas.js");
const marcas = require("./modulos/stock/marcas/rutas.js");
const proveedores = require("./modulos/stock/proveedores/rutas.js");
const ubicaciones = require("./modulos/stock/ubicaciones/rutas.js");
const sububicaciones = require("./modulos/stock/sububicaciones/rutas.js");
const unidadmedidas = require("./modulos/stock/unidadmedidas/rutas.js");
const lineas = require("./modulos/stock/lineas/rutas.js");
const bloques_articulos = require("./modulos/stock/bloques-articulos/rutas.js");
const talles = require("./modulos/stock/talles/rutas.js");
const colores = require("./modulos/stock/colores/rutas.js");

const cotizaciones = require("./modulos/finanzas/cotizaciones/rutas.js");
const monedas = require("./modulos/finanzas/monedas/rutas.js");

const auditoria = require("./modulos/auditoria/rutas.js");

const agendas = require("./modulos/ruteo/agendas/rutas.js");

const reparto = require("./modulos/ruteo/reparto/rutas.js");

const archivosRouter = require("./modulos/archivos");

const caja = require("./modulos/ventas/caja/rutas.js");

const paises = require("./modulos/stock/nacionalidades/rutas.js");

const fabricantes = require("./modulos/stock/fabricantes/rutas.js");

const bancos = require("./modulos/finanzas/bancos/rutas.js");

const facturacion_electronica = require("./modulos/facturacion_electronica/rutas.js");

const inventarios = require("./modulos/inventarios/rutas");

const error = require("./red/errors.js");

const remisiones = require("./modulos/ventas/remisiones/rutas.js");

const upload_routes = require("../src/services/images_services/presupuesto_images.js");

const factura_images = require("../src/services/images_services/facura_image.js");

const configuraciones_web = require("./modulos/configuraciones_web/rutas.js");

const control_ingreso = require("./modulos/control_ingreso/rutas");

const direcciones = require("./modulos/direcciones/rutas")
//middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/upload",
  express.static(path.join(__dirname, "upload"), {
    setHeaders: (res, path, stat) => {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://concrecar.sofmar.com.py",
        "https://lobeck.sofmar.com.py",
        "https://gaesademo.sofmar.com.py",
      ];
      const origin = res.req.headers.origin;
      if (allowedOrigins.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
      }
      res.set("Access-Control-Allow-Methods", "GET, HEAD");
      res.set("Access-Control-Allow-Headers", "Content-Type");
    },
  })
);

let corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://concrecar.sofmar.com.py",
    "https://lobeck.sofmar.com.py",
    "https://gaesademo.sofmar.com.py",
    "https://ferrehanh.sofmar.com.py",
    "https://webapp.gaesa.com.py",
    "https://webapp.caofa.com.py",
  ],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

//Con esta función hacemos el control del filtro, sino lo cumple, entonces devuelve el error 422 con un mensaje.
app.use(function (err, req, res, next) {
  if (err.code === "LIMIT_FILE_TYPES") {
    res.status(422).json({ error: "Only images or files are allowed" });
  }
});

//configuraciones
app.set("port", config.con.port);

//rutas
app.use("/api/usuarios", usuarios);
app.use("/api/menu", menu);
app.use("/api/permisos", permisos);
app.use("/api/parametros", parametros);
app.use("/api/configuraciones", configuraciones);
app.use("/api/config-fact-elect", config_fact_elect);

app.use("/api/pacientes", pacientes);
app.use("/api/sucursales", sucursales);
app.use("/api/ciudades", ciudades);
app.use("/api/depositos", depositos);
app.use("/api/doctores", doctores);
app.use("/api/maquinas", maquinas);
app.use("/api/articulos", articulos);
app.use("/api/agendamientos", agendamientos);
app.use("/api/disponibilidades", disponibilidades);
app.use("/api/reserva-turno", reserva_turno);
app.use("/api/atenciones", atenciones);
app.use("/api/consultas", consultas);
app.use("/api/bloques", bloques);
app.use("/api/boxes", boxes);
app.use("/api/preagendamientos", preagendamientos);
app.use("/api/especialidad", especialidad);
app.use("/api/especialidades", especialidades);

app.use("/api/prestadores", prestadores);
app.use("/api/beneficiarios", beneficiarios);
app.use("/api/seguro-visaciones", seguro_visaciones);
app.use("/api/seguro-servicios", seguro_servicios);
app.use("/api/seguro-detalle-cuota", seguro_detalle_cuota);
app.use("/api/procedimiento-especialidad", procedimiento_especialidad);

app.use("/api/dashboard-comercial", dashboard_comercial);
app.use("/api/clientes", clientes);
app.use("/api/definicion-ventas", definicion_ventas);
app.use("/api/vendedores", vendedores);
app.use("/api/pedidos", pedidos);
app.use("/api/presupuestos", presupuestos);
app.use("/api/venta", venta);
app.use("/api/ventas-bonos", ventas_bonos);
app.use("/api/listasprecios", listasprecios);
app.use("/api/dvl", dvl);
app.use("/api/remisiones", remisiones);

app.use("/api/categorias", categorias);
app.use("/api/subcategorias", subcategorias);
app.use("/api/secciones", secciones);
app.use("/api/marcas", marcas);
app.use("/api/proveedores", proveedores);
app.use("/api/ubicaciones", ubicaciones);
app.use("/api/sububicaciones", sububicaciones);
app.use("/api/unidadmedidas", unidadmedidas);
app.use("/api/lineas", lineas);
app.use("/api/bloques-articulos", bloques_articulos);
app.use("/api/talles", talles);
app.use("/api/colores", colores);
app.use("/api/fabricantes", fabricantes);
app.use("/api/paises", paises);

app.use("/api/monedas", monedas);
app.use("/api/cotizaciones", cotizaciones);
app.use("/api/bancos", bancos);

app.use("/api/auditoria", auditoria);

app.use("/api/agendas", agendas);

app.use("/api/reparto", reparto);

app.use("/api/archivos", archivosRouter);

app.use("/api/caja", caja);

app.use("/api/upload-presupuesto-images", upload_routes);

app.use("/api/upload-factura-images", factura_images);

app.use("/api/facturacion-electronica", facturacion_electronica);

app.use("/api/inventarios", inventarios);

app.use("/api/configuraciones-web", configuraciones_web);
app.use(error);

app.use("/api/control-ingreso", control_ingreso);

app.use("/api/direcciones", direcciones);

module.exports = app;
