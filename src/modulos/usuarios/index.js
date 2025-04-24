const db = require('../../DB/mysql');
const ctrl = require('../usuarios/controlador');

module.exports = ctrl(db);