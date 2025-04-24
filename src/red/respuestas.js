exports.success = function(req, res, mensaje, status){
    const statusCode = status  || 200;
    const mensageOk = mensaje  || '';

    res.status(statusCode).send({
        error: false,
        status: statusCode,
        body: mensageOk
    })
}

exports.error = function(req, res, mensaje, status){

    const statusCode = status  || 500;
    const mensageError = mensaje  || 'Error desconocido';

    res.status(statusCode).send({
        error: true,
        status: statusCode,
        body: mensageError
    })
}