/* =====================================================================
   SCRIPT: Actualizar trigger para soportar puntos negativos
   FECHA: 2025-11-16
   DESCRIPCIÓN: Modifica el trigger de respuestas_detalle para permitir
                puntos negativos en respuestas incorrectas

   LÓGICA:
   - Permite puntos negativos (ej: -1 para respuesta incorrecta)
   - El puntaje normalizado (0-10) puede ser negativo
   - Útil para penalizar respuestas incorrectas

   EJEMPLO:
   - Pregunta con puntaje_maximo = 10
   - Respuesta incorrecta: puntos = -1
   - Puntaje_0a10 = (-1 / 10) × 10 = -1.0
   - Promedio de -1.0 + 5.0 + 8.0 = 4.0
   ===================================================================== */

USE DB_CAB;
GO

PRINT '🔧 Actualizando trigger para soportar puntos negativos...';
PRINT '';

-- Eliminar trigger existente
IF OBJECT_ID('cab.tg_respuestas_detalle_bi', 'TR') IS NOT NULL
BEGIN
    PRINT '📝 Eliminando trigger anterior...';
    DROP TRIGGER cab.tg_respuestas_detalle_bi;
    PRINT '✅ Trigger eliminado';
END
GO

PRINT '📝 Creando trigger actualizado con soporte de puntos negativos...';
GO

CREATE TRIGGER cab.tg_respuestas_detalle_bi
ON cab.respuestas_detalle
INSTEAD OF INSERT
AS
BEGIN
  SET NOCOUNT ON;

  -- Validar que id_pregunta y id_opcion estén relacionadas
  IF EXISTS (
    SELECT 1
    FROM INSERTED i
    INNER JOIN cab.preguntas_opciones po ON i.id_opcion = po.id_opcion
    WHERE i.id_opcion IS NOT NULL
      AND i.id_pregunta <> po.id_pregunta
  )
  BEGIN
    THROW 52001, N'id_opcion no corresponde a la id_pregunta indicada.', 1;
  END;

  -- Insertar con cálculo de puntaje que permite negativos
  INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto, puntos, puntaje_0a10)
  SELECT
    i.id_respuesta,
    i.id_pregunta,
    i.id_opcion,
    i.valor_numerico,
    i.valor_texto,
    -- Guardar puntos tal cual (puede ser negativo)
    COALESCE(i.puntos, 0),
    -- Calcular puntaje_0a10 (puede ser negativo)
    CAST(
      CASE
        WHEN NULLIF(p.puntaje_maximo, 0) IS NULL THEN 0
        ELSE (CAST(COALESCE(i.puntos, 0) AS FLOAT) / p.puntaje_maximo) * 10.0
      END
    AS DECIMAL(5, 2))
  FROM INSERTED i
  LEFT JOIN cab.preguntas p ON i.id_pregunta = p.id_pregunta;

END;
GO

PRINT '✅ Trigger actualizado';
PRINT '';
PRINT '🎉 ¡Soporte de puntos negativos implementado!';
PRINT '';
PRINT '✅ Funcionalidades:';
PRINT '   • Permite puntos negativos para respuestas incorrectas';
PRINT '   • Puntaje_0a10 puede ser negativo';
PRINT '   • Útil para penalizar errores';
PRINT '';
PRINT '💡 Ejemplo de uso:';
PRINT '   Opción incorrecta: puntos = -1';
PRINT '   Con puntaje_maximo = 10: puntaje_0a10 = -1.0';
GO
