const db = require('../../DB/mysql');
const ctrl = require('../sucursales/controlador');

module.exports = ctrl(db);