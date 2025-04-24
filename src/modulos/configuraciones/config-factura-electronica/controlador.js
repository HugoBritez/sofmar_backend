const TABLA = 'config_factura_electronica';

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../../DB/mysql.js');
    }

    function getDatosFactElect(sucursal=0, operador){
      let query = `
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
        d.ciu_descripcion,
        ds.d_descripcion,
        s.descripcion,
        t.dep_descripcion,
        cs.c_apikey,
        cs.c_url,
        cs.c_url_cancelar,
        cs.c_report,
        cs.c_cant_reg
      FROM
        config_factura_electronica c
        INNER JOIN config_sistema_factura_electronica cs ON c.c_codigo = cs.c_config
        INNER JOIN ciudades d ON c.c_ciudad = d.ciu_codigo
        INNER JOIN sucursales s ON c.c_sucursal = s.id
        INNER JOIN operadores o ON o.op_sucursal = s.id
        INNER JOIN distritos ds ON d.ciu_distrito = ds.d_codigo
        INNER JOIN departamentos t ON ds.d_departamento = t.dep_codigo`
      if (sucursal > 0){
        query += ` WHERE c.c_sucursal = ${sucursal}`
      }else{
        query += ` WHERE o.op_codigo = ${operador}`
      }

      return db.sql(query);
    }


    async function usaFacturaElectronica(sucursal_id){
      const query = `
        SELECT EXISTS(SELECT 1 FROM config_recibo_electronica WHERE c_sucursal = ${sucursal_id} AND c_estado = 1)
      `;
      console.log(query);
      return db.sql(query);
    }

    return{
      getDatosFactElect,
      usaFacturaElectronica
    } 
}