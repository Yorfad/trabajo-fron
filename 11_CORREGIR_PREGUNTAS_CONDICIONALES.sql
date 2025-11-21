-- =============================================
-- Script: 11_CORREGIR_PREGUNTAS_CONDICIONALES.sql
-- Descripción: Corrige las referencias de preguntas condicionales
-- Las opciones marcadas como condicionales deben apuntar a la pregunta siguiente
-- Autor: Sistema CAB
-- Fecha: 2025-01-20
-- =============================================

USE CAB_DB;
GO

PRINT '';
PRINT '========================================';
PRINT 'ACTUALIZANDO PREGUNTAS CONDICIONALES';
PRINT '========================================';
PRINT '';

-- Verificar que las preguntas y opciones existan
PRINT 'Verificando estructura de preguntas...';

-- Ver estado actual de las opciones condicionales
PRINT '';
PRINT 'Estado ANTES de la actualización:';
SELECT
    po.id_opcion,
    po.id_pregunta AS 'pregunta_padre',
    po.etiqueta,
    po.condicional,
    po.condicional_pregunta_id AS 'muestra_pregunta'
FROM cab.preguntas_opciones po
WHERE po.condicional = 1
ORDER BY po.id_pregunta;
PRINT '';

-- =============================================
-- ACTUALIZAR OPCIONES CONDICIONALES
-- =============================================

-- Pregunta 144 (opción 277 "Sí") → muestra pregunta 145
UPDATE cab.preguntas_opciones
SET condicional_pregunta_id = 145
WHERE id_opcion = 277
  AND id_pregunta = 144
  AND condicional = 1
  AND EXISTS (SELECT 1 FROM cab.preguntas WHERE id_pregunta = 145);

IF @@ROWCOUNT > 0
    PRINT '✓ Opción 277 (Pregunta 144) → ahora muestra Pregunta 145';
ELSE
    PRINT '⚠ No se pudo actualizar opción 277 (verificar que exista)';

-- Pregunta 147 (opción 286 "Sí") → muestra pregunta 148
UPDATE cab.preguntas_opciones
SET condicional_pregunta_id = 148
WHERE id_opcion = 286
  AND id_pregunta = 147
  AND condicional = 1
  AND EXISTS (SELECT 1 FROM cab.preguntas WHERE id_pregunta = 148);

IF @@ROWCOUNT > 0
    PRINT '✓ Opción 286 (Pregunta 147) → ahora muestra Pregunta 148';
ELSE
    PRINT '⚠ No se pudo actualizar opción 286 (verificar que exista)';

-- Pregunta 151 (opción 294 "Sí") → muestra pregunta 152
UPDATE cab.preguntas_opciones
SET condicional_pregunta_id = 152
WHERE id_opcion = 294
  AND id_pregunta = 151
  AND condicional = 1
  AND EXISTS (SELECT 1 FROM cab.preguntas WHERE id_pregunta = 152);

IF @@ROWCOUNT > 0
    PRINT '✓ Opción 294 (Pregunta 151) → ahora muestra Pregunta 152';
ELSE
    PRINT '⚠ No se pudo actualizar opción 294 (verificar que exista)';

-- Pregunta 153 (opción 299 "Sí") → muestra pregunta 154
UPDATE cab.preguntas_opciones
SET condicional_pregunta_id = 154
WHERE id_opcion = 299
  AND id_pregunta = 153
  AND condicional = 1
  AND EXISTS (SELECT 1 FROM cab.preguntas WHERE id_pregunta = 154);

IF @@ROWCOUNT > 0
    PRINT '✓ Opción 299 (Pregunta 153) → ahora muestra Pregunta 154';
ELSE
    PRINT '⚠ No se pudo actualizar opción 299 (verificar que exista)';

-- Pregunta 155 (opción 301 "Sí") → muestra pregunta 156
UPDATE cab.preguntas_opciones
SET condicional_pregunta_id = 156
WHERE id_opcion = 301
  AND id_pregunta = 155
  AND condicional = 1
  AND EXISTS (SELECT 1 FROM cab.preguntas WHERE id_pregunta = 156);

IF @@ROWCOUNT > 0
    PRINT '✓ Opción 301 (Pregunta 155) → ahora muestra Pregunta 156';
ELSE
    PRINT '⚠ No se pudo actualizar opción 301 (verificar que exista)';

-- Pregunta 157 (opción 306 "Sí") → muestra pregunta 158
UPDATE cab.preguntas_opciones
SET condicional_pregunta_id = 158
WHERE id_opcion = 306
  AND id_pregunta = 157
  AND condicional = 1
  AND EXISTS (SELECT 1 FROM cab.preguntas WHERE id_pregunta = 158);

IF @@ROWCOUNT > 0
    PRINT '✓ Opción 306 (Pregunta 157) → ahora muestra Pregunta 158';
ELSE
    PRINT '⚠ No se pudo actualizar opción 306 (verificar que exista)';

-- Ver estado después de la actualización
PRINT '';
PRINT 'Estado DESPUÉS de la actualización:';
SELECT
    po.id_opcion,
    po.id_pregunta AS 'pregunta_padre',
    po.etiqueta,
    po.condicional,
    po.condicional_pregunta_id AS 'muestra_pregunta',
    p.texto AS 'texto_pregunta_condicional'
FROM cab.preguntas_opciones po
LEFT JOIN cab.preguntas p ON po.condicional_pregunta_id = p.id_pregunta
WHERE po.condicional = 1
ORDER BY po.id_pregunta;

PRINT '';
PRINT '========================================';
PRINT '✓✓✓ Script completado exitosamente ✓✓✓';
PRINT '========================================';
PRINT 'Opciones condicionales actualizadas:';
PRINT '  - Opción 277 (Pregunta 144) → Pregunta 145';
PRINT '  - Opción 286 (Pregunta 147) → Pregunta 148';
PRINT '  - Opción 294 (Pregunta 151) → Pregunta 152';
PRINT '  - Opción 299 (Pregunta 153) → Pregunta 154';
PRINT '  - Opción 301 (Pregunta 155) → Pregunta 156';
PRINT '  - Opción 306 (Pregunta 157) → Pregunta 158';
PRINT '========================================';
GO
