-- Script para agregar tipo 'Catalogo' al CHECK constraint de preguntas
-- Ejecutar este script en la base de datos SQL Server

USE cab123;
GO

-- Eliminar el constraint actual
ALTER TABLE cab.preguntas
DROP CONSTRAINT CK_preguntas_tipo;
GO

-- Agregar el nuevo constraint con 'Catalogo' incluido
ALTER TABLE cab.preguntas
ADD CONSTRAINT CK_preguntas_tipo CHECK (
  tipo IN ('OpcionUnica','OpcionMultiple','Numerica','SiNo','Fecha','Texto','Catalogo')
);
GO

PRINT 'Tipo Catalogo agregado exitosamente al CHECK constraint';
GO
