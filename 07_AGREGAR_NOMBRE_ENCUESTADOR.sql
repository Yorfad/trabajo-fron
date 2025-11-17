/* =====================================================================
   SCRIPT: Agregar nombre del encuestador a tabla respuestas
   FECHA: 2025-11-16
   DESCRIPCIÓN: Agrega columna para almacenar el nombre del encuestador
                automáticamente desde el usuario logueado

   LÓGICA:
   - Campo 'nombre_encuestador' se llena automáticamente desde req.user.nombre
   - No requiere input manual en el frontend
   - Permite auditoría de quién realizó cada encuesta

   EJEMPLO:
   - Usuario logueado: "María González"
   - Al crear respuesta: nombre_encuestador = "María González"
   ===================================================================== */

USE DB_CAB;
GO

PRINT '🔧 Agregando nombre del encuestador...';
PRINT '';

-- Verificar que la tabla existe
IF OBJECT_ID('cab.respuestas', 'U') IS NULL
BEGIN
    PRINT '❌ ERROR: La tabla cab.respuestas no existe';
    RETURN;
END
GO

-- Agregar columna nombre_encuestador
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.respuestas')
    AND name = 'nombre_encuestador'
)
BEGIN
    PRINT '📝 Agregando columna: nombre_encuestador...';
    ALTER TABLE cab.respuestas
    ADD nombre_encuestador NVARCHAR(200) NULL;
    PRINT '✅ Columna nombre_encuestador agregada';
    PRINT '';
    PRINT '📋 Uso:';
    PRINT '   • Se llena automáticamente desde usuario logueado';
    PRINT '   • No requiere input manual';
    PRINT '   • Permite auditoría de encuestas';
END
ELSE
BEGIN
    PRINT '⚠️  La columna nombre_encuestador ya existe';
END
GO

PRINT '';
PRINT '🎉 ¡Nombre de encuestador implementado!';
PRINT '';
PRINT '✅ Funcionalidades disponibles:';
PRINT '   • Captura automática del nombre del usuario';
PRINT '   • Auditoría de quién realizó cada encuesta';
PRINT '   • No requiere input manual en frontend';
GO
