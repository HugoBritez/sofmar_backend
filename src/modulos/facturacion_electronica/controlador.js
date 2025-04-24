const TABLA = "configuraciones";

module.exports = function (dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require("../../DB/mysql.js");
  }

  function getParametrosFE() {
    const query = `
          SELECT
            c.c_codigo,
            c.c_desc_nombre,
            c.c_desc_fantasia,
            c.c_ruc,
            c.c_direccion,
            c.c_telefono,
            c.c_ciudad,
            c.c_sucursal,
            c.c_correo,
            c.c_descr_establecimiento,
            c.c_dato_establecimiento,
            c.c_dato2_establecimiento,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'api_key', f.c_apikey,
                'api_url_crear', f.c_url,
                'api_url_cancelar', f.c_url_cancelar,
                'api_url_inutilizar', f.c_url_inutilizar,
                'report', f.c_report
              )
            ) AS parametros
        FROM config_factura_electronica c
        INNER JOIN config_sistema_factura_electronica f
        WHERE c.c_estado = 1
        GROUP BY c.c_codigo
        ORDER BY c.c_codigo
        LIMIT 1
        `;

    return db.sql(query);
  }

  async function consultarConfiguracionFE(sucursal_id){
    const query = `
       SELECT 1 FROM config_recibo_electronica WHERE c_sucursal = ${sucursal_id} AND c_estado = 1
    `;
    console.log(query);
    return db.sql(query)
  }



  return {
    getParametrosFE, 
    consultarConfiguracionFE
  };
};
