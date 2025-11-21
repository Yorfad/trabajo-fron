/* =====================================================================
   SCRIPT: Corregir puntaje_maximo de todas las preguntas
   FECHA: 2025-11-21
   DESCRIPCIÓN: Actualiza el puntaje_maximo de las preguntas basándose en
                los puntos configurados en sus opciones.

   LÓGICA:
   - SiNo y OpcionUnica: puntaje_maximo = MAX(puntos) de las opciones
   - OpcionMultiple: puntaje_maximo = SUM(puntos) de todas las opciones
   - Numerica/Texto: puntaje_maximo = 10 (escala fija)

   EJEMPLOS:
   - Pregunta SiNo (Sí=1, No=0): puntaje_maximo = 1
   - Pregunta OpcionMultiple (8 opciones × 1 punto): puntaje_maximo = 8
   - Pregunta OpcionMultiple (5 opciones × 1 punto): puntaje_maximo = 5
   ===================================================================== */

USE DB_CAB;
GO

PRINT '🔧 Corrigiendo puntaje_maximo de preguntas...';
PRINT '';

-- Ver estado actual antes de corregir
PRINT '📊 Estado ANTES de la corrección:';
SELECT
  p.id_pregunta,
  p.texto,
  p.tipo,
  p.puntaje_maximo AS puntaje_actual,
  CASE
    WHEN p.tipo IN ('SiNo', 'OpcionUnica') THEN ISNULL(MAX(po.puntos), 1)
    WHEN p.tipo = 'OpcionMultiple' THEN ISNULL(SUM(po.puntos), 1)
    ELSE 10
  END AS puntaje_sugerido
FROM cab.preguntas p
LEFT JOIN cab.preguntas_opciones po ON p.id_pregunta = po.id_pregunta
WHERE p.tipo IN ('SiNo', 'OpcionUnica', 'OpcionMultiple')
GROUP BY p.id_pregunta, p.texto, p.tipo, p.puntaje_maximo
HAVING p.puntaje_maximo <> CASE
    WHEN p.tipo IN ('SiNo', 'OpcionUnica') THEN ISNULL(MAX(po.puntos), 1)
    WHEN p.tipo = 'OpcionMultiple' THEN ISNULL(SUM(po.puntos), 1)
    ELSE 10
  END;

PRINT '';
PRINT '🔄 Aplicando correcciones...';
PRINT '';

-- 1. Actualizar preguntas SiNo y OpcionUnica
-- puntaje_maximo = MAX(puntos) de las opciones
UPDATE p
SET p.puntaje_maximo = subq.max_puntos
FROM cab.preguntas p
INNER JOIN (
  SELECT
    po.id_pregunta,
    MAX(po.puntos) AS max_puntos
  FROM cab.preguntas_opciones po
  INNER JOIN cab.preguntas p2 ON po.id_pregunta = p2.id_pregunta
  WHERE p2.tipo IN ('SiNo', 'OpcionUnica')
  GROUP BY po.id_pregunta
) subq ON p.id_pregunta = subq.id_pregunta
WHERE p.tipo IN ('SiNo', 'OpcionUnica')
  AND p.puntaje_maximo <> subq.max_puntos;

PRINT '✅ Preguntas SiNo y OpcionUnica corregidas';

-- 2. Actualizar preguntas OpcionMultiple
-- puntaje_maximo = SUM(puntos) de todas las opciones
UPDATE p
SET p.puntaje_maximo = subq.sum_puntos
FROM cab.preguntas p
INNER JOIN (
  SELECT
    po.id_pregunta,
    SUM(po.puntos) AS sum_puntos
  FROM cab.preguntas_opciones po
  INNER JOIN cab.preguntas p2 ON po.id_pregunta = p2.id_pregunta
  WHERE p2.tipo = 'OpcionMultiple'
  GROUP BY po.id_pregunta
) subq ON p.id_pregunta = subq.id_pregunta
WHERE p.tipo = 'OpcionMultiple'
  AND p.puntaje_maximo <> subq.sum_puntos;

PRINT '✅ Preguntas OpcionMultiple corregidas';

-- 3. Actualizar preguntas Numerica y Texto que tienen 100
-- Cambiar a escala de 10
UPDATE cab.preguntas
SET puntaje_maximo = 10
WHERE tipo IN ('Numerica', 'Texto', 'Fecha')
  AND puntaje_maximo = 100;

PRINT '✅ Preguntas Numerica/Texto/Fecha ajustadas a escala 10';

PRINT '';
PRINT '📊 Estado DESPUÉS de la corrección:';

-- Ver el resultado
SELECT
  p.tipo,
  COUNT(*) AS total_preguntas,
  AVG(CAST(p.puntaje_maximo AS FLOAT)) AS promedio_puntaje_maximo,
  MIN(p.puntaje_maximo) AS min_puntaje,
  MAX(p.puntaje_maximo) AS max_puntaje
FROM cab.preguntas p
GROUP BY p.tipo
ORDER BY p.tipo;

PRINT '';
PRINT '✅ ¡Puntajes máximos corregidos!';
PRINT '';
PRINT '📝 Resumen:';
PRINT '   • SiNo/OpcionUnica: puntaje_maximo = MAX(puntos opciones)';
PRINT '   • OpcionMultiple: puntaje_maximo = SUM(puntos opciones)';
PRINT '   • Numerica/Texto: puntaje_maximo = 10';
PRINT '';
PRINT '💡 Ahora los semáforos calcularán correctamente:';
PRINT '   Ejemplo SiNo (Sí=1): puntaje_0a10 = (1/1)×10 = 10.0 = Verde ✓';
PRINT '   Ejemplo Multiple (4/8): puntaje_0a10 = (4/8)×10 = 5.0 = Naranja ✓';
GO
