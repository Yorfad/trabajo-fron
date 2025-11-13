/* =====================================================================
   SCRIPT: Agregar campos de persona encuestada a tabla respuestas
   FECHA: 2025-11-12
   DESCRIPCIÓN: Agrega columnas para almacenar información de la persona
                encuestada y el sexo del encuestador
   ===================================================================== */

USE DB_CAB;
GO

PRINT '🔧 Iniciando modificación de tabla cab.respuestas...';
PRINT '';

-- Verificar que la tabla existe
IF OBJECT_ID('cab.respuestas', 'U') IS NULL
BEGIN
    PRINT '❌ ERROR: La tabla cab.respuestas no existe';
    RETURN;
END
GO

-- 1. Agregar columna nombre_encuestada
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.respuestas')
    AND name = 'nombre_encuestada'
)
BEGIN
    PRINT '📝 Agregando columna: nombre_encuestada...';
    ALTER TABLE cab.respuestas
    ADD nombre_encuestada NVARCHAR(200) NULL;
    PRINT '✅ Columna nombre_encuestada agregada';
END
ELSE
BEGIN
    PRINT '⚠️  La columna nombre_encuestada ya existe';
END
GO

-- 2. Agregar columna edad_encuestada
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.respuestas')
    AND name = 'edad_encuestada'
)
BEGIN
    PRINT '📝 Agregando columna: edad_encuestada...';
    ALTER TABLE cab.respuestas
    ADD edad_encuestada INT NULL
        CONSTRAINT CK_respuestas_edad CHECK (edad_encuestada >= 0 AND edad_encuestada <= 150);
    PRINT '✅ Columna edad_encuestada agregada (validación: 0-150 años)';
END
ELSE
BEGIN
    PRINT '⚠️  La columna edad_encuestada ya existe';
END
GO

-- 3. Agregar columna sexo_encuestador
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.respuestas')
    AND name = 'sexo_encuestador'
)
BEGIN
    PRINT '📝 Agregando columna: sexo_encuestador...';
    ALTER TABLE cab.respuestas
    ADD sexo_encuestador CHAR(1) NULL
        CONSTRAINT CK_respuestas_sexo CHECK (sexo_encuestador IN ('F', 'M'));
    PRINT '✅ Columna sexo_encuestador agregada (validación: F o M)';
END
ELSE
BEGIN
    PRINT '⚠️  La columna sexo_encuestador ya existe';
END
GO

PRINT '';
PRINT '🎉 ¡Modificación completada exitosamente!';
PRINT '';
PRINT '✅ Nuevas columnas en cab.respuestas:';
PRINT '   • nombre_encuestada  : NVARCHAR(200) - Nombre de la mujer encuestada';
PRINT '   • edad_encuestada    : INT (0-150)   - Edad de la encuestada';
PRINT '   • sexo_encuestador   : CHAR(1) (F/M) - Sexo del encuestador';
PRINT '';
PRINT '📋 Estructura actualizada de la tabla:';

-- Mostrar estructura actual de la tabla
SELECT
    COLUMN_NAME AS 'Columna',
    DATA_TYPE AS 'Tipo',
    CHARACTER_MAXIMUM_LENGTH AS 'Longitud',
    IS_NULLABLE AS 'Permite NULL'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'cab'
  AND TABLE_NAME = 'respuestas'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '🔍 Verificando restricciones (CHECK constraints):';
SELECT
    c.name AS 'Restricción',
    cc.definition AS 'Definición'
FROM sys.check_constraints c
JOIN sys.columns cc ON 1=1
WHERE c.parent_object_id = OBJECT_ID('cab.respuestas')
  AND c.name LIKE '%edad%' OR c.name LIKE '%sexo%';
GO

PRINT '';
PRINT '✅ La base de datos está lista para recibir los nuevos campos';
PRINT '📝 Próximos pasos:';
PRINT '   1. Actualizar el backend (Node.js) para:';
PRINT '      • Recibir estos campos en POST /respuestas';
PRINT '      • Guardarlos en la tabla cab.respuestas';
PRINT '      • Devolverlos en GET /respuestas';
PRINT '   2. El frontend ya está listo para enviar y mostrar estos datos';
PRINT '';
