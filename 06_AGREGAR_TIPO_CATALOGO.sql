/* =====================================================================
   SCRIPT: Agregar soporte para tipo Catálogo en preguntas
   FECHA: 2025-11-16
   DESCRIPCIÓN: Permite que preguntas carguen opciones desde tablas
                de la base de datos (comunidades, departamentos, etc.)

   LÓGICA:
   - Campo 'catalogo_tabla' indica de qué tabla cargar opciones
   - Campo 'catalogo_valor' indica qué columna usar como valor
   - Campo 'catalogo_etiqueta' indica qué columna mostrar al usuario

   EJEMPLO:
   - Pregunta: "¿De qué comunidad es?"
   - catalogo_tabla = 'comunidades'
   - catalogo_valor = 'id_comunidad'
   - catalogo_etiqueta = 'nombre'
   - Frontend carga: SELECT id_comunidad, nombre FROM comunidades
   ===================================================================== */

USE DB_CAB;
GO

PRINT '🔧 Agregando soporte para tipo Catálogo...';
PRINT '';

-- Verificar que la tabla existe
IF OBJECT_ID('cab.preguntas', 'U') IS NULL
BEGIN
    PRINT '❌ ERROR: La tabla cab.preguntas no existe';
    RETURN;
END
GO

-- Agregar columna catalogo_tabla
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.preguntas')
    AND name = 'catalogo_tabla'
)
BEGIN
    PRINT '📝 Agregando columna: catalogo_tabla...';
    ALTER TABLE cab.preguntas
    ADD catalogo_tabla NVARCHAR(100) NULL;
    PRINT '✅ Columna catalogo_tabla agregada';
END
ELSE
BEGIN
    PRINT '⚠️  La columna catalogo_tabla ya existe';
END
GO

-- Agregar columna catalogo_valor
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.preguntas')
    AND name = 'catalogo_valor'
)
BEGIN
    PRINT '📝 Agregando columna: catalogo_valor...';
    ALTER TABLE cab.preguntas
    ADD catalogo_valor NVARCHAR(100) NULL;
    PRINT '✅ Columna catalogo_valor agregada';
END
ELSE
BEGIN
    PRINT '⚠️  La columna catalogo_valor ya existe';
END
GO

-- Agregar columna catalogo_etiqueta
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.preguntas')
    AND name = 'catalogo_etiqueta'
)
BEGIN
    PRINT '📝 Agregando columna: catalogo_etiqueta...';
    ALTER TABLE cab.preguntas
    ADD catalogo_etiqueta NVARCHAR(100) NULL;
    PRINT '✅ Columna catalogo_etiqueta agregada';
END
ELSE
BEGIN
    PRINT '⚠️  La columna catalogo_etiqueta ya existe';
END
GO

-- Agregar constraint de validación
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_preguntas_catalogo'
    AND parent_object_id = OBJECT_ID('cab.preguntas')
)
BEGIN
    PRINT '📝 Agregando constraint de validación...';
    ALTER TABLE cab.preguntas
    ADD CONSTRAINT CK_preguntas_catalogo CHECK (
        -- Si tipo = 'Catalogo', debe tener los 3 campos
        (tipo = 'Catalogo' AND catalogo_tabla IS NOT NULL AND catalogo_valor IS NOT NULL AND catalogo_etiqueta IS NOT NULL)
        OR
        -- Si tipo != 'Catalogo', los 3 campos deben ser NULL
        (tipo != 'Catalogo' AND catalogo_tabla IS NULL AND catalogo_valor IS NULL AND catalogo_etiqueta IS NULL)
    );
    PRINT '✅ Constraint agregado';
END
ELSE
BEGIN
    PRINT '⚠️  Constraint CK_preguntas_catalogo ya existe';
END
GO

PRINT '';
PRINT '🎉 ¡Soporte de catálogos implementado!';
PRINT '';
PRINT '✅ Funcionalidades disponibles:';
PRINT '   • Tipo de pregunta "Catalogo"';
PRINT '   • Carga dinámica desde tablas de BD';
PRINT '   • Configuración de tabla, valor y etiqueta';
PRINT '';
PRINT '💡 Ejemplo de configuración:';
PRINT '   tipo: Catalogo';
PRINT '   catalogo_tabla: comunidades';
PRINT '   catalogo_valor: id_comunidad';
PRINT '   catalogo_etiqueta: nombre';
PRINT '';
PRINT '📋 Tablas disponibles para catálogos:';
PRINT '   • cab.comunidades';
PRINT '   • cab.departamentos';
PRINT '   • cab.municipios';
PRINT '   • cab.categorias_pregunta';
PRINT '   • cab.grupos_focales';
GO
