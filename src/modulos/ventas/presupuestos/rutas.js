const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')

router.post('/agregar',seguridad(), agregar)
router.get('/detalles', seguridad(), detalles)
router.post('/consultas', seguridad(), consultas)
router.get('/', seguridad(), uno)
router.post('/agregarPresupuesto', seguridad(), controlador.agregarPresupuesto)
router.post('/confirmarPresupuesto', seguridad(), confirmarPresupuesto)
router.post('/actualizarParcial', seguridad(), actualizarPresupuestoParcial)
router.get('/obtener', seguridad(),obtenerPresupuestosParaVenta)
router.post('/insertar-presupuesto', seguridad(), insertarPresupuesto)
router.get('/recuperar-presupuesto', seguridad(), recuperarPresupuesto)
router.get('/imprimir-presupuesto', seguridad(), imprimirPresupuesto)


async function imprimirPresupuesto (req, res, next){
  try{
    const result = await controlador.imprimirPresupuesto(req.query.id)
    respuesta.success(req, res, result, 200)
  }catch(err){
    next(err)
  }
}

async function recuperarPresupuesto (req, res, next){
  try{
    const result = await controlador.recuperarPresupuesto(req.query.id)
    respuesta.success(req, res, result, 200)
  } catch (err) {
    next(err)
  }
}

async function insertarPresupuesto (req, res, next){
  try{
    const presupuesto = req.body.presupuesto;
    const detalle_presupuesto = req.body.detallesPresupuesto;
    const result = await controlador.insertarPresupuesto(presupuesto, detalle_presupuesto)
    respuesta.success(req, res, result, 200)
    console.log(result)
  }catch(err){
    next(err)
  }
}


async function obtenerPresupuestosParaVenta (req, res, next){
  try{
    const result = await controlador.obtenerPresupuestosParaVenta(req.query.id)
    respuesta.success(req, res, result, 200)
  }catch(err){
    console.log(err)
    next(err)
  }
}

async function actualizarPresupuestoParcial (req, res, next){
  try{
    const {codigo, items} = req.body
    const result = await controlador.actualizarPresupuestoParcial(codigo, items)
    if (result){
      respuesta.success(req, res, result, 200)
   }else{
      respuesta.error(req, res, 'Error al actualizar presupuesto', 500)
    }
  }catch(err){
    next(err)
  }
}

async function confirmarPresupuesto (req, res, next){
  try{
    const presupuestoId = req.body.id;
    const result = await controlador.confirmarPresupuesto(presupuestoId);
    respuesta.success(req, res, result, 200);
  }catch(err){
    next(err);
  }
}

async function uno (req, res, next){
  try {
      const item = await controlador.uno(req.query.cod);
      respuesta.success(req, res, item, 200); 
  } catch (err) {
      next(err);
  }
}

async function consultas (req, res, next){
  try {
    console.log(req.body)
      const bod = req.body;
      const items = await controlador.getCabeceras(bod.fecha_desde, bod.fecha_hasta, bod.sucursal, bod.cliente, bod.vendedor, bod.articulo, bod.moneda, bod.estado, bod.busqueda);
      
      respuesta.success(req, res, items, 200);
  } catch (err) {
      next(err);
  }
}


async function detalles (req, res, next){
  try {
      const items = await controlador.getDetalles(req.query.cod);
      
      respuesta.success(req, res, items, 200);
      console.log(items)
  } catch (err) {
      next(err);
  }
}

async function agregar (req, res, next){
  try {
    //Carga cabecera de presupuesto - Tabla "presupuesto"
    const presupuesto = req.body.presupuesto;
    const total_presupuesto = presupuesto.pre_total;
    delete presupuesto.pre_total;
    const articulos = req.body.tabla;

    //Carga detalle - Para luego cargar tablas "detalle_presupuesto"
    let detalles = [];
    let detalle = null;

    const porc_descuento = ((100 * presupuesto.pre_descuento) / (total_presupuesto+presupuesto.pre_descuento))/100;
    let subtotal_detalle = 0;

    if (presupuesto.pre_codigo === 0){ //Es una carga nueva
      let presupuesto_nuevo = await controlador.agregarCabecera(presupuesto);

      for (i=0; i < articulos.length; i++) {
          let descuento_calculado = Math.round((articulos[i].tabla_precio_venta - articulos[i].tabla_descuento) * porc_descuento);

          detalle = {
              depre_codigo: 0,
              depre_presupuesto: presupuesto_nuevo.insertId,
              depre_articulo: articulos[i].tabla_ar_codigo,
              depre_cantidad: articulos[i].tabla_cantidad,
              depre_precio: articulos[i].tabla_precio_venta - articulos[i].tabla_descuento - descuento_calculado,
              depre_descuento: articulos[i].tabla_descuento + descuento_calculado,
              depre_exentas: 0,
              depre_cinco: 0,
              depre_diez: 0,
              depre_porcentaje: 0,
              depre_altura: 0,
              depre_largura: 0,
              depre_mts2: 0,
              depre_listaprecio: articulos[i].tabla_listaprecio,
              depre_talle: "",
              depre_codlote: articulos[i].tabla_al_codigo,
              depre_lote: articulos[i].tabla_lote,
              depre_vence: articulos[i].tabla_vence,
              depre_descripcio_art: '',
              depre_obs: articulos[i].tabla_obs,
              depre_procesado: 0,
          }

          subtotal_detalle = articulos[i].tabla_cantidad * (articulos[i].tabla_precio_venta - articulos[i].tabla_descuento - descuento_calculado);

          switch (articulos[i].tabla_iva){
          case 1: //Exentas
              detalle.depre_exentas = subtotal_detalle;
              break;
          case 2: //10%
              detalle.depre_diez = subtotal_detalle;
              break;
          case 3: //5%
              detalle.depre_cinco = subtotal_detalle;
              break;
          }

          detalles.push(detalle);
      }

      for (d=0; d < detalles.length; d++){
          nuevo_detalle = await controlador.agregarDetalle(detalles[d]);
      }

      respuesta.success(req, res, presupuesto_nuevo.insertId, 200);
    }else{ //Es una modificación
      await controlador.agregarCabecera(presupuesto); //Actualizar cabecera

      const para_eliminar = await controlador.getDetalles(presupuesto.pre_codigo) //Traemos los detalles existentes para comparar eliminados
      
      for (i=0; i < articulos.length; i++) {
        let descuento_calculado = Math.round((articulos[i].tabla_precio_venta - articulos[i].tabla_descuento) * porc_descuento);

        for (c=0; c < para_eliminar.length; c++){
          if (articulos[i].tabla_codigo === para_eliminar[c].det_codigo){
            para_eliminar.splice(c, 1); //Sacamos de la cola a eliminar si existe aún
            break;
          }
        }

        detalle = {
            depre_codigo: articulos[i].tabla_codigo,
            depre_presupuesto: presupuesto.pre_codigo,
            depre_articulo: articulos[i].tabla_ar_codigo,
            depre_cantidad: articulos[i].tabla_cantidad,
            depre_precio: articulos[i].tabla_precio_venta - articulos[i].tabla_descuento - descuento_calculado,
            depre_descuento: articulos[i].tabla_descuento + descuento_calculado,
            depre_exentas: 0,
            depre_cinco: 0,
            depre_diez: 0,
            depre_porcentaje: 0,
            depre_altura: 0,
            depre_largura: 0,
            depre_mts2: 0,
            depre_listaprecio: articulos[i].tabla_listaprecio,
            depre_talle: "",
            depre_codlote: articulos[i].tabla_al_codigo,
            depre_lote: articulos[i].tabla_lote,
            depre_vence: articulos[i].tabla_vence,
            depre_descripcio_art: '',
            depre_obs: articulos[i].tabla_obs,
            depre_procesado: 0,
        }

        subtotal_detalle = articulos[i].tabla_cantidad * (articulos[i].tabla_precio_venta - articulos[i].tabla_descuento - descuento_calculado);

        switch (articulos[i].tabla_iva){
        case 1: //Exentas
            detalle.depre_exentas = subtotal_detalle;
            break;
        case 2: //10%
            detalle.depre_diez = subtotal_detalle;
            break;
        case 3: //5%
            detalle.depre_cinco = subtotal_detalle;
            break;
        }

        detalles.push(detalle);
      }

      for (d=0; d < detalles.length; d++){
        await controlador.agregarDetalle(detalles[d]);
      }

      for (p=0; p < para_eliminar.length; p++){
          await controlador.eliminarDetalle(para_eliminar[p].det_codigo);
      }

      respuesta.success(req, res, presupuesto.pre_codigo, 200);
    }
  } catch (err) {
      next(err);
  }
}

module.exports = router;