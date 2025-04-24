const db = require('../../DB/mysql');
const ctrl = require('../disponibilidades_doctores_horarios/controlador');

module.exports = ctrl(db);