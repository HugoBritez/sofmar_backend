const mysql = require("mysql2");
const config = require("../config.js");
const dbConfig = {
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  connectionLimit: config.mysql.connectionLimit,
};

let conexion;

function conMysql() {
  conexion = mysql.createPool(dbConfig);

  conexion.getConnection(function (err, connection) {
    if (err) throw err; // not connected!
    // Se utiliza la conexión
    connection.query(
      'SELECT "DB INICIADA..." ',
      function (error, results, fields) {
        // La conexión no se cierra, siemplemente se libera para que se pueda usar por otro proceso
        connection.release();
        if (error) throw error;
        // Si hay algún error en este punto el recurso ya se encuentra de nuevo disponible en el pool.
        console.log("DB CONECTADA!");
      }
    );
  });
}

conMysql();

function todos(tabla, campos, where) {
  /*console.log(`SELECT ${campos} FROM ${tabla} WHERE ${where}  `);*/
  return new Promise((resolve, reject) => {
    conexion.query(
      `SELECT ${campos} FROM ${tabla} WHERE ${where}  `,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    console.log(`SELECT ${campos} FROM ${tabla} WHERE ${where}  `);
  });
}

function uno(tabla, primary_key, campos) {
  return new Promise((resolve, reject) => {
    conexion.query(
      `SELECT ${campos} FROM ${tabla} WHERE ${primary_key} `,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
}

function agregar(tabla, data, primary_key_value, primary_key_name) {
  if (primary_key_value === 0) {
    return insertar(tabla, data);
  } else {
    return actualizar(tabla, data, primary_key_value, primary_key_name);
  }
}

function insertar(tabla, data) {
  return new Promise((resolve, reject) => {
    conexion.query(
      `INSERT INTO ${tabla} SET ?`,
      data,
      (error, result, filed) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
}

function actualizar(tabla, data, primary_key_value, primary_key_name) {
  return new Promise((resolve, reject) => {
    conexion.query(
      `UPDATE ${tabla} SET ? WHERE ${primary_key_name} = ${primary_key_value} `,
      [data],
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
}

function eliminar(tabla, where_update, set_campo) {
  return new Promise((resolve, reject) => {
    conexion.query(
      ` UPDATE ${tabla} SET ${set_campo} WHERE ${where_update} `,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
}

async function login(tabla, user, pass) {
  const conexionPrueba = mysql.createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: user,
    password: pass,
    database: config.mysql.database,
    connectionLimit: config.mysql.connectionLimit,
  });

  return new Promise((resolve, reject) => {
    const query = `SELECT 
    operadores.*,
    orol.or_rol,
    (SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'menu_id', a.a_menu,
        'menu_grupo', ms.m_grupo,
        'menu_orden', ms.m_orden,
        'menu_descripcion', ms.m_descripcion, 
        'acceso', a.a_acceso
      )
    ) FROM acceso_menu_operador a
    INNER JOIN menu_sistemas ms ON a.a_menu = ms.m_codigo 
    WHERE a.a_operador = operadores.op_codigo) AS permisos_menu
    FROM ?? 
    LEFT JOIN operador_roles orol ON operadores.op_codigo = orol.or_operador
    WHERE operadores.op_usuario = ?`;
    const values = [tabla, user];

    console.log(query, values);

    conexionPrueba.query(query, values, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

function sql(string_sql) {
  return new Promise((resolve, reject) => {
    conexion.query(` ${string_sql} `, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

module.exports = {
  todos,
  uno,
  eliminar,
  agregar,
  login,
  sql,
  actualizar,
};
