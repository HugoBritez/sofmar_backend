

const TABLA = 'operadores';

/*const auth = require('../../auth/index');*/

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    async function login(user, pass){
        const data = await db.login(TABLA, user, pass);
        return  data;
    }

    async function vendedores(busqueda, id_vendedor){
        let where = "op_estado = 1";
        if(busqueda && busqueda.trim() !== '' && busqueda.length > 2){
            where += ` AND (op_nombre LIKE '%${busqueda}%' OR op_documento LIKE '%${busqueda}%')`;
        }
        if(id_vendedor){
            where += ` AND op_codigo = ${id_vendedor}`;
        }
        const query = `
        SELECT 
        op.op_codigo, 
        op.op_nombre, 
        op.op_documento,
        rol.rol_descripcion as op_rol
        FROM operadores op
        INNER JOIN operador_roles oprol ON op.op_codigo = oprol.or_operador
        INNER JOIN roles rol ON oprol.or_rol = rol.rol_codigo
        WHERE ${where} LIMIT 5`;
        console.log(query)
        return await db.sql(query);
    }

    function todos(busqueda){
        let where = "op_estado = 1";
        if(busqueda && busqueda.trim() !== '' && busqueda.length > 2){
            where += ` AND (op_nombre LIKE '%${busqueda}%' OR op_documento LIKE '%${busqueda}%')`;
        }
        const query = `SELECT * FROM operadores WHERE ${where}`;
        return db.sql(query);
    }
    
    function uno(id){
      const primary_key = `op_codigo = ${id} `;
      const campos = " * "
      return db.uno(TABLA, primary_key, campos);
    }

    function agregar(id){
        return db.agregar(TABLA, id);
    }
    
    function eliminar(body){
        return db.eliminar(TABLA, body);
    }

    return{
        login,
        todos,
        uno,
        agregar,
        eliminar,
        vendedores
    }
}