const TABLA = 'preagendamientos';
const COLA = 'preag_llamado'
const PACIENTES = 'pacientes';
const CONTRIBUYENTES = 'clientes_st';
/*const auth = require('../../auth/index');*/

module.exports = function(dbInyectada) {
    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function uno(id){
        return db.uno(TABLA, `preag_codigo = ${id}`, '*');
    }

    function sql(str){
        return db.sql(str);
    }

    function agregar(datos){
        const primary_key_value = datos.preag_codigo;
        const primary_key_name = "preag_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function atender(preag_codigo, box){
        return db.sql(`UPDATE preagendamientos SET preag_est_atend = preag_est_atend+1, preag_box_atend = ${box} WHERE preag_codigo = ${preag_codigo}`)
    }

    function descartar(preag_codigo){
        return db.sql(`UPDATE preagendamientos SET preag_est_reg = 0 WHERE preag_codigo = ${preag_codigo}`)
    }

    function get_ultimo(string_busqueda, fecha){
        const campos = "preag_id "
        const where = ` preag_id LIKE '${string_busqueda}%' AND preag_fecha = DATE_FORMAT('${fecha}', '%Y-%m-%d') ORDER BY preag_id DESC LIMIT 1 `
        return db.todos(TABLA, campos, where);
    }

    function buscar_paciente(string_busqueda){
        const campos = ` *, concat(pac_nombres,' ', pac_apellidos) as nombre, Date_Format(pac_fecha, '%d/%m/%Y') AS fecha_nacimiento `
        const where = ` pac_estado = 1 and pac_documento = ${string_busqueda} `
        return db.todos(PACIENTES, campos, where);
    }

    function traer_paciente(string_busqueda){
        const campos = ` concat(pac_nombres,' ', pac_apellidos) as nombre `
        const where = ` pac_codigo = ${string_busqueda} `
        return db.todos(PACIENTES, campos, where);
    }

    function buscar_contribuyente(string_busqueda){
        const campos = ` cst_razon `
        const where = ` cst_estado = 1 and cst_ruc = ${string_busqueda} `
        return db.todos(CONTRIBUYENTES, campos, where);
    }

    function modificar(preag_codigo, campo, valor){
        let query = `UPDATE ${TABLA} SET ${campo} = ${valor} WHERE preag_codigo = ${preag_codigo}`
        return db.sql(query);
    }

    //////////////////////////////////////////////////////////////Cola de llamado de turno

    function cargar_cola(datos){
        const primary_key_value = datos.preag_llam_codigo;
        const primary_key_name = "preag_llam_codigo";
        return db.agregar(COLA, datos, primary_key_value, primary_key_name);
    }

    function buscar_cola(){
        return db.sql(`SELECT * FROM preag_llamado ORDER BY preag_llam_codigo ASC LIMIT 1`);
    }

    function eliminar_cola(preag_id, sucursal){
        return db.sql(`DELETE FROM preag_llamado WHERE preag_id = '${preag_id}' AND sucursal = ${sucursal}`)
    }

    function esp_preag(){
        return db.sql(`SELECT esp_codigo, esp_descripcion FROM especialidades WHERE esp_mostrar_preag = 1`);
    }

    return{
        uno, sql, buscar_paciente, traer_paciente, buscar_contribuyente, get_ultimo, agregar, atender, descartar, modificar,
        cargar_cola, buscar_cola, eliminar_cola, esp_preag
        //get_config
    }
}