const TABLA = 'menu_operadores mo';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(user, orden){
        let campos = "";
        let where = "";
        campos = ` ifnull((SELECT oa.o_permiso FROM operador_acceso_permiso oa WHERE oa.o_operador = ${user} and oa.o_acceso = mo.m_codigo), mo.m_acceso) as acceso `
        where = ` mo.m_orden =  ${orden}`;
        const permiso = db.todos(TABLA, campos, where);
        return permiso;
    }


    function traerPermisosDeAcceso (user){
        where = `where amo.a_operador = ${user}`
        campos= `
            select amo.a_codigo, amo.a_operador, m.m_codigo, amo.a_acceso, amo.a_agregar, amo.a_modificar, amo.a_eliminar from acceso_menu_operador amo
            inner join menu_sistemas m on m.m_codigo = amo.a_menu
            ${where}
        `
        return db.sql(campos);
    }

    function permitirAcceso (userId, menuId){
        const query = `SELECT amo.a_operador, m.m_codigo, amo.a_acceso, amo.a_agregar, amo.a_modificar, amo.a_eliminar 
            FROM acceso_menu_operador amo
            INNER JOIN menu_sistemas m on m.m_codigo = amo.a_menu
            WHERE amo.a_operador = ${userId} and m.m_codigo = ${menuId}`;

        return db.sql(query);
    }

    return{
        todos, traerPermisosDeAcceso, permitirAcceso
    } 
}