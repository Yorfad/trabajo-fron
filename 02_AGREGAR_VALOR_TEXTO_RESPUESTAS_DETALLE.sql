/* =====================================================================
   SCRIPT: Agregar campo valor_texto a tabla respuestas_detalle
   FECHA: 2025-11-16
   DESCRIPCIÓN: Agrega columna para almacenar respuestas de tipo Texto,
                Fecha y otras que no sean de opción o numéricas

   ⚠️  IMPORTANTE: Este script debe ejecutarse DESPUÉS de
                   01_AGREGAR_COLUMNAS_RESPUESTAS.sql
   ===================================================================== */

USE DB_CAB;
GO

PRINT '🔧 Iniciando modificación de tabla cab.respuestas_detalle...';
PRINT '';

-- Verificar que la tabla existe
IF OBJECT_ID('cab.respuestas_detalle', 'U') IS NULL
BEGIN
    PRINT '❌ ERROR: La tabla cab.respuestas_detalle no existe';
    RETURN;
END
GO

-- Agregar columna valor_texto
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.respuestas_detalle')
    AND name = 'valor_texto'
)
BEGIN
    PRINT '📝 Agregando columna: valor_texto...';
    ALTER TABLE cab.respuestas_detalle
    ADD valor_texto NVARCHAR(MAX) NULL;
    PRINT '✅ Columna valor_texto agregada';
    PRINT '';
    PRINT '📋 Uso de la columna:';
    PRINT '   • Tipo Texto: Almacena respuestas de texto libre';
    PRINT '   • Tipo Fecha: Almacena fechas en formato YYYY-MM-DD';
    PRINT '   • Tipo SiNo (opcional): Almacena "Si" o "No"';
END
ELSE
BEGIN
    PRINT '⚠️  La columna valor_texto ya existe';
END
GO

PRINT '';
PRINT '🎉 ¡Modificación completada exitosamente!';
PRINT '';
PRINT '✅ Nueva columna en cab.respuestas_detalle:';
PRINT '   • valor_texto : NVARCHAR(MAX) - Respuestas de texto/fecha';
PRINT '';

-- Mostrar estructura actualizada de la tabla
PRINT '📋 Estructura actualizada de respuestas_detalle:';
SELECT
    COLUMN_NAME AS 'Columna',
    DATA_TYPE AS 'Tipo',
    CHARACTER_MAXIMUM_LENGTH AS 'Longitud',
    IS_NULLABLE AS 'Permite NULL'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'cab'
  AND TABLE_NAME = 'respuestas_detalle'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '✅ Ahora puede usar la columna valor_texto para preguntas tipo Texto y Fecha';
GO
