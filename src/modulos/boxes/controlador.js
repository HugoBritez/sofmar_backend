const TABLA = 'boxes';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(string_busqueda, filt_suc){
        let query = `SELECT b.box_codigo, b.box_descripcion, b.box_estado, b.box_sucursal, b.box_tpo_atiende, box_etapa_atiende, b.box_usuario,
                        u.op_nombre, u.op_sucursal, s.descripcion FROM boxes b
                        LEFT JOIN operadores u ON b.box_usuario = u.op_codigo
                        LEFT JOIN sucursales s ON b.box_sucursal = s.id
                        WHERE (b.box_descripcion LIKE '%${string_busqueda}%' OR u.op_nombre LIKE '%${string_busqueda}%') 
                        AND b.box_est_reg = 1 `;

        if (filt_suc > 0){
            query += `AND b.box_sucursal = ${filt_suc} `;
        }

        return db.sql(query);
    }

    function agregar(datos){
        const primary_key_value = datos.box_codigo;
        const primary_key_name = "box_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `box_codigo = ${id} `;
        const campos = "box_codigo, box_descripcion, box_estado, box_usuario, box_sucursal, box_tpo_atiende, box_etapa_atiende "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "box_codigo = " + id;
        const set_campo = " box_est_reg = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    function abrircerrar(id, estado, user){
        let usuario = 0;
        let query = "";

        if (id === 0){ //Cerrar todos los boxes de este usuario
            query = `UPDATE boxes SET box_estado = ${estado}, box_usuario = ${usuario} WHERE box_usuario = ${user} `;
        }else{ //Abrir o cerrar el box específico
            if (estado === 1){ //Si está haciendo apertura, guardamos su user, sino, vaciamos porque es un cierre
                usuario = user;
            }

            query = `UPDATE boxes SET box_estado = ${estado}, box_usuario = ${usuario} WHERE box_codigo = ${id}`
        }
        
        return db.sql(query);
    }

    function getBoxByUser(user){
        const query = `SELECT * FROM boxes WHERE box_usuario = ${user}`
        return db.sql(query);
    }

    return{
        todos, agregar, uno, eliminar, abrircerrar, getBoxByUser
    } 
}