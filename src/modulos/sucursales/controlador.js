const TABLA = `sucursales su`;
const TABLA_USER = `sucursales su INNER JOIN operadores ope ON ope.op_sucursal = su.id`;

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(){
        const campos = "id, descripcion, direccion,tel, nombre_emp "
        const where = ` estado = 1 `
        return db.todos(TABLA, campos, where);
    }

    function todosConCiudad(){
      const query = `SELECT s.id, s.descripcion, c.ciu_codigo, c.ciu_descripcion FROM sucursales s
      INNER JOIN sucursal_ciudad sc ON s.id = sc.sucursal
      INNER JOIN ciudades c ON sc.ciudad = c.ciu_codigo`;
      return db.sql(query);
    }


    function todos_user(operador){
      const campos = "id, descripcion"
      const where = ` estado = 1 and ope.op_codigo = ${operador}`
      return db.todos(TABLA_USER, campos, where);
    }

    function ciudad(sucursal){
      const query = `SELECT s.id, s.descripcion, c.ciu_codigo, c.ciu_descripcion FROM sucursales s
      INNER JOIN sucursal_ciudad sc ON s.id = sc.sucursal
      INNER JOIN ciudades c ON sc.ciudad = c.ciu_codigo`;
      return db.sql(query);
    }

    function sucursalData(matriz){
      let where = '';

      if(matriz){
        where = `WHERE matriz = 1`
      } else {
        where = ``
      }

      const query = `
        SELECT
          id,
          descripcion,
          direccion,
          nombre_emp,
          ruc_emp,
          matriz
          FROM sucursales
          ${where}
      `

      return db.sql(query);
    }

    return{
        todos, todos_user, ciudad, todosConCiudad, sucursalData
    } 
}