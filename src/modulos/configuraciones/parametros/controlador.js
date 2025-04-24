const TABLA = 'configuraciones';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../../DB/mysql.js');
    }

    function getConfiguraciones(){
        return db.sql(`SELECT *, Date_Format(curdate(), '%d-%m-%Y') AS fecha, CURTIME() AS hora FROM configuraciones`);
    }

    return{
        getConfiguraciones
    } 
}