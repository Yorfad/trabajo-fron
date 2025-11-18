-- Script para agregar campos adicionales a la tabla respuestas
-- Ejecutar este script en la base de datos SQL Server si aún no tienes estos campos

USE cab123;
GO

-- Verificar si el campo 'vuelta' ya existe
IF NOT EXISTS (
  SELECT * FROM sys.columns
  WHERE object_id = OBJECT_ID('cab.respuestas')
  AND name = 'vuelta'
)
BEGIN
  ALTER TABLE cab.respuestas
  ADD vuelta INT NOT NULL DEFAULT(1);

  PRINT 'Campo vuelta agregado exitosamente';
END
ELSE
BEGIN
  PRINT 'El campo vuelta ya existe';
END
GO

-- Verificar si el campo 'nombre_encuestada' ya existe
IF NOT EXISTS (
  SELECT * FROM sys.columns
  WHERE object_id = OBJECT_ID('cab.respuestas')
  AND name = 'nombre_encuestada'
)
BEGIN
  ALTER TABLE cab.respuestas
  ADD nombre_encuestada NVARCHAR(200) NULL;

  PRINT 'Campo nombre_encuestada agregado exitosamente';
END
ELSE
BEGIN
  PRINT 'El campo nombre_encuestada ya existe';
END
GO

-- Verificar si el campo 'edad_encuestada' ya existe
IF NOT EXISTS (
  SELECT * FROM sys.columns
  WHERE object_id = OBJECT_ID('cab.respuestas')
  AND name = 'edad_encuestada'
)
BEGIN
  ALTER TABLE cab.respuestas
  ADD edad_encuestada INT NULL;

  PRINT 'Campo edad_encuestada agregado exitosamente';
END
ELSE
BEGIN
  PRINT 'El campo edad_encuestada ya existe';
END
GO

-- Verificar si el campo 'sexo_encuestador' ya existe
IF NOT EXISTS (
  SELECT * FROM sys.columns
  WHERE object_id = OBJECT_ID('cab.respuestas')
  AND name = 'sexo_encuestador'
)
BEGIN
  ALTER TABLE cab.respuestas
  ADD sexo_encuestador CHAR(1) NULL;

  PRINT 'Campo sexo_encuestador agregado exitosamente';
END
ELSE
BEGIN
  PRINT 'El campo sexo_encuestador ya existe';
END
GO

-- Verificar si el campo 'nombre_encuestador' ya existe
IF NOT EXISTS (
  SELECT * FROM sys.columns
  WHERE object_id = OBJECT_ID('cab.respuestas')
  AND name = 'nombre_encuestador'
)
BEGIN
  ALTER TABLE cab.respuestas
  ADD nombre_encuestador NVARCHAR(200) NULL;

  PRINT 'Campo nombre_encuestador agregado exitosamente';
END
ELSE
BEGIN
  PRINT 'El campo nombre_encuestador ya existe';
END
GO

PRINT 'Script completado - Todos los campos necesarios están disponibles';
GO
