/* =====================================================================
   SCRIPT: Agregar rangos personalizados de semáforo por pregunta
   FECHA: 2025-11-16
   DESCRIPCIÓN: Permite definir rangos personalizados del semáforo
                (verde/amarillo/naranja/rojo) para cada pregunta

   LÓGICA:
   - Campos para definir límites de rangos por color
   - Si NULL, usa rangos globales por defecto
   - Permite personalización fina del análisis

   EJEMPLO:
   - Pregunta A: 0-5 Rojo, 6-7 Naranja, 8-9 Amarillo, 10 Verde
   - Pregunta B: 0-3 Rojo, 4-6 Naranja, 7-8 Amarillo, 9-10 Verde
   ===================================================================== */

USE DB_CAB;
GO

PRINT '🔧 Agregando rangos personalizados de semáforo...';
PRINT '';

-- Verificar que la tabla existe
IF OBJECT_ID('cab.preguntas', 'U') IS NULL
BEGIN
    PRINT '❌ ERROR: La tabla cab.preguntas no existe';
    RETURN;
END
GO

-- Agregar columna rango_rojo_max (límite superior del rango rojo)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.preguntas')
    AND name = 'rango_rojo_max'
)
BEGIN
    PRINT '📝 Agregando columna: rango_rojo_max...';
    ALTER TABLE cab.preguntas
    ADD rango_rojo_max DECIMAL(5,2) NULL;
    PRINT '✅ Columna rango_rojo_max agregada';
END
ELSE
BEGIN
    PRINT '⚠️  La columna rango_rojo_max ya existe';
END
GO

-- Agregar columna rango_naranja_max (límite superior del rango naranja)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.preguntas')
    AND name = 'rango_naranja_max'
)
BEGIN
    PRINT '📝 Agregando columna: rango_naranja_max...';
    ALTER TABLE cab.preguntas
    ADD rango_naranja_max DECIMAL(5,2) NULL;
    PRINT '✅ Columna rango_naranja_max agregada';
END
ELSE
BEGIN
    PRINT '⚠️  La columna rango_naranja_max ya existe';
END
GO

-- Agregar columna rango_amarillo_max (límite superior del rango amarillo)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.preguntas')
    AND name = 'rango_amarillo_max'
)
BEGIN
    PRINT '📝 Agregando columna: rango_amarillo_max...';
    ALTER TABLE cab.preguntas
    ADD rango_amarillo_max DECIMAL(5,2) NULL;
    PRINT '✅ Columna rango_amarillo_max agregada';
END
ELSE
BEGIN
    PRINT '⚠️  La columna rango_amarillo_max ya existe';
END
GO

-- Nota: rango_verde es todo lo que está por encima de rango_amarillo_max

PRINT '';
PRINT '🎉 ¡Rangos personalizados de semáforo implementados!';
PRINT '';
PRINT '✅ Funcionalidades disponibles:';
PRINT '   • Rangos personalizados por pregunta';
PRINT '   • Si NULL, usa rangos globales por defecto';
PRINT '   • Análisis más fino del desempeño';
PRINT '';
PRINT '💡 Ejemplo de configuración:';
PRINT '   rango_rojo_max = 5.0      → 0.0 - 5.0 = Rojo';
PRINT '   rango_naranja_max = 7.0   → 5.01 - 7.0 = Naranja';
PRINT '   rango_amarillo_max = 9.0  → 7.01 - 9.0 = Amarillo';
PRINT '   (sin límite)              → 9.01 - 10.0 = Verde';
PRINT '';
PRINT '📋 Rangos globales por defecto (si NULL):';
PRINT '   • Rojo: 0.0 - 5.0';
PRINT '   • Naranja: 5.01 - 7.0';
PRINT '   • Amarillo: 7.01 - 8.0';
PRINT '   • Verde: 8.01 - 10.0';
GO
