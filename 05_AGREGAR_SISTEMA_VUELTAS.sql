/* =====================================================================
   SCRIPT: Agregar sistema de vueltas/rondas para seguimiento temporal
   FECHA: 2025-11-16
   DESCRIPCIÓN: Permite identificar la 1ra, 2da, 3ra, etc. visita a una
                comunidad para hacer seguimiento del progreso/retroceso

   LÓGICA:
   - Campo 'vuelta' en tabla respuestas
   - Valor por defecto: 1 (primera visita)
   - Permite comparar resultados entre vueltas

   EJEMPLO:
   - Comunidad "El Carmen" - Vuelta 1 (Enero 2025): Promedio 5.2
   - Comunidad "El Carmen" - Vuelta 2 (Junio 2025): Promedio 6.8
   - Análisis: Mejoró 1.6 puntos entre visitas
   ===================================================================== */

USE DB_CAB;
GO

PRINT '🔧 Agregando sistema de vueltas/rondas...';
PRINT '';

-- Verificar que la tabla existe
IF OBJECT_ID('cab.respuestas', 'U') IS NULL
BEGIN
    PRINT '❌ ERROR: La tabla cab.respuestas no existe';
    RETURN;
END
GO

-- Agregar columna vuelta
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.respuestas')
    AND name = 'vuelta'
)
BEGIN
    PRINT '📝 Agregando columna: vuelta...';
    ALTER TABLE cab.respuestas
    ADD vuelta INT NOT NULL DEFAULT 1
        CONSTRAINT CK_respuestas_vuelta CHECK (vuelta > 0);
    PRINT '✅ Columna vuelta agregada';
    PRINT '';
    PRINT '📋 Uso:';
    PRINT '   • vuelta = 1: Primera visita a la comunidad';
    PRINT '   • vuelta = 2: Segunda visita';
    PRINT '   • vuelta = 3: Tercera visita, etc.';
END
ELSE
BEGIN
    PRINT '⚠️  La columna vuelta ya existe';
END
GO

-- Crear índice para mejorar consultas de análisis temporal
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_respuestas_comunidad_vuelta'
    AND object_id = OBJECT_ID('cab.respuestas')
)
BEGIN
    PRINT '📝 Creando índice para análisis temporal...';
    CREATE INDEX IX_respuestas_comunidad_vuelta
    ON cab.respuestas (id_comunidad, vuelta, aplicada_en);
    PRINT '✅ Índice creado';
END
ELSE
BEGIN
    PRINT '⚠️  Índice IX_respuestas_comunidad_vuelta ya existe';
END
GO

PRINT '';
PRINT '🎉 ¡Sistema de vueltas implementado!';
PRINT '';
PRINT '✅ Funcionalidades disponibles:';
PRINT '   • Identificar vueltas por comunidad';
PRINT '   • Comparar promedios entre vueltas';
PRINT '   • Analizar progreso/retroceso temporal';
PRINT '';
PRINT '💡 Ejemplo de uso:';
PRINT '   SELECT vuelta, AVG(puntaje) FROM respuestas';
PRINT '   WHERE id_comunidad = 1 GROUP BY vuelta;';
GO
