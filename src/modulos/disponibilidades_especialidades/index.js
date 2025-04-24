const db = require('../../DB/mysql');
const ctrl = require('../disponibilidades_especialidades/controlador');

module.exports = ctrl(db);