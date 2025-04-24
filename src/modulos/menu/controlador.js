const TABLA = 'acceso_menu_operador a LEFT JOIN menu_sistemas m ON a.a_menu = m.m_codigo';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(user, grupo, orden){
        let campos = "";
        let where = "";
        let tabla = "";

        if (user > 0){
            tabla = 'acceso_menu_operador a LEFT JOIN menu_sistemas m ON a.a_menu = m.m_codigo';
            campos = "m.m_orden, m.m_grupo, m.m_descripcion, a.a_agregar, a.a_modificar, a.a_eliminar"
            where = ` a.a_operador = ${user} AND a.a_acceso = 1 AND a.a_estado = 1 AND m.m_estado = 1 `;
        }else{
            tabla = 'menu_sistemas m';
            campos = "m.m_orden, m.m_grupo, m.m_descripcion"
            where = ` m.m_estado = 1 `;
        }

        if (grupo > 0){
            where += ` AND m.m_grupo in (${grupo}) `;
        }

        if (orden > 0){
            where += ` AND m.m_orden in (${orden}) `;
        }

        where += ` ORDER BY m.m_orden ASC `;

        return db.todos(tabla, campos, where);
    }

    function rol(usuario){
        return db.sql(`SELECT o.op_autorizar, r.or_rol FROM operadores o INNER JOIN operador_roles r ON r.or_operador = o.op_codigo WHERE o.op_codigo = ${usuario}`);
    }

    return{
        todos, rol
    } 
}