const db = require('../../DB/mysql');
const ctrl = require('../boxes/controlador');

module.exports = ctrl(db);