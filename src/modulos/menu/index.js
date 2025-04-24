const db = require('../../DB/mysql');
const ctrl = require('../menu/controlador');

module.exports = ctrl(db);