const db = require("../DB/mysql");
const fs = require('fs');
const path = require('path');

async function getItems(datos) {
    console.log('EMPEZANDO A CONSULTAR ITEMS ANTES DE LA ACTUALIZACION')

    const largo_total_items = datos.length;
    console.log("longitud total de items a consultar", largo_total_items);
    
    let todosLosItems = [];
    let itemsNoEncontrados = [];
    let itemsActualizados = [];
    let erroresActualizacion = [];

    for (const dato of datos) {
        const consultaQuery = `
        SELECT ar_cod_interno, ar_descripcion, ar_codbarra
        FROM articulos
        WHERE ar_cod_interno = '${dato.cod_interno}'
        `;

        const items = await db.sql(consultaQuery);

        if (items.length > 0) {
            const item = items[0];
            todosLosItems.push(item);

            // Actualizar código de barras
            try {
                const updateQuery = `
                UPDATE articulos 
                SET ar_codbarra = '${dato.cod_barras}'
                WHERE ar_cod_interno = '${dato.cod_interno}'
                `;
                
                await db.sql(updateQuery);
                itemsActualizados.push({
                    cod_interno: dato.cod_interno,
                    cod_barra_anterior: item.ar_codbarra,
                    cod_barra_nuevo: dato.cod_barras
                });
            } catch (error) {
                erroresActualizacion.push({
                    cod_interno: dato.cod_interno,
                    error: error.message
                });
            }
        } else {
            itemsNoEncontrados.push(dato);
        }
    }

    console.log("TOTAL DE ITEMS CONSULTADOS", todosLosItems.length);
    console.log("TOTAL DE ITEMS NO ENCONTRADOS", itemsNoEncontrados.length);
    console.log("TOTAL DE ITEMS ACTUALIZADOS", itemsActualizados.length);
    console.log("TOTAL DE ERRORES EN ACTUALIZACIÓN", erroresActualizacion.length);
    
    if (itemsNoEncontrados.length > 0) {
        console.log("\nITEMS NO ENCONTRADOS EN LA BASE DE DATOS:");
        itemsNoEncontrados.forEach(item => {
            console.log(`- Código interno: ${item.cod_interno}, Descripción: ${item.descripcion}`);
        });
    }

    if (itemsActualizados.length > 0) {
        console.log("\nITEMS ACTUALIZADOS:");
        itemsActualizados.forEach(item => {
            console.log(`- Código interno: ${item.cod_interno}`);
            console.log(`  Código de barras anterior: ${item.cod_barra_anterior}`);
            console.log(`  Código de barras nuevo: ${item.cod_barra_nuevo}`);
        });
    }

    if (erroresActualizacion.length > 0) {
        console.log("\nERRORES EN LA ACTUALIZACIÓN:");
        erroresActualizacion.forEach(error => {
            console.log(`- Código interno: ${error.cod_interno}`);
            console.log(`  Error: ${error.error}`);
        });
    }

    return {
        encontrados: todosLosItems,
        noEncontrados: itemsNoEncontrados,
        actualizados: itemsActualizados,
        errores: erroresActualizacion
    };
}

// Función para leer el archivo JSON
function leerDatosDeArchivo(rutaArchivo) {
    try {
        const contenido = fs.readFileSync(rutaArchivo, 'utf8');
        return JSON.parse(contenido);
    } catch (error) {
        console.error('Error al leer el archivo:', error);
        process.exit(1);
    }
}

// Si se ejecuta directamente el script
if (require.main === module) {
    // Obtener la ruta del archivo de los argumentos de línea de comando
    const rutaArchivo = process.argv[2] || path.join(__dirname, '../services/db_actualizar.json');
    
    console.log('Leyendo datos del archivo:', rutaArchivo);
    const datos = leerDatosDeArchivo(rutaArchivo);
    
    getItems(datos)
        .then(resultado => {
            console.log('\nProceso completado:');
            console.log('- Items encontrados:', resultado.encontrados.length);
            console.log('- Items no encontrados:', resultado.noEncontrados.length);
            console.log('- Items actualizados:', resultado.actualizados.length);
            console.log('- Errores en actualización:', resultado.errores.length);
        })
        .catch(error => {
            console.error('Error en el proceso:', error);
            process.exit(1);
        });
}

module.exports = {
    getItems
}
    
