-- Creación de la tabla inventario_auxiliar si no existe
CREATE TABLE IF NOT EXISTS inventario_auxiliar (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    operador INT UNSIGNED NOT NULL,
    sucursal INT UNSIGNED NOT NULL,
    deposito INT UNSIGNED NOT NULL,
    estado INT NOT NULL,
    obs VARCHAR(100),
    nro_inventario VARCHAR(45),
    FOREIGN KEY (operador) REFERENCES operadores(op_codigo),
    FOREIGN KEY (sucursal) REFERENCES sucursales(id),
    FOREIGN KEY (deposito) REFERENCES depositos(dep_codigo)
);

-- Creación de la tabla inventario_auxiliar_items si no existe
CREATE TABLE IF NOT EXISTS inventario_auxiliar_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_articulo INT UNSIGNED NOT NULL,
    id_lote INT UNSIGNED,
    id_inventario INT UNSIGNED NOT NULL,
    lote VARCHAR(45),
    fecha_vencimiento DATE,
    cantidad_inicial DECIMAL(12,2) NOT NULL,
    cantidad_scanner DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (id_articulo) REFERENCES articulos(ar_codigo),
    FOREIGN KEY (id_lote) REFERENCES articulos_lotes(al_codigo),
    FOREIGN KEY (id_inventario) REFERENCES inventario_auxiliar(id)
);

-- Agregar columnas a inventario_auxiliar si no existen
SET @dbname = DATABASE();
SET @tablename = "inventario_auxiliar";
SET @columnname = "autorizado";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column autorizado already exists'",
  "ALTER TABLE inventario_auxiliar ADD COLUMN autorizado int not null default 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "fecha_cierre";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column fecha_cierre already exists'",
  "ALTER TABLE inventario_auxiliar ADD COLUMN fecha_cierre date"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "hora_cierre";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column hora_cierre already exists'",
  "ALTER TABLE inventario_auxiliar ADD COLUMN hora_cierre time"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Creación de la tabla agenda_subvisitas si no existe
CREATE TABLE IF NOT EXISTS agenda_subvisitas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT DEFAULT 0,
    id_agenda INT UNSIGNED NOT NULL,
    nombre_cliente VARCHAR(255),
    motivo_visita TEXT,
    resultado_visita TEXT,
    FOREIGN KEY (id_agenda) REFERENCES agendas(a_codigo)
);

-- Insertar en menu_sistemas si no existe
INSERT IGNORE INTO `menu_sistemas` (m_codigo, m_descripcion, m_grupo, m_orden) VALUES
    (0, 'w.Ruteamiento de pedidos', 2, 110),
    (0, 'w.Rutas de pedidos', 2, 111),
    (0, 'w.Informe de entregas', 2, 112),
    (0, 'w.Preparacion de pedidos', 2, 113),
    (0, 'w.Verificacion de pedidos', 2, 114),
    (0, 'w.Autorizacion ajuste de stock', 1, 50),
    (0, 'w.Control de ingresos', 1, 51);


-- Actualizar menu_sistemas
UPDATE menu_sistemas SET m_descripcion = 'Consulta planificaciones' WHERE m_grupo = 2 AND m_orden = 30;
UPDATE menu_sistemas SET m_descripcion = 'Informe planificaciones' WHERE m_grupo = 2 AND m_orden = 31;
UPDATE menu_sistemas SET m_descripcion = 'Ingreso de planificación' WHERE m_grupo = 2 AND m_orden = 18;

-- Agregar columnas a detalle_compras si no existen
SET @tablename = "detalle_compras";
SET @columnname = "dc_cantidad_verificada";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column dc_cantidad_verificada already exists'",
  "ALTER TABLE detalle_compras ADD COLUMN dc_cantidad_verificada INT NOT NULL DEFAULT 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar columnas a compras si no existen
SET @tablename = "compras";
SET @columnname = "co_verificado";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column co_verificado already exists'",
  "ALTER TABLE compras ADD COLUMN co_verificado INT NOT NULL DEFAULT 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "co_responsable_ubicacion";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column co_responsable_ubicacion already exists'",
  "ALTER TABLE compras ADD COLUMN co_responsable_ubicacion INT NOT NULL DEFAULT 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "co_verificador";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column co_verificador already exists'",
  "ALTER TABLE compras ADD COLUMN co_verificador INT NOT NULL DEFAULT 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "co_confirmador";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column co_confirmador already exists'",
  "ALTER TABLE compras ADD COLUMN co_confirmador INT NOT NULL DEFAULT 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Creación de la tabla configuraciones_web si no existe
CREATE TABLE IF NOT EXISTS `configuraciones_web` (
    `id` int NOT NULL AUTO_INCREMENT,
    `descripcion` varchar(255) NOT NULL,
    `valor` text,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- Insertar en configuraciones_web si no existe
INSERT IGNORE INTO configuraciones_web (descripcion, valor) VALUES 
    ('Configuraciones Nota Comun', '{}'),
    ('Ajustes Foto de Cabecera Factura', '{}'),
    ('Ajustes Factura', '{}');

-- Agregar columnas a pedidos si no existen
SET @tablename = "pedidos";
SET @columnname = "p_imprimir_preparacion";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column p_imprimir_preparacion already exists'",
  "ALTER TABLE pedidos ADD COLUMN p_imprimir_preparacion int not null default 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "p_preparado_por";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column p_preparado_por already exists'",
  "ALTER TABLE pedidos ADD COLUMN p_preparado_por int not null default 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "p_cantidad_cajas";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column p_cantidad_cajas already exists'",
  "ALTER TABLE pedidos ADD COLUMN p_cantidad_cajas int not null default 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "p_verificado_por";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column p_verificado_por already exists'",
  "ALTER TABLE pedidos ADD COLUMN p_verificado_por int not null default 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Creación de la tabla direcciones si no existe
CREATE TABLE IF NOT EXISTS direcciones (
    d_id INT AUTO_INCREMENT PRIMARY KEY,
    d_calle VARCHAR(10) NOT NULL,
    d_predio INT NOT NULL,
    d_piso INT NOT NULL,
    d_direccion INT NOT NULL,
    d_estado INT NOT NULL,
    d_tipo INT NOT NULL,
    d_zona INT DEFAULT 0,
    UNIQUE KEY unique_direccion (d_calle, d_predio, d_piso, d_direccion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Creación de la tabla articulos_direcciones si no existe
CREATE TABLE IF NOT EXISTS articulos_direcciones (
    au_id INT PRIMARY KEY AUTO_INCREMENT,
    au_articulo INT UNSIGNED NOT NULL,
    au_lote VARCHAR(50),
    au_direccion INT NOT NULL,
    au_estado TINYINT NOT NULL DEFAULT 1,
    FOREIGN KEY (au_articulo) REFERENCES articulos(ar_codigo),
    FOREIGN KEY (au_direccion) REFERENCES direcciones(d_id)
);

-- Insertar en menu_sistemas si no existe
INSERT IGNORE INTO `menu_sistemas` (m_codigo, m_descripcion, m_grupo, m_orden) VALUES
    (0, 'w.Gestion de direcciones', 1, 52);