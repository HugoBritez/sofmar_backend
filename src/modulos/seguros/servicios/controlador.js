
module.exports = function(dbInyectada) {
    let db = dbInyectada;

    if(!db){
        db = require('../../../DB/mysql.js');
    }

    function getConsultas(habilitar_servicios, seguro_cod, prestador, responsable, marcados, plan, buscar, dias_dif){
        let query =
        `SELECT
            tc.tc_codigo AS codigo,
            tc.tc_descripcion AS descripcion,
            CAST(1 as decimal) AS cantidadvisar, 
            0 AS cantidadUtilizada,
            dcc.dcc_frecuencia AS cantdisp,
            dcc.dcc_carencia AS carencia,
            dcc.dcc_porcobertura AS cobertura,
            0 AS monto,
            0 AS monto_max,
            0 AS diasutilizados,
            0 AS diasdisp,
            0 AS medicamentos,
            0 AS medicamentos_max,
            0 AS cantdias,
            0 AS marcado,
            dcc.dcc_renovacion AS renovacion,
            1 AS tiposer,
            1 AS estadoCobertura,
            1 AS idAgrupacion,
            1 AS tipoTabla,
            dcc.dcc_frecuencia AS cantCobertura,
            0 AS diasCobertura,
            dcc.dcc_grupo AS grupo,
            IF( ${habilitar_servicios} = 1,
                IFNULL((SELECT IFNULL(sh.sh_habilitar,0) AS habilitar
                        FROM servicios_honorarios sh
                        WHERE sh.sh_estado = 1
                        AND sh.sh_seguro = ${seguro_cod}
                        AND sh.sh_servicio = tc.tc_codigo
                        AND sh.sh_tipo = 1
                        AND sh.sh_prestador = ${prestador}
                        AND (sh.sh_especialista = ${responsable} OR sh.sh_especialista = 0)
                        ORDER BY sh.sh_especialista DESC LIMIT 1),
                    0),
                1) AS habilitar,
            dcc.dcc_utilizar AS utilizar
        FROM
            detalle_cobertura_consulta dcc
            INNER JOIN tipo_consulta tc ON dcc.dcc_procedimiento = tc.tc_codigo
        WHERE
            dcc.dcc_cobertura = ${plan}
            AND (tc.tc_codigo NOT IN(${marcados})
            AND tc.tc_descripcion LIKE '%${buscar}%')`;
        return db.sql(query);
    }

    function getEstudios(habilitar_servicios, seguro_cod, prestador, responsable, marcados, plan, buscar, dias_dif){
        let query = 
        `SELECT
            pro.proc_codigo AS codigo,
            pro.proc_descripcion AS descripcion,
            CAST(1 as decimal) AS cantidadvisar,
            0 AS cantidadUtilizada,
            dcac.dca_frecuencia AS cantdisp,
            dcac.dca_carencia AS carencia,
            dcac.dca_porcobertura AS cobertura,
            0 AS monto,
            0 AS monto_max,
            0 AS diasutilizados,
            0 AS diasdisp,
            0 AS medicamentos,
            0 AS medicamentos_max,
            0 AS cantdias,
            0 AS marcado,
            dcac.dca_renovacion AS renovacion,
            2 AS tiposer,
            1 AS estadoCobertura,
            pro.proc_agrupacion AS idAgrupacion,
            2 AS tipoTabla,
            dcac.dca_frecuencia AS cantCobertura,
            0 AS diasCobertura,
            dcac.dca_grupo AS grupo,
            
            IF( ${habilitar_servicios} = 1,
                IFNULL((SELECT IFNULL(sh.sh_habilitar,0) AS habilitar
                        FROM servicios_honorarios sh
                        WHERE sh.sh_estado = 1
                        AND sh.sh_seguro = ${seguro_cod}
                        AND sh.sh_servicio = pro.proc_codigo
                        AND sh.sh_tipo = 2
                        AND sh.sh_prestador = ${prestador}
                        AND (sh.sh_especialista = ${responsable} OR sh.sh_especialista = 0)
                        ORDER BY sh.sh_especialista DESC LIMIT 1),
                    0),
                1) AS habilitar,
            dcac.dca_utilizar AS utilizar
        FROM
            detalle_cobertura_analcompl dcac
            INNER JOIN procedimientos pro ON dcac.dca_procedimiento = pro.proc_codigo
        WHERE
            dcac.dca_cobertura = ${plan}
            AND (pro.proc_codigo NOT IN (${marcados})
            AND pro.proc_descripcion LIKE '%${buscar}%')`;
        return db.sql(query);
    }

    function getLaboratorios(habilitar_servicios, seguro_cod, prestador, responsable, marcados, plan, buscar, dias_dif){
        let query = 
        `SELECT
            pro.proc_codigo AS codigo,
            pro.proc_descripcion AS descripcion,
            CAST(1 as decimal) AS cantidadvisar,
            0 AS cantidadUtilizada,
            dcb.dcb_frecuencia AS cantdisp,
            dcb.dcb_carencia AS carencia,
            dcb.dcb_porcobertura AS cobertura,
            0 AS monto,
            0 AS monto_max,
            0 AS diasutilizados,
            0 AS diasdisp,
            0 AS medicamentos,
            0 AS medicamentos_max,
            0 AS cantdias,
            0 AS marcado,
            dcb.dcb_renovacion AS renovacion,
            3 AS tiposer,
            1 AS estadoCobertura,
            pro.proc_agrupacion AS idAgrupacion,
            2 AS tipoTabla,
            dcb.dcb_frecuencia AS cantCobertura,
            0 AS diasCobertura,
            dcb.dcb_grupo AS grupo,
            IF( ${habilitar_servicios} = 1,
                IFNULL((SELECT IFNULL(sh.sh_habilitar,0) AS habilitar
                        FROM servicios_honorarios sh
                        WHERE sh.sh_estado = 1
                        AND sh.sh_seguro = ${seguro_cod}
                        AND sh.sh_servicio = pro.proc_codigo
                        AND sh.sh_tipo = 2
                        AND sh.sh_prestador = ${prestador}
                        AND (sh.sh_especialista = ${responsable} OR sh.sh_especialista = 0)
                        ORDER BY sh.sh_especialista DESC LIMIT 1),
                    0),
                1) AS habilitar,
            dcb.dcb_utilizar AS utilizar
        FROM
            procedimientos pro
            INNER JOIN detalle_cobertura_analbact dcb ON dcb.dcb_procedimiento = pro.proc_codigo
        WHERE
            dcb.dcb_cobertura = ${plan}
            AND (pro.proc_codigo NOT IN (${marcados})
            AND pro.proc_descripcion LIKE '%${buscar}%')`;
        return db.sql(query);
    }

    function getImagenes(habilitar_servicios, seguro_cod, prestador, responsable, marcados, plan, buscar, dias_dif){
        let query = 
        `SELECT
            pro.proc_codigo AS codigo,
            pro.proc_descripcion AS descripcion,
            CAST(1 as decimal) AS cantidadvisar,
            0 AS cantidadUtilizada,
            dcd.dcd_frecuencia AS cantdisp,
            dcd.dcd_carencia AS carencia,
            dcd.dcd_porcobertura AS cobertura,
            0 AS monto,
            0 AS monto_max,
            0 AS diasutilizados,
            0 AS diasdisp,
            0 AS medicamentos,
            0 AS medicamentos_max,
            0 AS cantdias,
            0 AS marcado,
            dcd.dcd_renovacion AS renovacion,
            4 AS tiposer,
            1 AS estadoCobertura,
            pro.proc_agrupacion AS idAgrupacion,
            2 AS tipoTabla,
            dcd.dcd_frecuencia AS cantCobertura,
            0 AS diascobertura,
            dcd.dcd_grupo AS grupo,
            IF( ${habilitar_servicios} = 1,
                IFNULL((SELECT IFNULL(sh.sh_habilitar,0) AS habilitar
                        FROM servicios_honorarios sh
                        WHERE sh.sh_estado = 1
                        AND sh.sh_seguro = ${seguro_cod}
                        AND sh.sh_servicio = pro.proc_codigo
                        AND sh.sh_tipo = 2
                        AND sh.sh_prestador = ${prestador}
                        AND (sh.sh_especialista = ${responsable} OR sh.sh_especialista = 0)
                        ORDER BY sh.sh_especialista DESC LIMIT 1),
                    0),
                1) AS habilitar,
            dcd.dcd_utilizar AS utilizar
        FROM
            procedimientos pro
            INNER JOIN detalle_cobertura_diagnostico dcd ON dcd.dcd_procedimiento = pro.proc_codigo
        WHERE
            dcd.dcd_cobertura = ${plan}
            AND (pro.proc_codigo NOT IN (${marcados})
            AND pro.proc_descripcion LIKE '%${buscar}%')`;
        return db.sql(query);
    }

    function getSanatoriales(habilitar_servicios, seguro_cod, prestador, responsable, marcados, plan, buscar, dias_dif){
        let query = 
        `SELECT
            pro.proc_codigo AS codigo,
            pro.proc_descripcion AS descripcion,
            CAST(1 as decimal) AS cantidadvisar,
            0 AS cantidadUtilizada,
            dcs.dcs_frecuencia AS cantdisp,
            IF(CAST(dcs.dcs_carenciaprog as decimal) < 1, dcs.dcs_carencia, if(${dias_dif} > dcs.dcs_carencia, dcs.dcs_carenciaprog, dcs.dcs_carencia)) AS carencia,
            IF(CAST(dcs.dcs_carenciaprog as decimal) < 1, dcs.dcs_porcobertura, if(${dias_dif} > dcs.dcs_carencia, dcs.dcs_porcoberturados, dcs.dcs_porcobertura)) AS cobertura,
            dcs.dcs_montocobertura AS monto,
            dcs.dcs_montocobertura AS monto_max,
            0 AS diasutilizados,
            dcs.dcs_internacion AS diasdisp,
            dcs.dcs_insumos AS medicamentos,
            dcs.dcs_insumos AS medicamentos_max,
            0 as cantdias,
            0 AS marcado,
            dcs.dcs_renovacion AS renovacion,
            5 AS tiposer,
            1 AS estadoCobertura,
            pro.proc_agrupacion AS idAgrupacion,
            2 AS tipoTabla,
            dcs.dcs_frecuencia AS cantCobertura,
            dcs.dcs_internacion AS diascobertura,
            dcs.dcs_grupo AS grupo,
            IF( ${habilitar_servicios} = 1,
                IFNULL((SELECT IFNULL(sh.sh_habilitar,0) AS habilitar
                        FROM servicios_honorarios sh
                        WHERE sh.sh_estado = 1
                        AND sh.sh_seguro = ${seguro_cod}
                        AND sh.sh_servicio = pro.proc_codigo
                        AND sh.sh_tipo = 2
                        AND sh.sh_prestador = ${prestador}
                        AND (sh.sh_especialista = ${responsable} OR sh.sh_especialista = 0)
                        ORDER BY sh.sh_especialista DESC LIMIT 1),
                    0),
                1) AS habilitar,
            dcs.dcs_utilizar AS utilizar
        FROM
            procedimientos pro
            INNER JOIN detalle_cobertura_sanatorial dcs ON dcs.dcs_procedimiento = pro.proc_codigo
        WHERE
            dcs.dcs_cobertura = ${plan}
            AND (pro.proc_codigo NOT IN (${marcados})
            AND pro.proc_descripcion LIKE '%${buscar}%')`;
        return db.sql(query);
    }

    function getUrgencias(habilitar_servicios, seguro_cod, prestador, responsable, marcados, plan, buscar, dias_dif){
        let query = 
        `SELECT
            pro.proc_codigo AS codigo,
            pro.proc_descripcion AS descripcion,
            CAST(1 as decimal) AS cantidadvisar,
            0 AS cantidadUtilizada,
            dcu.dcu_frecuencia AS cantdisp,
            IF(CAST(dcu.dcu_careciados as decimal) < 1, dcu.dcu_carencia, if(${dias_dif} <= dcu.dcu_careciados, dcu.dcu_careciados, dcu.dcu_carencia)) AS carencia,
            IF(CAST(dcu.dcu_careciados as decimal) < 1, dcu.dcu_porcobertura,if(${dias_dif} <= dcu.dcu_careciados, dcu.dcu_porcoberturados, dcu.dcu_porcobertura)) AS cobertura,
            0 AS monto,
            0 AS monto_max,
            dcu.dcu_frecuencia AS diasutilizados,
            0 AS diasdisp,
            0 AS medicamentos,
            0 AS medicamentos_max,
            0 AS cantdias,
            0 AS marcado,
            dcu.dcu_renovacion AS renovacion,
            6 AS tiposer,
            1 AS estadoCobertura,
            pro.proc_agrupacion AS idAgrupacion,
            2 AS tipoTabla,

            0 AS diasCobertura,
            dcu.dcu_grupo AS grupo,
            IF( ${habilitar_servicios} = 1,
                IFNULL((SELECT IFNULL(sh.sh_habilitar,0) AS habilitar
                        FROM servicios_honorarios sh
                        WHERE sh.sh_estado = 1
                        AND sh.sh_seguro = ${seguro_cod}
                        AND sh.sh_servicio = pro.proc_codigo
                        AND sh.sh_tipo = 2
                        AND sh.sh_prestador = ${prestador}
                        AND (sh.sh_especialista = ${responsable} OR sh.sh_especialista = 0)
                        ORDER BY sh.sh_especialista DESC LIMIT 1),
                    0),
                1) AS habilitar,
            dcu.dcu_utilizar as utilizar
        FROM
            procedimientos pro
            INNER JOIN detalle_cobertura_urgencia dcu ON dcu.dcu_procedimiento = pro.proc_codigo
        WHERE
            dcu.dcu_cobertura = ${plan}
            AND (pro.proc_codigo NOT IN (${marcados})
            AND pro.proc_descripcion LIKE '%${buscar}%')`;
        return db.sql(query);
    }

    function getTitular(paciente){
        let query = 
        `SELECT
            b.b_titular as tit
        FROM
            beneficiarios b
            INNER JOIN beneficiarios_adherentes ba ON ba.ba_beneficiario = b.b_codigo
        WHERE
            b.b_estado = 1
            AND ba.ba_estado = 1
            AND (b.b_titular = ${paciente}) OR (ba.ba_adherente = ${paciente})
        GROUP BY ba.ba_codigo`;
        return db.sql(query);
    }

    function getAdherentes(pac_titular){
        let query = 
        `SELECT
            ba.ba_adherente as adhe,
            b.b_titular as tit
        FROM
            beneficiarios b
            LEFT JOIN beneficiarios_adherentes ba ON ba.ba_beneficiario = b.b_codigo
        WHERE
            b.b_estado = 1
            AND ba.ba_estado = 1
            AND (b.b_titular = ${pac_titular})
        GROUP BY ba.ba_codigo`;
        return db.sql(query);
    }

    function visacionesRealizadas(cod_servicio, tipo_servicio, pacientes){
        let query = 
        `SELECT
            svd.svd_cantidad AS cantidad,
            sv.sv_fecha AS fecha,
            svd.svd_diasinternacion AS diasUtilizados
        FROM
            seguro_visacion sv
            INNER JOIN seguro_visacion_detalle svd ON svd.svd_visacion = sv.sv_codigo
        WHERE
            sv.sv_estado = 1
            AND svd.svd_estado = 1
            AND svd.svd_tipo = ${cod_servicio}
            AND svd.svd_tipoServicio = ${tipo_servicio}
            AND sv.sv_paciente IN (${pacientes})
        GROUP BY
            svd.svd_codigo`
        return db.sql(query);
    }

    function getCobertura(seguro_cod, prestador, plan, especialidad, dias_dif){
      let query =
      `SELECT
        tc.tc_codigo AS codigo,
        1 AS tiposer,
        IFNULL(sh.sh_habilitar,0) AS habilitar,
        dcc.dcc_utilizar AS utilizar,
        dcc.dcc_frecuencia AS cantdisp,
        dcc.dcc_renovacion AS renovacion,
        dcc.dcc_carencia AS carencia,        
        0 AS cantidadUtilizada,
        0 AS diasutilizados,
        0 AS diasdisp
      FROM
        detalle_cobertura_consulta dcc
        INNER JOIN tipo_consulta tc ON dcc.dcc_procedimiento = tc.tc_codigo
        INNER JOIN servicios_honorarios sh ON sh.sh_servicio = tc.tc_codigo
        INNER JOIN procedimientos_especialidades_visacion pev ON pev_procedimiento = tc.tc_codigo
      WHERE
        dcc.dcc_cobertura = ${plan}
        AND tc.tc_estado = 1
        AND sh.sh_estado = 1
        AND sh.sh_tipo = 1    #Consultas
        AND sh.sh_seguro = ${seguro_cod}
        AND sh.sh_prestador = ${prestador}
        AND pev.pev_especialidad = ${especialidad}
        AND pev.pev_proc_tipo = 1
        
      UNION ALL
        
      SELECT
        pro.proc_codigo AS codigo,
        2 AS tiposer,
        IFNULL(sh.sh_habilitar,0) AS habilitar,
        dcac.dca_utilizar AS utilizar,
        dcac.dca_frecuencia AS cantdisp,
        dcac.dca_renovacion AS renovacion,
        dcac.dca_carencia AS carencia,        
        0 AS cantidadUtilizada,
        0 AS diasutilizados,
        0 AS diasdisp
      FROM
        detalle_cobertura_analcompl dcac
        INNER JOIN procedimientos pro ON dcac.dca_procedimiento = pro.proc_codigo
        INNER JOIN servicios_honorarios sh ON sh.sh_servicio = pro.proc_codigo
        INNER JOIN procedimientos_especialidades_visacion pev ON pev_procedimiento = pro.proc_codigo
      WHERE
        dcac.dca_cobertura = ${plan}
        AND pro.proc_estado = 1
        AND sh.sh_estado = 1
        AND sh.sh_tipo = 2    #Procedimientos
        AND sh.sh_seguro = ${seguro_cod}
        AND sh.sh_prestador = ${prestador}
        AND pev.pev_especialidad = ${especialidad}
        AND pev.pev_proc_tipo = 2

      UNION ALL
      
      SELECT
        pro.proc_codigo AS codigo,
        3 AS tiposer,
        IFNULL(sh.sh_habilitar,0) AS habilitar,
        dcb.dcb_utilizar AS utilizar,
        dcb.dcb_frecuencia AS cantdisp,
        dcb.dcb_renovacion AS renovacion,
        dcb.dcb_carencia AS carencia,
        0 AS cantidadUtilizada,
        0 AS diasutilizados,
        0 AS diasdisp
      FROM
        detalle_cobertura_analbact dcb
        INNER JOIN procedimientos pro ON dcb.dcb_procedimiento = pro.proc_codigo
        INNER JOIN servicios_honorarios sh ON sh.sh_servicio = pro.proc_codigo
        INNER JOIN procedimientos_especialidades_visacion pev ON pev_procedimiento = pro.proc_codigo
      WHERE
        dcb.dcb_cobertura = ${plan}
        AND pro.proc_estado = 1
        AND sh.sh_estado = 1
        AND sh.sh_tipo = 2    #Procedimientos
        AND sh.sh_seguro = ${seguro_cod}
        AND sh.sh_prestador = ${prestador}
        AND pev.pev_especialidad = ${especialidad}
        AND pev.pev_proc_tipo = 2
        
      UNION ALL
    
      SELECT
        pro.proc_codigo AS codigo,
        4 AS tiposer,
        IFNULL(sh.sh_habilitar,0) AS habilitar,
        dcd.dcd_utilizar AS utilizar,
        dcd.dcd_frecuencia AS cantdisp,
        dcd.dcd_renovacion AS renovacion,
        dcd.dcd_carencia AS carencia,
        0 AS cantidadUtilizada,
        0 AS diasutilizados,
        0 AS diasdisp
      FROM
        detalle_cobertura_diagnostico dcd
        INNER JOIN procedimientos pro ON dcd.dcd_procedimiento = pro.proc_codigo
        INNER JOIN servicios_honorarios sh ON sh.sh_servicio = pro.proc_codigo
        INNER JOIN procedimientos_especialidades_visacion pev ON pev_procedimiento = pro.proc_codigo
      WHERE
        dcd.dcd_cobertura = ${plan}
        AND pro.proc_estado = 1
        AND sh.sh_estado = 1
        AND sh.sh_tipo = 2    #Procedimientos
        AND sh.sh_seguro = ${seguro_cod}
        AND sh.sh_prestador = ${prestador}
        AND pev.pev_especialidad = ${especialidad}
        AND pev.pev_proc_tipo = 2
        
      UNION ALL
    
      SELECT
        pro.proc_codigo AS codigo,
        5 AS tiposer,
        IFNULL(sh.sh_habilitar,0) AS habilitar,
        dcs.dcs_utilizar AS utilizar,
        dcs.dcs_frecuencia AS cantdisp,
        dcs.dcs_renovacion AS renovacion,
        IF(CAST(dcs.dcs_carenciaprog as decimal) < 1, dcs.dcs_carencia, if(${dias_dif} > dcs.dcs_carencia, dcs.dcs_carenciaprog, dcs.dcs_carencia)) AS carencia,
        0 AS cantidadUtilizada,
        0 AS diasutilizados,
        dcs.dcs_internacion AS diasdisp
      FROM
        detalle_cobertura_sanatorial dcs
        INNER JOIN procedimientos pro ON dcs.dcs_procedimiento = pro.proc_codigo
        INNER JOIN servicios_honorarios sh ON sh.sh_servicio = pro.proc_codigo
        INNER JOIN procedimientos_especialidades_visacion pev ON pev_procedimiento = pro.proc_codigo
      WHERE
        dcs.dcs_cobertura = ${plan}
        AND pro.proc_estado = 1
        AND sh.sh_estado = 1
        AND sh.sh_tipo = 2    #Procedimientos
        AND sh.sh_seguro = ${seguro_cod}
        AND sh.sh_prestador = ${prestador}
        AND pev.pev_especialidad = ${especialidad}
        AND pev.pev_proc_tipo = 2
        
      UNION ALL
    
      SELECT
        pro.proc_codigo AS codigo,
        6 AS tiposer,
        IFNULL(sh.sh_habilitar,0) AS habilitar,
        dcu.dcu_utilizar AS utilizar,
        dcu.dcu_frecuencia AS cantdisp,
        dcu.dcu_renovacion AS renovacion,
        IF(CAST(dcu.dcu_careciados as decimal) < 1, dcu.dcu_carencia, if(${dias_dif} <= dcu.dcu_careciados, dcu.dcu_careciados, dcu.dcu_carencia)) AS carencia,
        0 AS cantidadUtilizada,
        dcu.dcu_frecuencia AS diasutilizados,
        0 AS diasdisp
      FROM
        detalle_cobertura_urgencia dcu
        INNER JOIN procedimientos pro ON dcu.dcu_procedimiento = pro.proc_codigo
        INNER JOIN servicios_honorarios sh ON sh.sh_servicio = pro.proc_codigo
        INNER JOIN procedimientos_especialidades_visacion pev ON pev_procedimiento = pro.proc_codigo
      WHERE
        dcu.dcu_cobertura = ${plan}
        AND pro.proc_estado = 1
        AND sh.sh_estado = 1
        AND sh.sh_tipo = 2    #Procedimientos
        AND sh.sh_seguro = ${seguro_cod}
        AND sh.sh_prestador = ${prestador}
        AND pev.pev_especialidad = ${especialidad}
        AND pev.pev_proc_tipo = 2`;

      
      return db.sql(query);
  }

  function getProcedimientos(){
    let query =
    `SELECT
      tc.tc_codigo AS codigo,
      tc.tc_descripcion AS descripcion,
      #Concat(tc.tc_descripcion, ' - 1') AS descripcion,
      1 AS proc_tipo
    FROM
      tipo_consulta tc
      
    UNION ALL
      
    SELECT
      pro.proc_codigo AS codigo,
      pro.proc_descripcion AS descripcion,
      #Concat(pro.proc_descripcion, ' - 2') AS descripcion,
      2 AS proc_tipo
    FROM
      procedimientos pro`;

    
    return db.sql(query);
  }

  return{
    getConsultas, getEstudios, getLaboratorios, getImagenes, getSanatoriales, getUrgencias, getProcedimientos, getTitular, getAdherentes, visacionesRealizadas, getCobertura
  }
}