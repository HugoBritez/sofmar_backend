const TABLA = 'especialidad';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(){
        const query = `SELECT * FROM ${TABLA} WHERE esp_estado = 1`;
        return db.sql(query);
    }

    return{
        todos
    } 
}