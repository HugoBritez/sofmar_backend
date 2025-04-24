const express = require('express');
const seguridad = require('../../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../../auth/index.js')


router.post('/listar', seguridad(), listar)
router.post('/cobertura', seguridad(), cobertura)
router.get('/procedimientos', seguridad(), procedimientos)

async function listar (req, res, next){
  try {
      const request = req.body;
      
      const habilitar_servicios = request.habilitar;
      const seguro_cod = request.seguro;
      const prestador = request.prest;
      const responsable = request.resp;
      const marcados = request.marc;
      const plan = request.plan;
      const buscar = request.ser_busq;
      const fecha_ingreso = request.fing;
      const adelanto_carencia = request.acaren;
      const fecha_visacion = request.fvis;
      const paciente = request.pac;
      const flag_consultas = request.flag_1;
      const flag_estudios = request.flag_2;
      const flag_laboratorios = request.flag_3;
      const flag_imagenes = request.flag_4;
      const flag_sanatoriales = request.flag_5;
      const flag_procedimientos = request.flag_6;

      //Calcular dias transcurridos entre ingreso y visación
      const _MS_POR_DIA = 1000 * 60 * 60 * 24; //1 día en milisegundos
      const f_contrato = new Date(fecha_ingreso);
      const f_visacion = new Date(fecha_visacion);
      const f_contrato_utc = Date.UTC(f_contrato.getFullYear(), f_contrato.getMonth(), f_contrato.getDate());
      const f_visacion_utc = Date.UTC(f_visacion.getFullYear(), f_visacion.getMonth(), f_visacion.getDate());
      const dias_transcurridos = Math.floor(((f_visacion_utc - f_contrato_utc) + adelanto_carencia) / _MS_POR_DIA);
      const inicio_visacion = new Date(f_visacion.getFullYear(), f_visacion.getMonth(), 1);

      let items = [];
      let consultas = [];
      let estudios = [];
      let laboratorios = [];
      let imagenes = [];
      let sanatoriales = [];
      let procedimientos = [];
      if (flag_consultas) consultas = await controlador.getConsultas(habilitar_servicios, seguro_cod, prestador, responsable, marcados, plan, buscar, dias_transcurridos);
      if (flag_estudios) estudios = await controlador.getEstudios(habilitar_servicios, seguro_cod, prestador, responsable, marcados, plan, buscar, dias_transcurridos);
      if (flag_laboratorios) laboratorios = await controlador.getLaboratorios(habilitar_servicios, seguro_cod, prestador, responsable, marcados, plan, buscar, dias_transcurridos);
      if (flag_imagenes) imagenes = await controlador.getImagenes(habilitar_servicios, seguro_cod, prestador, responsable, marcados, plan, buscar, dias_transcurridos);
      if (flag_sanatoriales) sanatoriales = await controlador.getSanatoriales(habilitar_servicios, seguro_cod, prestador, responsable, marcados, plan, buscar, dias_transcurridos);
      if (flag_procedimientos) procedimientos = await controlador.getUrgencias(habilitar_servicios, seguro_cod, prestador, responsable, marcados, plan, buscar, dias_transcurridos);

      items = [...consultas, ...estudios, ...laboratorios,  ...imagenes, ...sanatoriales, ...procedimientos];

      // Estado-Color de fila
      for (i in items){
          let cantIlimitada = false;

          items[i].estado = 2; //0 gris, 1 azul, 2 verde, 3 rojo, 4 amarillo, 5 lila

          //const mes_ingreso = f_contrato.getMonth();
          //const mes_visacion = f_visacion.getMonth();
          items[i].inicio_rango = new Date(f_contrato.getFullYear(), f_contrato.getMonth(), 1);
          items[i].fin_rango = new Date(f_contrato.getFullYear(), f_contrato.getMonth() + items[i].renovacion-1, 1);
          

          if (items[i].habilitar === 0 || items[i].utilizar === 0) items[i].estado = 0; //Gris

          if (!/^\d*$/.test(items[i].cantdisp)){ //Si hay algún carácter que no es número, es decir, tiene letra(s), es decir, es "ILIMITADO"
              cantIlimitada = true;
          }

          if (items[i].carencia > dias_transcurridos){
              items[i].estado = 4; //Amarillo
          }

          if (items[i].cantdisp < 1 && cantIlimitada === false){
              items[i].estado = 3; //Rojo
          }

          if (items[i].renovacion > 0){
              while (items[i].fin_rango < inicio_visacion){
                  items[i].inicio_rango.setMonth(items[i].inicio_rango.getMonth() + items[i].renovacion)
                  items[i].fin_rango.setMonth(items[i].fin_rango.getMonth() + items[i].renovacion)
              }
          }

          const titularBuscar = await controlador.getTitular(paciente); //Si el paciente es el titular, va a traer lo mismo
          let titular = 0;
          if (titularBuscar.length[0]){
              titular = titularBuscar[0].tit;
          }else{
              titular = paciente;
          }
          let pacientes_str = "0," + titular; //Titular agregamos una sola vez
          const pacientes = await controlador.getAdherentes(titular); //Trae adherentes
          if (pacientes.length > 0){
              for (p in pacientes){
                  pacientes_str += "," + pacientes[p].adhe;
              }
          }

          const visaciones_realizadas = await controlador.visacionesRealizadas(items[i].codigo, items[i].tiposer, pacientes_str);
          let suma_cantidad = 0;
          let dias_utilizados = 0;
          if (visaciones_realizadas.length > 0){
              for (vr in visaciones_realizadas){
                  const fecha_servicio = new Date (visaciones_realizadas[vr].fecha);
                  if ((fecha_servicio >= items[i].inicio_rango) && (fecha_servicio <= items[i].fin_rango)){
                      suma_cantidad += visaciones_realizadas[vr].cantidad;
                      dias_utilizados += visaciones_realizadas[vr].diasUtilizados;
                  }
              }
          }

          items[i].cantidadUtilizada = suma_cantidad;
          if (!cantIlimitada){
              items[i].cantdisp = parseInt(items[i].cantdisp) - suma_cantidad;
          }
          items[i].diasutilizados = dias_utilizados;
          items[i].diasdisp -= items[i].diasutilizados;

          if ((suma_cantidad >= items[i].cantdisp) && (!cantIlimitada)){
              items[i].estado = 3; //Rojo
          }

          if (items[i].diasutilizados > 0){
              if (items[i].diasdisp == 0){
                  items[i].estado = 5; //Lila
              }
          }
      }

      if (request.filtrar_verdes){
          const soloVerdes = items.filter(item => item.estado === 2);
          items = soloVerdes;
      }
      
      respuesta.success(req, res, items, 200);
  } catch (err) {
      next(err);
  }
}

async function cobertura (req, res, next){
  try {
      const request = req.body;
      
      const seguro_cod = request.seguro;
      const prestador = request.prest;
      const plan = request.plan;
      const especialidad = request.especialidad;
      const fecha_ingreso = request.fing;
      const adelanto_carencia = request.acaren;
      const fecha_visacion = request.fvis;
      const paciente = request.pac;
      // const habilitar_servicios = request.habilitar;
      // const flag_consultas = request.flag_1;
      // const flag_estudios = request.flag_2;
      // const flag_laboratorios = request.flag_3;
      // const flag_imagenes = request.flag_4;
      // const flag_sanatoriales = request.flag_5;
      // const flag_procedimientos = request.flag_6;

      //Calcular dias transcurridos entre ingreso y visación
      const _MS_POR_DIA = 1000 * 60 * 60 * 24; //1 día en milisegundos
      const f_contrato = new Date(fecha_ingreso);
      const f_visacion = new Date(fecha_visacion);
      const f_contrato_utc = Date.UTC(f_contrato.getFullYear(), f_contrato.getMonth(), f_contrato.getDate());
      const f_visacion_utc = Date.UTC(f_visacion.getFullYear(), f_visacion.getMonth(), f_visacion.getDate());
      const dias_transcurridos = Math.floor(((f_visacion_utc - f_contrato_utc) + adelanto_carencia) / _MS_POR_DIA);
      const inicio_visacion = new Date(f_visacion.getFullYear(), f_visacion.getMonth(), 1);

      let items = await controlador.getCobertura(seguro_cod, prestador, plan, especialidad, dias_transcurridos);
      
      // Estado-Color de fila
      for (i in items){
          let cantIlimitada = false;

          items[i].estado = 2; //0 gris, 1 azul, 2 verde, 3 rojo, 4 amarillo, 5 lila

          //const mes_ingreso = f_contrato.getMonth();
          //const mes_visacion = f_visacion.getMonth();
          items[i].inicio_rango = new Date(f_contrato.getFullYear(), f_contrato.getMonth(), 1);
          items[i].fin_rango = new Date(f_contrato.getFullYear(), f_contrato.getMonth() + items[i].renovacion-1, 1);
          

          if (items[i].habilitar === 0 || items[i].utilizar === 0) items[i].estado = 0; //Gris

          if (!/^\d*$/.test(items[i].cantdisp)){ //Si hay algún carácter que no es número, es decir, tiene letra(s), es decir, es "ILIMITADO"
              cantIlimitada = true;
          }

          if (items[i].carencia > dias_transcurridos){
              items[i].estado = 4; //Amarillo
          }

          if (items[i].cantdisp < 1 && cantIlimitada === false){
              items[i].estado = 3; //Rojo
          }

          if (items[i].renovacion > 0){
              while (items[i].fin_rango < inicio_visacion){
                  items[i].inicio_rango.setMonth(items[i].inicio_rango.getMonth() + items[i].renovacion)
                  items[i].fin_rango.setMonth(items[i].fin_rango.getMonth() + items[i].renovacion)
              }
          }

          const titularBuscar = await controlador.getTitular(paciente); //Si el paciente es el titular, va a traer lo mismo
          let titular = 0;
          if (titularBuscar.length[0]){
              titular = titularBuscar[0].tit;
          }else{
              titular = paciente;
          }
          let pacientes_str = "0," + titular; //Titular agregamos una sola vez
          const pacientes = await controlador.getAdherentes(titular); //Trae adherentes
          if (pacientes.length > 0){
              for (p in pacientes){
                  pacientes_str += "," + pacientes[p].adhe;
              }
          }

          const visaciones_realizadas = await controlador.visacionesRealizadas(items[i].codigo, items[i].tiposer, pacientes_str);
          let suma_cantidad = 0;
          let dias_utilizados = 0;
          if (visaciones_realizadas.length > 0){
              for (vr in visaciones_realizadas){
                  const fecha_servicio = new Date (visaciones_realizadas[vr].fecha);
                  if ((fecha_servicio >= items[i].inicio_rango) && (fecha_servicio <= items[i].fin_rango)){
                      suma_cantidad += visaciones_realizadas[vr].cantidad;
                      dias_utilizados += visaciones_realizadas[vr].diasUtilizados;
                  }
              }
          }

          items[i].cantidadUtilizada = suma_cantidad;
          if (!cantIlimitada){
              items[i].cantdisp = parseInt(items[i].cantdisp) - suma_cantidad;
          }
          items[i].diasutilizados = dias_utilizados;
          items[i].diasdisp -= items[i].diasutilizados;

          if ((suma_cantidad >= items[i].cantdisp) && (!cantIlimitada)){
              items[i].estado = 3; //Rojo
          }

          if (items[i].diasutilizados > 0){
              if (items[i].diasdisp == 0){
                  items[i].estado = 5; //Lila
              }
          }
      }
      
      const soloVerdes = items.filter(item => item.estado === 2);
      items = soloVerdes;
      
      respuesta.success(req, res, items, 200);
  } catch (err) {
      next(err);
  }
}

async function procedimientos (req, res, next){
  try {
      const items = await controlador.getProcedimientos();

      respuesta.success(req, res, items, 200); 
  } catch (err) {
      next(err);
  }
}

module.exports = router;