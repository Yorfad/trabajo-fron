/* =====================================================================
   SCRIPT: Modificar respuestas_detalle para soportar selección múltiple
   FECHA: 2025-11-16
   DESCRIPCIÓN: Permite que una misma respuesta pueda tener múltiples
                opciones seleccionadas (para preguntas tipo OpcionMultiple)

   CAMBIOS:
   1. Elimina UNIQUE constraint (id_respuesta, id_pregunta)
   2. Crea nueva constraint UNIQUE (id_respuesta, id_pregunta, id_opcion)
   3. Permite que se inserten múltiples filas para la misma pregunta

   EJEMPLO:
   Pregunta: "¿Cuándo lavarse las manos?" (8 opciones posibles)
   Usuario marca 4 de 8 opciones
   Se insertan 4 filas en respuestas_detalle, cada una con:
   - mismo id_respuesta
   - mismo id_pregunta
   - diferente id_opcion

   Puntaje se calcula: 4/8 * 10 = 5.0/10
   ===================================================================== */

USE DB_CAB;
GO

PRINT '🔧 Modificando tabla cab.respuestas_detalle para selección múltiple...';
PRINT '';

-- 1. Eliminar constraint UNIQUE anterior si existe
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UQ_rdet_respuesta_preg'
    AND object_id = OBJECT_ID('cab.respuestas_detalle')
)
BEGIN
    PRINT '📝 Eliminando constraint antigua UQ_rdet_respuesta_preg...';
    ALTER TABLE cab.respuestas_detalle DROP CONSTRAINT UQ_rdet_respuesta_preg;
    PRINT '✅ Constraint eliminada';
END
ELSE
BEGIN
    PRINT '⚠️  Constraint UQ_rdet_respuesta_preg no existe (ya fue eliminada)';
END
GO

-- 2. Crear nueva constraint que permite múltiples opciones por pregunta
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UQ_rdet_respuesta_preg_opcion'
    AND object_id = OBJECT_ID('cab.respuestas_detalle')
)
BEGIN
    PRINT '📝 Creando nueva constraint UQ_rdet_respuesta_preg_opcion...';
    -- Solo crear UNIQUE en (id_respuesta, id_pregunta, id_opcion) si id_opcion NO ES NULL
    -- Para preguntas numéricas/texto, id_opcion es NULL, así que no se aplica
    ALTER TABLE cab.respuestas_detalle
    ADD CONSTRAINT UQ_rdet_respuesta_preg_opcion
    UNIQUE (id_respuesta, id_pregunta, id_opcion);
    PRINT '✅ Nueva constraint creada';
    PRINT '';
    PRINT '📋 Ahora se permite:';
    PRINT '   • Múltiples opciones para la misma pregunta (OpcionMultiple)';
    PRINT '   • Cada combinación (respuesta + pregunta + opción) es única';
END
ELSE
BEGIN
    PRINT '⚠️  Constraint UQ_rdet_respuesta_preg_opcion ya existe';
END
GO

PRINT '';
PRINT '🎉 ¡Modificación completada!';
PRINT '';
PRINT '✅ Tabla cab.respuestas_detalle ahora soporta:';
PRINT '   • OpcionUnica: 1 fila por pregunta';
PRINT '   • OpcionMultiple: N filas por pregunta (una por cada opción marcada)';
PRINT '   • Numerica/Texto/Fecha: 1 fila por pregunta (id_opcion = NULL)';
PRINT '';
PRINT '📊 Ejemplo de puntaje fraccionario:';
PRINT '   Pregunta con 8 opciones posibles';
PRINT '   Usuario marca 4 opciones → 4 filas en respuestas_detalle';
PRINT '   Puntaje: 4/8 * 10 = 5.0 puntos';
GO
