const db = require('../../DB/mysql');
const ctrl = require('../pacientes/controlador');

module.exports = ctrl(db);