const CABECERA = 'beneficiarios b LEFT JOIN pacientes p ON b.b_titular = p.pac_codigo';
const ADHERENTES = 'beneficiarios_adherentes ba LEFT JOIN pacientes p ON ba.ba_adherente = p.pac_codigo';

module.exports = function(dbInyectada) {
    let db = dbInyectada;

    if(!db){
        db = require('../../../DB/mysql.js');
    }

    function getBeneficiario(string_busqueda){
        let query =
        `SELECT
            be.b_codigo AS cod,
            Concat(pac.pac_nombres, ' ', pac.pac_apellidos) AS nom,
            pac.pac_documento AS doc,
            be.b_carnet AS carnet,
            psc.psc_codigo AS plancod,
            pla.pla_descripcion AS plandes,
            cat.sc_descripcion AS cat,
            CAST('Titular' as char) AS tipo,
            Date_Format(be.b_fecha_ingreso, '%Y-%m-%d') AS fingreso,
            pac.pac_codigo AS paccod,
            1 AS tipocod,
            be.b_codigo AS idBeneficiario,
            be.b_tiposeguro AS tipoasegurado,
            be.b_adelanto_carencia AS adelanto_carencia
        FROM
            beneficiarios be
            INNER JOIN pacientes pac ON be.b_titular = pac.pac_codigo
            INNER JOIN plan_seguro_cobertura psc ON be.b_plan = psc.psc_codigo
            INNER JOIN planes pla ON psc.psc_plan = pla.pla_codigo
            INNER JOIN seguro_categorias cat ON psc.psc_categoria = cat.sc_codigo
        WHERE
            be.b_estado = 1 AND (TRIM(pac.pac_documento) = REPLACE('${string_busqueda}', ' ', '') OR REPLACE(be.b_carnet, ' ', '') = REPLACE('${string_busqueda}', ' ', ''))`;
        return db.sql(query);
    }

    function getAdherente(string_busqueda){
        let query = 
        `SELECT
			ba.ba_codigo AS cod,
			Concat(pac.pac_nombres, ' ', pac.pac_apellidos) AS nom,
			Concat(ti.pac_nombres, ' ', ti.pac_apellidos) AS nomtit,
			pac.pac_documento AS doc,
			ba.ba_carnet AS carnet,
			psc.psc_codigo AS plancod,
            pla.pla_descripcion AS plandes,
            cat.sc_descripcion AS cat,
            CAST(if(ba.ba_tipo = 1, 'Beneficiario', 'Adherente') as char) AS tipo,
            Date_Format(ba.ba_fecha_ingreso, '%Y-%m-%d') AS fingreso,
            pac.pac_codigo AS paccod,
            ba.ba_tipo + 1 AS tipocod,
            b.b_codigo AS idBeneficiario,
            ba.ba_adelanto_carencia AS adelanto_carencia
        FROM
            beneficiarios_adherentes ba
            INNER JOIN beneficiarios b ON ba.ba_beneficiario = b.b_codigo
            INNER JOIN plan_seguro_cobertura psc ON b.b_plan = psc.psc_codigo
            INNER JOIN planes pla ON psc.psc_plan = pla.pla_codigo
            INNER JOIN seguro_categorias cat ON psc.psc_categoria = cat.sc_codigo
            INNER JOIN pacientes pac ON ba.ba_adherente = pac.pac_codigo
            INNER JOIN pacientes ti ON b.b_titular = ti.pac_codigo
        WHERE
            b.b_estado = 1 and (TRIM(pac.pac_documento) = REPLACE('${string_busqueda}', ' ', '') OR TRIM(REPLACE(ba.ba_carnet, ' ', '')) = REPLACE('${string_busqueda}', ' ', ''))`;
        return db.sql(query);
    }

    function verificarPreexistencia(paciente){
      const query = `SELECT
                      sdj.sdj_codigo,
                      sdj.sdj_descripcion,
                      dso.dsp_obse
                    FROM
                      declaracion_seguro_paciente dso
                      INNER JOIN seguro_declaracion_jurada sdj ON dso.dsp_declaracion = sdj.sdj_codigo
                    WHERE
                      dso.dsp_paciente = ${paciente}
                      AND sdj.sdj_estado = 1
                      AND dso.dsp_tuvo = 1
                    ORDER BY sdj_codigo`;
      return db.sql(query);
    }

    return{
        getBeneficiario, getAdherente, verificarPreexistencia
    }
}