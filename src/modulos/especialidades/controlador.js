const TABLA = 'especialidades';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(){
        const query = `SELECT * FROM ${TABLA}`;
        return db.sql(query);
    }

    return{
        todos
    } 
}