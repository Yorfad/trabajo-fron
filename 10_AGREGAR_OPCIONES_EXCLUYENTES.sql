-- =============================================
-- Script: 10_AGREGAR_OPCIONES_EXCLUYENTES.sql
-- Descripción: Agrega campos para soportar opciones excluyentes (No Aplica)
-- Autor: Sistema CAB
-- Fecha: 2025-01-17
-- =============================================

USE CAB_DB;
GO

-- 1. Agregar campo 'excluyente' a la tabla preguntas_opciones
-- Este campo marca si una opción es excluyente (bloquea otras respuestas)
IF NOT EXISTS (SELECT * FROM sys.columns
               WHERE object_id = OBJECT_ID('cab.preguntas_opciones')
               AND name = 'excluyente')
BEGIN
    ALTER TABLE cab.preguntas_opciones
    ADD excluyente BIT NOT NULL DEFAULT 0;

    PRINT '✓ Campo "excluyente" agregado a preguntas_opciones';
END
ELSE
BEGIN
    PRINT '- Campo "excluyente" ya existe en preguntas_opciones';
END
GO

-- 2. Agregar campo 'es_no_aplica' a la tabla respuestas_detalle
-- Este campo marca si la respuesta fue marcada como "No Aplica"
IF NOT EXISTS (SELECT * FROM sys.columns
               WHERE object_id = OBJECT_ID('cab.respuestas_detalle')
               AND name = 'es_no_aplica')
BEGIN
    ALTER TABLE cab.respuestas_detalle
    ADD es_no_aplica BIT NOT NULL DEFAULT 0;

    PRINT '✓ Campo "es_no_aplica" agregado a respuestas_detalle';
END
ELSE
BEGIN
    PRINT '- Campo "es_no_aplica" ya existe en respuestas_detalle';
END
GO

-- 3. Actualizar el trigger para excluir respuestas "No Aplica" del cálculo de puntaje
-- El trigger existente calcula puntaje_0a10, pero ahora debe excluir respuestas marcadas como "No Aplica"
IF OBJECT_ID('cab.trg_calcular_puntaje_respuesta_detalle', 'TR') IS NOT NULL
BEGIN
    DROP TRIGGER cab.trg_calcular_puntaje_respuesta_detalle;
    PRINT '✓ Trigger anterior eliminado';
END
GO

CREATE TRIGGER cab.trg_calcular_puntaje_respuesta_detalle
ON cab.respuestas_detalle
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Solo actualizar filas que NO son "No Aplica"
    UPDATE rd
    SET rd.puntaje_0a10 =
        CASE
            -- Si es "No Aplica", el puntaje es NULL (no se cuenta)
            WHEN i.es_no_aplica = 1 THEN NULL

            -- Si hay valor numérico directo (preguntas tipo Numérica)
            WHEN i.valor_numerico IS NOT NULL THEN
                CAST(i.valor_numerico AS DECIMAL(10,2))

            -- Si hay puntos de una opción seleccionada
            WHEN i.puntos IS NOT NULL THEN
                CAST(i.puntos AS DECIMAL(10,2))

            -- Si es SiNo basado en valor_texto
            WHEN p.tipo = 'SiNo' AND i.valor_texto = 'Si' THEN 10.0
            WHEN p.tipo = 'SiNo' AND i.valor_texto = 'No' THEN 0.0

            -- Default
            ELSE 0.0
        END
    FROM cab.respuestas_detalle rd
    INNER JOIN inserted i ON rd.id_respuesta_detalle = i.id_respuesta_detalle
    INNER JOIN cab.preguntas p ON rd.id_pregunta = p.id_pregunta
    WHERE rd.id_respuesta_detalle = i.id_respuesta_detalle;

    PRINT '✓ Puntajes recalculados (excluyendo "No Aplica")';
END;
GO

PRINT '';
PRINT '========================================';
PRINT '✓✓✓ Script completado exitosamente ✓✓✓';
PRINT '========================================';
PRINT 'Campos agregados:';
PRINT '  - preguntas_opciones.excluyente (BIT)';
PRINT '  - respuestas_detalle.es_no_aplica (BIT)';
PRINT 'Trigger actualizado:';
PRINT '  - trg_calcular_puntaje_respuesta_detalle';
PRINT '    (ahora excluye respuestas "No Aplica")';
PRINT '========================================';
GO
