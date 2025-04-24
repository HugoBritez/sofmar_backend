const CABECERA = 'detalle_cuota_seguro';

module.exports = function(dbInyectada) {
    let db = dbInyectada;

    if(!db){
        db = require('../../../DB/mysql.js');
    }

    function verifPago(beneficiario){
        let query =
        `SELECT
            dcs.dcs_cantidad AS cantidad,
            dcs.dcs_vencimiento AS vence,
            dcs.dcs_monto AS importe,
            dcs.dcs_saldo AS saldo,
            dcs.dcs_concepto AS concepto,
            dcs.dcs_codigo AS codigo
        FROM
            detalle_cuota_seguro dcs
            INNER JOIN beneficiarios b ON dcs.dcs_beneficiario = b.b_codigo
        WHERE
            dcs.dcs_beneficiario = ${beneficiario}
            AND dcs.dcs_finalizado = 0 
            AND dcs.dcs_saldo > 0 
        ORDER BY dcs.dcs_vencimiento ASC`;
        return db.sql(query);
    }

    return{
        verifPago
    }
}