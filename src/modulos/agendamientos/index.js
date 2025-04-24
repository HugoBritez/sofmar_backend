const db = require('../../DB/mysql');
const ctrl = require('../agendamientos/controlador');

module.exports = ctrl(db);