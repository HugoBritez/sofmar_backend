const auth = require('../auth')

module.exports = function chequearAuth(){

    function middleware(req, res, next){
        auth.chequearToquen.confirmarToken(req)
        next()
    }
    return middleware
}