const TABLA = 'ventas_bonos';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(){
        const campos = " * "
        const where = ` b_monto > 0`
        return db.todos(TABLA, campos, where);
    }

    function agregar(datos){
        return db.sql(`INSERT INTO ${TABLA} (b_venta, b_monto) VALUES (${datos[0].b_venta}, ${datos[0].b_monto})`)
        // const primary_key_value = datos.b_venta;
        // const primary_key_name = "b_venta";
        // return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `b_venta = ${id} `;
        const campos = " * "
        return db.uno(TABLA, primary_key, campos);
    }

    return{
        todos, agregar, uno
    } 
}