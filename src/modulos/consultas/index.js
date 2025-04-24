const db = require('../../DB/mysql');
const ctrl = require('../consultas/controlador');

module.exports = ctrl(db);