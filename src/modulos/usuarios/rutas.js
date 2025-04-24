const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')

router.post('/login', login)
router.get('/',seguridad(), todos)
router.get("/vendedores", seguridad(), vendedores);
router.get('/:id',seguridad(), uno)
router.post('/',seguridad(), agregar)
router.put('/:id',seguridad(), eliminar)
router.get('/verificar/:user', verificarUsuario)


async function vendedores(req, res, next){
    try {
        const vendedores = await controlador.vendedores(req.query.buscar , req.query.id_vendedor);
        respuesta.success(req, res, vendedores, 200);

    } catch (err) {
        next(err);
    }
}

async function verificarUsuario(req, res, next){
    try {
        const items = await controlador.verificarUsuario(req.params.user);
        respuesta.success(req, res, items,200); 
    } catch (err) {
        next(err);
    }
}


async function login(req, res, next){
    try {
        const data = await controlador.login(req.body.user, req.body.pass);
        const token = auth.asignarToken({ ...data});
        const datos = {usuario: data, token: token };
        respuesta.success(req, res, datos, 200); 
    } catch (err) {
        /*respuesta.error(req, res, err, 500)*/
        next(err);
    }
}

async function todos (req, res, next){
    try {
        const busqueda = req.query.buscar;
        const items = await controlador.todos(busqueda);
        respuesta.success(req, res, items,200); 
    } catch (err) {
        next(err);
    }

}

async function uno (req, res, next){
    try {
        const items = await controlador.uno(req.params.id);
        respuesta.success(req, res, items,200); 
    } catch (err) {
        /*respuesta.error(req, res, err, 500)*/
        next(err);
    }
}

async function agregar (req, res, next){
    try {
        await controlador.agregar(req.body);
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

async function eliminar (req, res, next){
    try {
        await controlador.eliminar(req.params.id);
        respuesta.success(req, res, 'Item eliminado satisfactoriamente!',200); 
    } catch (err) {
        next(err);
    }
}

module.exports = router;