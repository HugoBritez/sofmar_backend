const db = require('../../DB/mysql');
const ctrl = require('../depositos/controlador');

module.exports = ctrl(db);