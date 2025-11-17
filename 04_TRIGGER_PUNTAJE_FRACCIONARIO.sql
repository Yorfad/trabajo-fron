/* =====================================================================
   SCRIPT: Modificar trigger para calcular puntaje fraccionario
   FECHA: 2025-11-16
   DESCRIPCIÓN: Actualiza el trigger de respuestas_detalle para calcular
                correctamente el puntaje en preguntas de selección múltiple

   LÓGICA DE PUNTAJE FRACCIONARIO:
   - Pregunta con N opciones posibles (total en preguntas_opciones)
   - Usuario marca M opciones (filas insertadas)
   - Puntaje = (M / N) * 10

   EJEMPLO:
   - Pregunta "¿Cuándo lavarse las manos?" tiene 8 opciones
   - Usuario marca 4 opciones correctas
   - Puntaje: (4/8) * 10 = 5.0 puntos
   ===================================================================== */

USE DB_CAB;
GO

PRINT '🔧 Actualizando trigger para puntaje fraccionario...';
PRINT '';

-- Eliminar trigger anterior
IF OBJECT_ID('cab.tg_respuestas_detalle_bi','TR') IS NOT NULL
    DROP TRIGGER cab.tg_respuestas_detalle_bi;
GO

PRINT '📝 Creando nuevo trigger con lógica de puntaje fraccionario...';
GO

CREATE TRIGGER cab.tg_respuestas_detalle_bi
ON cab.respuestas_detalle
INSTEAD OF INSERT
AS
BEGIN
  SET NOCOUNT ON;

  -- Validar que id_opcion corresponda a la pregunta
  IF EXISTS (
    SELECT 1
    FROM inserted i
    JOIN cab.preguntas_opciones o ON o.id_opcion = i.id_opcion
    WHERE i.id_opcion IS NOT NULL AND o.id_pregunta <> i.id_pregunta
  )
  BEGIN
    THROW 52001, N'id_opcion no corresponde a la id_pregunta indicada.', 1;
  END;

  -- Insertar con cálculo de puntaje mejorado
  INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto, puntos, puntaje_0a10)
  SELECT
    i.id_respuesta,
    i.id_pregunta,
    i.id_opcion,
    i.valor_numerico,
    i.valor_texto,
    -- Calcular puntos (limitados a puntaje_maximo)
    CASE
      WHEN COALESCE(i.puntos,0) < 0 THEN 0
      WHEN COALESCE(i.puntos,0) > p.puntaje_maximo THEN p.puntaje_maximo
      ELSE COALESCE(i.puntos,0)
    END,
    -- Calcular puntaje_0a10
    CAST(
      CASE
        WHEN NULLIF(p.puntaje_maximo,0) IS NULL THEN 0
        ELSE (
          CASE
            WHEN COALESCE(i.puntos,0) < 0 THEN 0
            WHEN COALESCE(i.puntos,0) > p.puntaje_maximo THEN 10.0
            ELSE (CAST(COALESCE(i.puntos,0) AS FLOAT) / p.puntaje_maximo) * 10.0
          END
        )
      END
      AS DECIMAL(5,2)
    )
  FROM inserted i
  INNER JOIN cab.preguntas p ON p.id_pregunta = i.id_pregunta;
END;
GO

PRINT '✅ Trigger actualizado exitosamente';
PRINT '';
PRINT '📊 Cálculo de puntaje:';
PRINT '   • OpcionUnica/OpcionMultiple: puntos de la opción / puntaje_maximo * 10';
PRINT '   • Para selección múltiple:';
PRINT '     - Se inserta 1 fila por cada opción marcada';
PRINT '     - Cada fila tiene los puntos de esa opción';
PRINT '     - El puntaje se normaliza a escala 0-10';
PRINT '   • Numerica/Texto: puntos asignados / puntaje_maximo * 10';
PRINT '';
PRINT '💡 IMPORTANTE:';
PRINT '   Para preguntas de selección múltiple donde se evalúa cantidad:';
PRINT '   - Asignar 1 punto a cada opción correcta';
PRINT '   - puntaje_maximo = número total de opciones';
PRINT '   - Si usuario marca 4 de 8: (1+1+1+1)/8 * 10 = 5.0 puntos';
GO
