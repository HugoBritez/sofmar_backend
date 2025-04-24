const jwt = require('jsonwebtoken')
const config = require('../config')
const secret = config.jwt.secret
const error = require('../middleware/errors')


function asignarToken(data){
    return jwt.sign(data[0].op_nombre, secret)
    
}

function verificarToken(token){
    return jwt.verify(token, secret)
}

const chequearToquen = {
    confirmarToken: function(req){
        decodificarCabecera(req);
    }
}

function decodificarCabecera(req){
    const autorizacion = req.headers.authorization || '';
    const token = obtenerToken(autorizacion);
    const decodificado = verificarToken(token);
    /*req.user = decodificado;*/
    return decodificado
}

function obtenerToken(autorizacion){
    if(!autorizacion){
        throw error('No se mando correctamente el token',401)
    }

    if(autorizacion.indexOf('Bearer') === -1){
        throw error('Formato Inválido',401)
    }

    let token = autorizacion.replace('Bearer ','');
    return token;
}



module.exports = {
    asignarToken, chequearToquen
}