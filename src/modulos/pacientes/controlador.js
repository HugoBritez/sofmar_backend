const TABLA = 'pacientes';

/*const auth = require('../../auth/index');*/

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(){
        const campos = "pac_codigo, concat(pac_nombres,' ', pac_apellidos,' - CI: ', pac_documento) as pacnom"
        const where = " pac_estado = 1 "
        return db.todos(TABLA, campos, where);
    }
    
    function uno(id){
        return db.uno(TABLA, id);
    }

    function get_paciente(p_documento){
        const campos = ` *, concat(pac_nombres,' ', pac_apellidos) as nombre,  Date_Format(pac_fecha, '%d/%m/%Y') AS fecha_nacimiento `
        const where = ` pac_estado = 1 and pac_documento = ${p_documento} `
        return db.todos(TABLA, campos, where);
    }

    function asegurados(string_busqueda){
        let query = `
            SELECT
                b.b_codigo AS nro,
                p.pac_codigo AS codigo,
                Concat(p.pac_apellidos, ' ', p.pac_nombres) AS nombre,
                'Titular' AS tipo,
                1 AS tipocod
            FROM
                beneficiarios b
                INNER JOIN pacientes p ON b.b_titular = p.pac_codigo
            WHERE
                b.b_estado = 1 AND (Concat(p.pac_apellidos, ' ', p.pac_nombres) LIKE '%${string_busqueda}%' OR p.pac_codigo LIKE '%${string_busqueda}%')
            UNION ALL
            SELECT
                b.b_codigo AS nro,
                p.pac_codigo AS codigo,
                concat(p.pac_apellidos,' ',p.pac_nombres) AS nombre,
                IF(ba.ba_tipo=0,'Beneficiario','Adherente') AS tipo,
                ba.ba_tipo + 1 AS tipocod 
            FROM
                beneficiarios b 
                INNER JOIN beneficiarios_adherentes ba ON ba.ba_beneficiario = b.b_codigo
                INNER JOIN pacientes p ON ba.ba_adherente = p.pac_codigo 
            WHERE
                b.b_estado = 1 AND (Concat(p.pac_apellidos, ' ', p.pac_nombres) LIKE '%${string_busqueda}%' OR p.pac_codigo LIKE '%${string_busqueda}%')`;
        return db.sql(query);
    }

    function validarAsegurado(codigo){
        let query = `
            SELECT
                b.b_codigo AS nro,
                p.pac_codigo AS codigo,
                Concat(p.pac_apellidos, ' ', p.pac_nombres) AS nombre,
                'Titular' AS tipo,
                1 AS tipocod
            FROM
                beneficiarios b
                INNER JOIN pacientes p ON b.b_titular = p.pac_codigo
            WHERE
                b.b_estado = 1 AND p.pac_codigo = ${codigo}
            UNION ALL
            SELECT
                b.b_codigo AS nro,
                p.pac_codigo AS codigo,
                concat(p.pac_apellidos,' ',p.pac_nombres) AS nombre,
                IF(ba.ba_tipo=0,'Beneficiario','Adherente') AS tipo,
                ba.ba_tipo + 1 AS tipocod 
            FROM
                beneficiarios b 
                INNER JOIN beneficiarios_adherentes ba ON ba.ba_beneficiario = b.b_codigo
                INNER JOIN pacientes p ON ba.ba_adherente = p.pac_codigo 
            WHERE
                b.b_estado = 1 AND p.pac_codigo = ${codigo}`;
        return db.sql(query);
    }


    return{
        todos, uno, get_paciente, asegurados, validarAsegurado
    } 
}