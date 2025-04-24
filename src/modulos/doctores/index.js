const db = require('../../DB/mysql');
const ctrl = require('../doctores/controlador');

module.exports = ctrl(db);