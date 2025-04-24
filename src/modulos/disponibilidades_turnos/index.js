const db = require('../../DB/mysql');
const ctrl = require('../disponibilidades_doctores/controlador');

module.exports = ctrl(db);