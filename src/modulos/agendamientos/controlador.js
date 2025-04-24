const TABLA = 's_hemodialisis_agendamientos';
const TABLA_RELACIONES = ` s_hemodialisis_agendamientos ha
                            INNER JOIN doctor_especialidad de ON ha.ha_doctor = de.e_codigo
                            INNER JOIN doctores d ON de.e_doctor = d.doc_codigo
                            INNER JOIN doctor_especialidad dea ON ha.ha_ayudante = dea.e_codigo
                            INNER JOIN doctores da ON dea.e_doctor = da.doc_codigo
                            INNER JOIN pacientes pac ON ha.ha_paciente = pac.pac_codigo
                            INNER JOIN s_maquinas ma ON ha.ha_maquina = ma.sm_codigo
                            INNER JOIN sucursales su ON ha.ha_sucursal = su.id
                            INNER JOIN especialidades esp ON de.e_especialidad = esp.esp_codigo `

module.exports = function(dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql.js');
    }

    function todos(string_busqueda){
        const campos = `   
                            ha.ha_codigo,
                            Date_Format(ha.ha_fecha, '%d-%m-%Y') AS ha_fecha,
                            Date_Format(ha.ha_fecha, '%Y-%m-%d') as fecha_revers,
                            ha.ha_hora,
                            Concat(pac.pac_nombres, ' ', pac.pac_apellidos) AS pac_nom,
                            Concat(d.doc_nombres, ' ', d.doc_apellidos, ' - ', esp.esp_descripcion) AS doc_nom,
                            Concat(da.doc_nombres, ' ', da.doc_apellidos) AS ayu_nom,
                            ma.sm_nombre,
                            su.descripcion,
                            ha.ha_obs,
                            ha.ha_atendido,
                            pac.pac_codigo,
                            de.e_codigo as doc_cod,
                            dea.e_codigo as ayu_cod,
                            ma.sm_codigo,
                            su.id as suc_cod,
                            ha.ha_atendido
                               `
        const where = ` ha_estado = 1 and (Concat(pac.pac_nombres, ' ', pac.pac_apellidos) like '%${string_busqueda}%' 
                        or Concat(d.doc_nombres, ' ', d.doc_apellidos) like '%${string_busqueda}%') `
        return db.todos(TABLA_RELACIONES, campos, where);
    }

    function agregar(datos){
        const primary_key_value = datos.ha_codigo;
        const primary_key_name = "ha_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }

    function uno(id){
        const primary_key = `sm_codigo = ${id} `;
        const campos = "sm_codigo, sm_nombre, sm_descripcion, DATE_FORMAT(sm_fecha_nro_ser, '%Y-%m-%d') as sm_fecha_nro_ser, sm_nro_serie "
        return db.uno(TABLA, primary_key, campos);
    }
    
    function eliminar(id){
        const where_update = "ha_codigo = " + id;
        const set_campo = " ha_estado = 0 "
        return db.eliminar(TABLA, where_update, set_campo);
    }

    function obtener_horario(p_fecha, p_hora){
        const campos = ` *  `
        const where = ` ha_estado = 1 and ha_fecha = '${p_fecha}' and  ha_hora = '${p_hora}'   `
        return db.todos(TABLA, campos, where);
    }

    return{
        todos, agregar, uno, eliminar, obtener_horario
    } 
}