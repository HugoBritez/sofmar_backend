const CONF_HOSPITALARIAS = 'sconf_hospitalarias';

/*const auth = require('../../auth/index');*/

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function get_conf_hospitalarias(codigos){
        let query = `SELECT * FROM ${CONF_HOSPITALARIAS} WHERE ch_estado = 1 `;
        
        if (codigos){ //Agregamos si pasamos códigos
            query += ` AND ch_codigo IN (${codigos})`;
        }

        return db.sql(query);
    }

    return{
        get_conf_hospitalarias
    } 
}