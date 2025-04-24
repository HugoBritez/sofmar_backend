const db = require('../../DB/mysql');
const ctrl = require('../articulos/controlador');

module.exports = ctrl(db);