const CABECERA = 'atencion_vendedores';
const DETALLES = 'detalle_atencion_vendedores';

module.exports = function(dbInyectada) {
    let db = dbInyectada;

    if(!db){
        db = require('../../../DB/mysql.js');
    }

    async function cabeceraFecha(fecha){
        //let query = `SELECT * FROM ${CABECERA} WHERE av_fecha = Date_Format('${fecha}', '%Y-%m-%d') `
        let query = `SELECT * FROM ${CABECERA} WHERE av_fecha = '${fecha}' `
        let result = await db.sql(query);
        let av_codigo = 0;
        let nuevo = true;
        let query2 = "";

        if (result.length > 0){ //Ya existe registro
            av_codigo = result[0].av_codigo;
            nuevo = false;
        }else{
            query2 = {av_fecha:fecha, av_estado: 1};
            result = await db.agregar(CABECERA, query2, 0, 'av_codigo');
            av_codigo = result.insertId;
            nuevo = true;
        }        

        return {av_codigo: av_codigo, nuevo: nuevo};
    }

    function agregarDetalle(datos){
        const primary_key_value = datos.dav_codigo;
        const primary_key_name = "dav_codigo";
        return db.agregar(DETALLES, datos, primary_key_value, primary_key_name);
    }

    function getDetalles(id){
        let query = `SELECT * FROM ${DETALLES} WHERE dav_atencion = ${id} ORDER BY dav_orden ASC`
        return db.sql(query);
    }
    
    function verifRol(usuario, rol){
        let query = `SELECT * FROM operador_roles WHERE or_rol = ${rol} AND or_operador = ${usuario} ` //Rol 7 es Administrador
        return db.sql(query);
    }

    function vendedores(id, suc){
        let query = "";

        if (id > 0){
            query = `SELECT op_nombre, op_estado FROM operadores o WHERE op_codigo = ${id}  `
        }else{
            query = `SELECT o.op_codigo as dav_vendedor, o.op_nombre FROM operadores o LEFT JOIN operador_roles r
                    ON o.op_codigo = r.or_operador WHERE r.or_rol = 5 AND o.op_estado = 1
                    AND o.op_sucursal IN (${suc})` //Rol 5 es Vendedor
        }
        
        return db.sql(query);
    }

    return{
        cabeceraFecha, verifRol, getDetalles, vendedores, agregarDetalle
    }
}