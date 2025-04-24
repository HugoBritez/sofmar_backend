const db = require('../../DB/mysql');
const ctrl = require('../disponibilidades/controlador');

module.exports = ctrl(db);