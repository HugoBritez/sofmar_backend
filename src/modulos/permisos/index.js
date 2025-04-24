const db = require('../../DB/mysql');
const ctrl = require('../permisos/controlador');

module.exports = ctrl(db);