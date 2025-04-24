const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')

const { networkInterfaces } = require('os');
const nets = networkInterfaces();

router.post('/',seguridad(), agregar)
/*Acciones: 1-
            2-
            3- Eliminar
            4-
*/

async function agregar (req, res, next){
  try {
      const datos = req.body;
      let ip = '';
      for (const name of Object.keys(nets)) { //networkInterfaces devuelve varios objetos, revisamos cada uno
        for (const net of nets[name]) {
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4 //Solo nos importa el IPv4
            if (net.family === familyV4Value && !net.internal) { //Filtramos que no nos muestre el IP interno, 127.0.0.1 etc.
                ip = net.address;
            }
        }
      }
      datos.usuario += '@' + ip;

      await controlador.agregar(datos);
      let message = '';
      if(req.body.id == 0)
      {
          message = 'Guardado con éxito';
      }else{
          message = 'Item no guardado';
      }
      respuesta.success(req, res, message, 201);
  } catch (error) {
      next(error);
  }
}


module.exports = router;