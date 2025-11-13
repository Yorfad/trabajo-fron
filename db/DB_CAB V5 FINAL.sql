/* =====================================================================
   DB_CAB · Esquema de Encuestas 
   ===================================================================== */

-- (1) RESETEO SEGURO (opcional): Elimina y crea limpia la BD
IF DB_ID('DB_CAB') IS NOT NULL
BEGIN
  ALTER DATABASE DB_CAB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  DROP DATABASE DB_CAB;
END
GO

CREATE DATABASE DB_CAB;
GO

USE DB_CAB;
GO

/* =====================================================================
   (2) ESQUEMA
   ===================================================================== */
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'cab')
  EXEC('CREATE SCHEMA cab');
GO


/* =====================================================================
   (3) CATÁLOGOS BASE
   ===================================================================== */

-- 3.1 Catálogo de Locks para catálogos
IF OBJECT_ID('cab.catalogo_lock','U') IS NOT NULL DROP TABLE cab.catalogo_lock;
CREATE TABLE cab.catalogo_lock (
  tabla          VARCHAR(40)  NOT NULL PRIMARY KEY,                          -- 'departamentos' | 'municipios'
  max_rows       INT          NULL,                                          -- NULL = sin tope
  locked         BIT          NOT NULL CONSTRAINT DF_catalogo_lock_locked DEFAULT (0),
  actualizado_en DATETIME2(0) NOT NULL CONSTRAINT DF_catalogo_lock_upd DEFAULT (SYSDATETIME())
);
GO

-- 3.2 Departamentos (PK manual 1..22)
IF OBJECT_ID('cab.departamentos','U') IS NOT NULL DROP TABLE cab.departamentos;
CREATE TABLE cab.departamentos (
  id_departamento  SMALLINT     NOT NULL PRIMARY KEY,                         -- PK manual (códigos oficiales)
  nombre           VARCHAR(80)  NOT NULL CONSTRAINT UQ_depto_nombre UNIQUE,
  CONSTRAINT CK_depto_nombre_notblank CHECK (LEN(LTRIM(RTRIM(nombre))) > 0)
);
GO

-- 3.3 Municipios
IF OBJECT_ID('cab.municipios','U') IS NOT NULL DROP TABLE cab.municipios;
CREATE TABLE cab.municipios (
  id_municipio     INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
  id_departamento  SMALLINT     NOT NULL
      CONSTRAINT FK_muni_depto REFERENCES cab.departamentos(id_departamento),
  nombre           VARCHAR(80)  NOT NULL,
  CONSTRAINT UQ_muni_depto_nombre UNIQUE (id_departamento, nombre),
  CONSTRAINT CK_muni_nombre_notblank CHECK (LEN(LTRIM(RTRIM(nombre))) > 0)
);
GO
CREATE INDEX IX_municipios_depto ON cab.municipios(id_departamento);
GO

-- 3.4 Comunidades
IF OBJECT_ID('cab.comunidades','U') IS NOT NULL DROP TABLE cab.comunidades;
CREATE TABLE cab.comunidades (
  id_comunidad  INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
  id_municipio  INT           NOT NULL
      CONSTRAINT FK_comu_muni REFERENCES cab.municipios(id_municipio) ON DELETE CASCADE,
  nombre        VARCHAR(120)  NOT NULL,
  area          VARCHAR(10)   NOT NULL
      CONSTRAINT CK_comu_area CHECK (area IN ('Urbana','Rural')),
  CONSTRAINT UQ_comu_muni_nombre UNIQUE (id_municipio, nombre),
  CONSTRAINT CK_comu_nombre_notblank CHECK (LEN(LTRIM(RTRIM(nombre))) > 0)
);
GO
CREATE INDEX IX_comunidades_muni ON cab.comunidades(id_municipio);
GO

-- 3.5 Grupos focales
IF OBJECT_ID('cab.grupos_focales','U') IS NOT NULL DROP TABLE cab.grupos_focales;
CREATE TABLE cab.grupos_focales (
  id_grupo_focal  TINYINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  nombre          VARCHAR(60)  NOT NULL UNIQUE
);
GO

-- 3.6 Categorías y subcategorías de preguntas
IF OBJECT_ID('cab.subcategorias_preguntas','U') IS NOT NULL DROP TABLE cab.subcategorias_preguntas;
IF OBJECT_ID('cab.categorias_preguntas','U') IS NOT NULL DROP TABLE cab.categorias_preguntas;

CREATE TABLE cab.categorias_preguntas (
  id_categoria_pregunta  TINYINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  nombre                 VARCHAR(60)  NOT NULL UNIQUE
);
GO

CREATE TABLE cab.subcategorias_preguntas (
  id_subcategoria         TINYINT IDENTITY(1,1) PRIMARY KEY,
  id_categoria_pregunta   TINYINT NOT NULL
     CONSTRAINT FK_subcat_categoria REFERENCES cab.categorias_preguntas(id_categoria_pregunta),
  nombre                  VARCHAR(60) NOT NULL,
  CONSTRAINT UQ_subcat_categoria UNIQUE(id_categoria_pregunta, nombre)
);
GO


/* =====================================================================
   (4) TRIGGERS de control para catálogos (departamentos/municipios)
   ===================================================================== */

-- Helpers: asegurar filas base en catalogo_lock
IF NOT EXISTS (SELECT 1 FROM cab.catalogo_lock WHERE tabla='departamentos')
  INSERT INTO cab.catalogo_lock(tabla, max_rows, locked) VALUES('departamentos', NULL, 0);
IF NOT EXISTS (SELECT 1 FROM cab.catalogo_lock WHERE tabla='municipios')
  INSERT INTO cab.catalogo_lock(tabla, max_rows, locked) VALUES('municipios', NULL, 0);
GO

-- Departamentos: INSERT guard
IF OBJECT_ID('cab.tg_departamentos_ins_guard','TR') IS NOT NULL DROP TRIGGER cab.tg_departamentos_ins_guard;
GO
CREATE TRIGGER cab.tg_departamentos_ins_guard
ON cab.departamentos
AFTER INSERT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @locked BIT, @max INT;
  SELECT @locked = locked, @max = max_rows
  FROM cab.catalogo_lock WITH (UPDLOCK, HOLDLOCK)
  WHERE tabla = 'departamentos';

  IF ISNULL(@locked,0)=1
  BEGIN ROLLBACK; THROW 51010, N'Altas bloqueadas para DEPARTAMENTOS (locked=1).', 1; END;

  DECLARE @total INT; SELECT @total = COUNT(*) FROM cab.departamentos WITH (UPDLOCK, HOLDLOCK);
  IF @max IS NOT NULL AND @total > @max
  BEGIN
    DECLARE @msg NVARCHAR(200) = FORMATMESSAGE(N'Se superó el máximo permitido de DEPARTAMENTOS (%d).', @max);
    ROLLBACK; THROW 51011, @msg, 1;
  END;

  UPDATE cab.catalogo_lock SET actualizado_en = SYSDATETIME() WHERE tabla='departamentos';
END;
GO

-- Departamentos: DELETE guard
IF OBJECT_ID('cab.tg_departamentos_del_guard','TR') IS NOT NULL DROP TRIGGER cab.tg_departamentos_del_guard;
GO
CREATE TRIGGER cab.tg_departamentos_del_guard
ON cab.departamentos
AFTER DELETE
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @locked BIT;
  SELECT @locked = locked FROM cab.catalogo_lock WITH (UPDLOCK, HOLDLOCK) WHERE tabla='departamentos';
  IF ISNULL(@locked,0)=1
  BEGIN ROLLBACK; THROW 51012, N'Bajas bloqueadas para DEPARTAMENTOS (locked=1).', 1; END;
  UPDATE cab.catalogo_lock SET actualizado_en = SYSDATETIME() WHERE tabla='departamentos';
END;
GO

-- Departamentos: UPDATE guard
IF OBJECT_ID('cab.tg_departamentos_upd_guard','TR') IS NOT NULL DROP TRIGGER cab.tg_departamentos_upd_guard;
GO
CREATE TRIGGER cab.tg_departamentos_upd_guard
ON cab.departamentos
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(id_departamento)
  BEGIN ROLLBACK; THROW 51013, N'No se permite actualizar id_departamento en DEPARTAMENTOS.', 1; END;

  DECLARE @locked BIT;
  SELECT @locked = locked FROM cab.catalogo_lock WITH (UPDLOCK, HOLDLOCK) WHERE tabla='departamentos';
  IF ISNULL(@locked,0)=1
  BEGIN ROLLBACK; THROW 51014, N'Cambios bloqueados para DEPARTAMENTOS (locked=1).', 1; END;

  UPDATE cab.catalogo_lock SET actualizado_en = SYSDATETIME() WHERE tabla='departamentos';
END;
GO

-- Municipios: INSERT guard
IF OBJECT_ID('cab.tg_municipios_ins_guard','TR') IS NOT NULL DROP TRIGGER cab.tg_municipios_ins_guard;
GO
CREATE TRIGGER cab.tg_municipios_ins_guard
ON cab.municipios
AFTER INSERT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @locked BIT, @max INT;
  SELECT @locked = locked, @max = max_rows
  FROM cab.catalogo_lock WITH (UPDLOCK, HOLDLOCK)
  WHERE tabla = 'municipios';

  IF ISNULL(@locked,0)=1
  BEGIN ROLLBACK; THROW 51020, N'Altas bloqueadas para MUNICIPIOS (locked=1).', 1; END;

  DECLARE @total INT; SELECT @total = COUNT(*) FROM cab.municipios WITH (UPDLOCK, HOLDLOCK);
  IF @max IS NOT NULL AND @total > @max
  BEGIN
    DECLARE @msg NVARCHAR(200) = FORMATMESSAGE(N'Se superó el máximo permitido de MUNICIPIOS (%d).', @max);
    ROLLBACK; THROW 51021, @msg, 1;
  END;

  UPDATE cab.catalogo_lock SET actualizado_en = SYSDATETIME() WHERE tabla='municipios';
END;
GO

-- Municipios: DELETE guard
IF OBJECT_ID('cab.tg_municipios_del_guard','TR') IS NOT NULL DROP TRIGGER cab.tg_municipios_del_guard;
GO
CREATE TRIGGER cab.tg_municipios_del_guard
ON cab.municipios
AFTER DELETE
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @locked BIT; SELECT @locked = locked FROM cab.catalogo_lock WITH (UPDLOCK, HOLDLOCK) WHERE tabla='municipios';
  IF ISNULL(@locked,0)=1
  BEGIN ROLLBACK; THROW 51022, N'Bajas bloqueadas para MUNICIPIOS (locked=1).', 1; END;
  UPDATE cab.catalogo_lock SET actualizado_en = SYSDATETIME() WHERE tabla='municipios';
END;
GO

-- Municipios: UPDATE guard
IF OBJECT_ID('cab.tg_municipios_upd_guard','TR') IS NOT NULL DROP TRIGGER cab.tg_municipios_upd_guard;
GO
CREATE TRIGGER cab.tg_municipios_upd_guard
ON cab.municipios
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(id_municipio)
  BEGIN ROLLBACK; THROW 51023, N'No se permite actualizar id_municipio en MUNICIPIOS.', 1; END;

  DECLARE @locked BIT; SELECT @locked = locked FROM cab.catalogo_lock WITH (UPDLOCK, HOLDLOCK) WHERE tabla='municipios';
  IF ISNULL(@locked,0)=1
  BEGIN ROLLBACK; THROW 51024, N'Cambios bloqueados para MUNICIPIOS (locked=1).', 1; END;

  UPDATE cab.catalogo_lock SET actualizado_en = SYSDATETIME() WHERE tabla='municipios';
END;
GO


/* =====================================================================
   (5) SEGURIDAD / ENCUESTAS / PREGUNTAS / RESPUESTAS
   ===================================================================== */

-- Usuarios
IF OBJECT_ID('cab.usuarios','U') IS NOT NULL DROP TABLE cab.usuarios;
CREATE TABLE cab.usuarios (
  id_usuario  BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
  nombre      VARCHAR(120)  NOT NULL,
  correo      VARCHAR(120)  NOT NULL UNIQUE,
  pass_hash   VARCHAR(255)  NOT NULL,
  rol         VARCHAR(20)   NOT NULL
               CONSTRAINT CK_usuarios_rol CHECK (rol IN ('Admin','Encuestador')),
  activo      BIT           NOT NULL CONSTRAINT DF_usuarios_activo DEFAULT (1),
  creado_en   DATETIME2(0)  NOT NULL CONSTRAINT DF_usuarios_creado DEFAULT (SYSDATETIME())
);
GO

-- Agregado nuevamente 
-- Tokens JWT emitidos (auditoría y revocación opcional)
IF OBJECT_ID('cab.tokens_jwt','U') IS NOT NULL DROP TABLE cab.tokens_jwt;
CREATE TABLE cab.tokens_jwt (
  id_token    BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
  id_usuario  BIGINT        NOT NULL
                CONSTRAINT FK_tokens_usuario REFERENCES cab.usuarios(id_usuario),
  jti         VARCHAR(255)  NOT NULL,  -- ID único del JWT
  emitido_en  DATETIME2(0)  NOT NULL CONSTRAINT DF_tokens_emitido DEFAULT (SYSDATETIME()),
  expira_en   DATETIME2(0)  NOT NULL,  -- Fecha/hora de expiración
  revocado    BIT           NOT NULL CONSTRAINT DF_tokens_revocado DEFAULT (0),
  revocado_en DATETIME2(0)  NULL,
  motivo      VARCHAR(120)  NULL,
  CONSTRAINT UQ_tokens_usuario_jti UNIQUE (id_usuario, jti)
);
GO
CREATE INDEX IX_tokens_jti ON cab.tokens_jwt(jti);
GO

-- Lista negra de tokens (revocados)
IF OBJECT_ID('cab.tokens_revocados','U') IS NOT NULL DROP TABLE cab.tokens_revocados;
CREATE TABLE cab.tokens_revocados (
  id_revocado BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
  jti         VARCHAR(255)  NOT NULL UNIQUE,
  expira_en   DATETIME2(0)  NOT NULL,
  revocado_en DATETIME2(0)  NOT NULL CONSTRAINT DF_revocado_en DEFAULT (SYSDATETIME()),
  motivo      VARCHAR(120)  NULL
);
GO
CREATE INDEX IX_tokens_revocados_jti ON cab.tokens_revocados(jti);
GO



-- Encuestas
IF OBJECT_ID('cab.encuestas','U') IS NOT NULL DROP TABLE cab.encuestas;
CREATE TABLE cab.encuestas (
  id_encuesta       BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
  titulo            VARCHAR(120)  NOT NULL,
  descripcion       VARCHAR(500)  NULL,
  id_grupo_focal    TINYINT       NOT NULL
                    CONSTRAINT FK_encuestas_grupofocal REFERENCES cab.grupos_focales(id_grupo_focal),
  version           VARCHAR(10)   NOT NULL,
  estado            VARCHAR(10)   NOT NULL
                    CONSTRAINT CK_encuestas_estado CHECK (estado IN ('Activa','Inactiva'))
                    CONSTRAINT DF_encuestas_estado DEFAULT ('Inactiva'),
  vigente_desde     DATE          NULL,
  vigente_hasta     DATE          NULL,
  creado_en         DATETIME2(0)  NOT NULL CONSTRAINT DF_encuestas_creado DEFAULT (SYSDATETIME()),
  CONSTRAINT UQ_encuestas_titulo_version UNIQUE (titulo, version)
);
GO

-- Preguntas
IF OBJECT_ID('cab.preguntas','U') IS NOT NULL DROP TABLE cab.preguntas;
CREATE TABLE cab.preguntas (
  id_pregunta           BIGINT       NOT NULL IDENTITY(1,1) PRIMARY KEY,
  id_encuesta           BIGINT       NOT NULL
      CONSTRAINT FK_preguntas_encuesta REFERENCES cab.encuestas(id_encuesta),
  id_categoria_pregunta TINYINT      NULL
      CONSTRAINT FK_preguntas_categoria REFERENCES cab.categorias_preguntas(id_categoria_pregunta),
  texto                 VARCHAR(300) NOT NULL,
  tipo                  VARCHAR(20)  NOT NULL
      CONSTRAINT CK_preguntas_tipo CHECK (
        tipo IN ('OpcionUnica','OpcionMultiple','Numerica','SiNo','Fecha','Texto')
      ),
  requerida             BIT          NOT NULL CONSTRAINT DF_preguntas_requerida DEFAULT (1),
  orden                 INT          NOT NULL,
  puntaje_maximo        INT          NOT NULL CONSTRAINT DF_preguntas_pmax DEFAULT (100),
  CONSTRAINT UQ_preguntas_encuesta_orden UNIQUE (id_encuesta, orden)
);
GO
CREATE INDEX IX_preguntas_categoria ON cab.preguntas(id_categoria_pregunta);
CREATE INDEX IX_preguntas_encuesta  ON cab.preguntas(id_encuesta, orden);
GO

-- Preguntas opciones
IF OBJECT_ID('cab.preguntas_opciones','U') IS NOT NULL DROP TABLE cab.preguntas_opciones;
CREATE TABLE cab.preguntas_opciones (
  id_opcion BIGINT IDENTITY(1,1) PRIMARY KEY,
  id_pregunta BIGINT NOT NULL
      CONSTRAINT FK_opcion_pregunta REFERENCES cab.preguntas(id_pregunta),
  etiqueta VARCHAR(200) NOT NULL,
  valor    VARCHAR(50)  NOT NULL,
  puntos   INT          NULL,
  orden    INT          NOT NULL,
  condicional BIT NOT NULL DEFAULT(0),
  condicional_pregunta_id BIGINT NULL
      CONSTRAINT FK_opcion_condicional REFERENCES cab.preguntas(id_pregunta),
  CONSTRAINT UQ_opcion UNIQUE(id_pregunta,valor)
);
GO

-- Respuestas (encabezado)
IF OBJECT_ID('cab.respuestas','U') IS NOT NULL DROP TABLE cab.respuestas;
CREATE TABLE cab.respuestas (
  id_respuesta     BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
  boleta_num       BIGINT        NOT NULL,
  id_encuesta      BIGINT        NOT NULL
                   CONSTRAINT FK_resp_encuesta    REFERENCES cab.encuestas(id_encuesta),
  id_comunidad     INT           NOT NULL
                   CONSTRAINT FK_resp_comunidad   REFERENCES cab.comunidades(id_comunidad),
  id_usuario       BIGINT        NOT NULL
                   CONSTRAINT FK_resp_usuario     REFERENCES cab.usuarios(id_usuario),
  aplicada_en      DATETIME2(0)  NOT NULL CONSTRAINT DF_respuestas_aplicada DEFAULT (SYSDATETIME()),
  estado           VARCHAR(10)   NOT NULL
                   CONSTRAINT CK_respuestas_estado CHECK (estado IN ('Enviada','Anulada'))
                   CONSTRAINT DF_respuestas_estado DEFAULT ('Enviada'),
  anulada_motivo   VARCHAR(300)  NULL,
  anulada_por      BIGINT        NULL,   -- (FK lógica a cab.usuarios)
  anulada_en       DATETIME2(0)  NULL,
  CONSTRAINT UQ_respuestas_boleta UNIQUE (boleta_num)
);
GO
CREATE INDEX IX_respuestas_encuesta_aplicada  ON cab.respuestas (id_encuesta, aplicada_en);
CREATE INDEX IX_respuestas_comunidad_aplicada ON cab.respuestas (id_comunidad, aplicada_en);
GO

-- Bitácora de respuestas
IF OBJECT_ID('cab.bitacora_respuestas','U') IS NOT NULL DROP TABLE cab.bitacora_respuestas;
CREATE TABLE cab.bitacora_respuestas (
  id_bitacora      BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
  id_respuesta     BIGINT        NOT NULL
                   CONSTRAINT FK_bitacora_respuesta REFERENCES cab.respuestas(id_respuesta) ON DELETE CASCADE,
  accion           VARCHAR(30)   NOT NULL,     -- 'CREADA','ANULADA','ACTUALIZADA',...
  detalle          VARCHAR(400)  NULL,
  id_usuario       BIGINT        NULL,
  fecha_evento     DATETIME2(0)  NOT NULL CONSTRAINT DF_bitacora_fecha DEFAULT (SYSDATETIME())
);
GO


/* =====================================================================
   (6) TRIGGERS de Respuestas (encabezado)
   ===================================================================== */

-- Transiciones de estado válidas
IF OBJECT_ID('cab.tg_respuestas_transicion','TR') IS NOT NULL DROP TRIGGER cab.tg_respuestas_transicion;
GO
CREATE TRIGGER cab.tg_respuestas_transicion
ON cab.respuestas
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT UPDATE(estado) RETURN;

  IF EXISTS (
    SELECT 1
    FROM inserted i
    JOIN deleted  d ON d.id_respuesta = i.id_respuesta
    WHERE (d.estado = 'Anulada' AND i.estado = 'Enviada')  -- No se permite volver atrás
       OR (d.estado NOT IN ('Enviada','Anulada') OR i.estado NOT IN ('Enviada','Anulada'))
  )
  BEGIN
    RAISERROR('Transición de estado no permitida.', 16, 1);
    ROLLBACK TRANSACTION; RETURN;
  END;
END;
GO

-- Prohibir edición de encabezado si ya estaba ANULADA
IF OBJECT_ID('cab.tg_respuestas_noedit_anulada','TR') IS NOT NULL DROP TRIGGER cab.tg_respuestas_noedit_anulada;
GO

CREATE TRIGGER cab.tg_respuestas_noedit_anulada
ON cab.respuestas
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF EXISTS (
    SELECT 1
    FROM inserted i
    JOIN deleted  d ON d.id_respuesta = i.id_respuesta
    WHERE d.estado = 'Anulada'
      AND (
           ISNULL(i.boleta_num,0)   <> ISNULL(d.boleta_num,0) OR
           ISNULL(i.id_encuesta,0)  <> ISNULL(d.id_encuesta,0) OR
           ISNULL(i.id_comunidad,0) <> ISNULL(d.id_comunidad,0) OR
           ISNULL(i.id_usuario,0)   <> ISNULL(d.id_usuario,0) OR
           ISNULL(i.aplicada_en,'') <> ISNULL(d.aplicada_en,'')
         )
  )
  BEGIN
    RAISERROR('No se puede editar una respuesta ANULADA.', 16, 1);
    ROLLBACK TRANSACTION; RETURN;
  END;
END;
GO

-- Bitácora: insertar CREADA
IF OBJECT_ID('cab.tg_respuestas_ins_bitacora','TR') IS NOT NULL DROP TRIGGER cab.tg_respuestas_ins_bitacora;
GO
CREATE TRIGGER cab.tg_respuestas_ins_bitacora
ON cab.respuestas
AFTER INSERT
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO cab.bitacora_respuestas (id_respuesta, accion, detalle, id_usuario)
  SELECT i.id_respuesta, 'CREADA',
         CONCAT('Boleta ', i.boleta_num, ' creada para encuesta ', i.id_encuesta),
         i.id_usuario
  FROM inserted i;
END;
GO

-- Bitácora: marcar ANULADA
IF OBJECT_ID('cab.tg_respuestas_anula_bitacora','TR') IS NOT NULL DROP TRIGGER cab.tg_respuestas_anula_bitacora;
GO
CREATE TRIGGER cab.tg_respuestas_anula_bitacora
ON cab.respuestas
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT UPDATE(estado) RETURN;

  INSERT INTO cab.bitacora_respuestas (id_respuesta, accion, detalle, id_usuario)
  SELECT i.id_respuesta, 'ANULADA',
         CONCAT('Motivo: ', ISNULL(i.anulada_motivo,'')),
         i.anulada_por
  FROM inserted i
  JOIN deleted  d ON d.id_respuesta = i.id_respuesta
  WHERE d.estado = 'Enviada' AND i.estado = 'Anulada';
END;
GO


/* =====================================================================
   (7) RESPUESTAS DETALLE + TRIGGERS de normalización
   ===================================================================== */

IF OBJECT_ID('cab.respuestas_detalle','U') IS NOT NULL DROP TABLE cab.respuestas_detalle;
CREATE TABLE cab.respuestas_detalle (
  id_respuesta_detalle  BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
  id_respuesta          BIGINT         NOT NULL
                        CONSTRAINT FK_rdet_respuesta REFERENCES cab.respuestas(id_respuesta) ON DELETE CASCADE,
  id_pregunta           BIGINT         NOT NULL
                        CONSTRAINT FK_rdet_pregunta  REFERENCES cab.preguntas(id_pregunta),
  id_opcion             BIGINT         NULL
                        CONSTRAINT FK_rdet_opcion    REFERENCES cab.preguntas_opciones(id_opcion),
  valor_numerico        DECIMAL(10,2)  NULL,
  puntos                INT            NOT NULL CONSTRAINT DF_rdet_puntos DEFAULT (0),
  puntaje_0a10          DECIMAL(5,2)   NOT NULL,
  CONSTRAINT UQ_rdet_respuesta_preg UNIQUE (id_respuesta, id_pregunta)
);
GO

-- INSTEAD OF INSERT: ajusta puntos a [0, puntaje_maximo] y calcula 0..10
IF OBJECT_ID('cab.tg_respuestas_detalle_bi','TR') IS NOT NULL DROP TRIGGER cab.tg_respuestas_detalle_bi;
GO
CREATE TRIGGER cab.tg_respuestas_detalle_bi
ON cab.respuestas_detalle
INSTEAD OF INSERT
AS
BEGIN
  SET NOCOUNT ON;

  IF EXISTS (
    SELECT 1
    FROM inserted i
    JOIN cab.preguntas_opciones o ON o.id_opcion = i.id_opcion
    WHERE i.id_opcion IS NOT NULL AND o.id_pregunta <> i.id_pregunta
  )
  BEGIN
    THROW 52001, N'id_opcion no corresponde a la id_pregunta indicada.', 1;
  END;

  INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, puntos, puntaje_0a10)
  SELECT
    i.id_respuesta,
    i.id_pregunta,
    i.id_opcion,
    i.valor_numerico,
    CASE
      WHEN COALESCE(i.puntos,0) < 0 THEN 0
      WHEN COALESCE(i.puntos,0) > p.puntaje_maximo THEN p.puntaje_maximo
      ELSE COALESCE(i.puntos,0)
    END,
    CAST(
      CASE
        WHEN NULLIF(p.puntaje_maximo,0) IS NULL THEN 0
        ELSE (CAST(
               CASE
                 WHEN COALESCE(i.puntos,0) < 0 THEN 0
                 WHEN COALESCE(i.puntos,0) > p.puntaje_maximo THEN p.puntaje_maximo
                 ELSE COALESCE(i.puntos,0)
               END AS DECIMAL(10,4)
             ) / p.puntaje_maximo) * 10.0
      END
    AS DECIMAL(5,2))
  FROM inserted i
  JOIN cab.preguntas p ON p.id_pregunta = i.id_pregunta;
END;
GO

-- AFTER UPDATE: re-calcula si cambian puntos o id_pregunta
IF OBJECT_ID('cab.tg_respuestas_detalle_bu','TR') IS NOT NULL DROP TRIGGER cab.tg_respuestas_detalle_bu;
GO
CREATE TRIGGER cab.tg_respuestas_detalle_bu
ON cab.respuestas_detalle
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT (UPDATE(puntos) OR UPDATE(id_pregunta)) RETURN;

  ;WITH C AS (
    SELECT d.id_respuesta_detalle AS id, d.puntos, d.id_pregunta
    FROM cab.respuestas_detalle d
    JOIN inserted i ON i.id_respuesta_detalle = d.id_respuesta_detalle
  )
  UPDATE d
     SET puntos =
           CASE
             WHEN C.puntos < 0 THEN 0
             WHEN C.puntos > p.puntaje_maximo THEN p.puntaje_maximo
             ELSE C.puntos
           END,
         puntaje_0a10 =
           CAST(
             CASE
               WHEN NULLIF(p.puntaje_maximo,0) IS NULL THEN 0
               ELSE (CAST(
                      CASE
                        WHEN C.puntos < 0 THEN 0
                        WHEN C.puntos > p.puntaje_maximo THEN p.puntaje_maximo
                        ELSE C.puntos
                      END AS DECIMAL(10,4)
                    ) / p.puntaje_maximo) * 10.0
             END
           AS DECIMAL(5,2))
  FROM cab.respuestas_detalle d
  JOIN C ON C.id = d.id_respuesta_detalle
  JOIN cab.preguntas p ON p.id_pregunta = C.id_pregunta;
END;
GO

-- BLOQUEO de cambios en detalle si la respuesta está ANULADA
IF OBJECT_ID('cab.tg_rdet_bloqueo_anulada','TR') IS NOT NULL DROP TRIGGER cab.tg_rdet_bloqueo_anulada;
GO
CREATE TRIGGER cab.tg_rdet_bloqueo_anulada
ON cab.respuestas_detalle
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Affected TABLE (id_respuesta BIGINT PRIMARY KEY);
  INSERT INTO @Affected(id_respuesta) SELECT id_respuesta FROM inserted
  UNION SELECT id_respuesta FROM deleted;

  IF EXISTS (
    SELECT 1
    FROM @Affected a
    JOIN cab.respuestas r ON r.id_respuesta = a.id_respuesta
    WHERE r.estado = 'Anulada'
  )
  BEGIN
    RAISERROR('No se pueden modificar detalles de una respuesta ANULADA.', 16, 1);
    ROLLBACK TRANSACTION; RETURN;
  END;
END;
GO


/* =====================================================================
   (8) VISTAS Y PROCEDIMIENTOS
   ===================================================================== */

-- Vista: solo respuestas válidas (Enviada)
IF OBJECT_ID('cab.vw_respuestas_validas','V') IS NOT NULL DROP VIEW cab.vw_respuestas_validas;
GO
CREATE VIEW cab.vw_respuestas_validas AS
SELECT * FROM cab.respuestas WHERE estado = 'Enviada';
GO

-- Vista: promedio por respuesta (0..10)
IF OBJECT_ID('cab.vw_promedio_por_respuesta','V') IS NOT NULL DROP VIEW cab.vw_promedio_por_respuesta;
GO
CREATE VIEW cab.vw_promedio_por_respuesta AS
SELECT
  r.id_respuesta,
  r.boleta_num,
  r.id_encuesta,
  CAST(AVG(rd.puntaje_0a10) AS DECIMAL(5,2)) AS promedio_0a10
FROM cab.respuestas r
JOIN cab.respuestas_detalle rd ON rd.id_respuesta = r.id_respuesta
WHERE r.estado = 'Enviada'
GROUP BY r.id_respuesta, r.boleta_num, r.id_encuesta;
GO

-- SP: anular respuesta
IF OBJECT_ID('cab.sp_anular_respuesta','P') IS NOT NULL DROP PROCEDURE cab.sp_anular_respuesta;
GO
CREATE PROCEDURE cab.sp_anular_respuesta
  @id_respuesta BIGINT,
  @motivo       VARCHAR(300),
  @anulada_por  BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE cab.respuestas
    SET estado         = 'Anulada',
        anulada_motivo = @motivo,
        anulada_por    = @anulada_por,
        anulada_en     = SYSDATETIME()
  WHERE id_respuesta = @id_respuesta AND estado = 'Enviada';

  IF @@ROWCOUNT = 0
    RAISERROR('No se pudo anular: la boleta no existe o ya está anulada.', 16, 1);
END;
GO

-- SP: promedios de una encuesta (global + por categoría)
IF OBJECT_ID('cab.sp_promedios_encuesta','P') IS NOT NULL DROP PROCEDURE cab.sp_promedios_encuesta;
GO
CREATE PROCEDURE cab.sp_promedios_encuesta
  @id_encuesta BIGINT
AS
BEGIN
  SET NOCOUNT ON;

  -- Global
  SELECT
    e.id_encuesta,
    e.titulo,
    CAST(AVG(rd.puntaje_0a10) AS DECIMAL(5,2)) AS promedio_global_0a10
  FROM cab.encuestas e
  JOIN cab.preguntas p ON p.id_encuesta = e.id_encuesta
  JOIN cab.respuestas_detalle rd ON rd.id_pregunta = p.id_pregunta
  JOIN cab.respuestas r ON r.id_respuesta = rd.id_respuesta
  WHERE e.id_encuesta = @id_encuesta AND r.id_encuesta = e.id_encuesta AND r.estado = 'Enviada'
  GROUP BY e.id_encuesta, e.titulo;

  -- Por categoría
  SELECT
    e.id_encuesta,
    cp.id_categoria_pregunta,
    COALESCE(cp.nombre, 'Sin categoría') AS categoria,
    CAST(AVG(rd.puntaje_0a10) AS DECIMAL(5,2)) AS promedio_categoria_0a10
  FROM cab.encuestas e
  JOIN cab.preguntas p ON p.id_encuesta = e.id_encuesta
  LEFT JOIN cab.categorias_preguntas cp ON cp.id_categoria_pregunta = p.id_categoria_pregunta
  JOIN cab.respuestas_detalle rd ON rd.id_pregunta = p.id_pregunta
  JOIN cab.respuestas r ON r.id_respuesta = rd.id_respuesta
  WHERE e.id_encuesta = @id_encuesta AND r.id_encuesta = e.id_encuesta AND r.estado = 'Enviada'
  GROUP BY e.id_encuesta, cp.id_categoria_pregunta, cp.nombre
  ORDER BY categoria;
END;
GO

-- SP: promedio de una boleta
IF OBJECT_ID('cab.sp_promedio_respuesta','P') IS NOT NULL DROP PROCEDURE cab.sp_promedio_respuesta;
GO
CREATE PROCEDURE cab.sp_promedio_respuesta
  @id_respuesta BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT
    r.id_respuesta,
    r.boleta_num,
    r.id_encuesta,
    CAST(AVG(rd.puntaje_0a10) AS DECIMAL(5,2)) AS promedio_0a10
  FROM cab.respuestas r
  JOIN cab.respuestas_detalle rd ON rd.id_respuesta = r.id_respuesta
  WHERE r.id_respuesta = @id_respuesta AND r.estado = 'Enviada'
  GROUP BY r.id_respuesta, r.boleta_num, r.id_encuesta;
END;
GO



-- Usuario admin con contraseña: admin123
IF NOT EXISTS (SELECT 1 FROM cab.usuarios WHERE correo='admin@cab.local')
  INSERT INTO cab.usuarios (nombre,correo,pass_hash,rol,activo)
  VALUES ('Admin CAB','admin@cab.local','$2b$10$m6M61BhGKEK7LnWP6YU8Re.z2vDyNBebwulE7D7zfiCb/1ButMKvK','Admin',1);

  select * from cab.usuarios





  -------------------------------------
  -- NUEVOS CAMBIOS SOLICITADOS
  -------------------------------------

  DROP TRIGGER IF EXISTS cab.tg_respuestas_detalle_bi;
  GO


  CREATE TRIGGER cab.tg_respuestas_detalle_bi
  ON cab.respuestas_detalle
  INSTEAD OF INSERT
  AS
  BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
      SELECT 1
      FROM inserted i
      JOIN cab.preguntas_opciones o ON o.id_opcion = i.id_opcion
      WHERE i.id_opcion IS NOT NULL AND o.id_pregunta <> i.id_pregunta
    )
    BEGIN
      THROW 52001, N'id_opcion no corresponde a la id_pregunta indicada.', 1;
    END;

    -- ✅ AHORA INCLUYE valor_texto
    INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto, puntos, puntaje_0a10)
    SELECT
      i.id_respuesta,
      i.id_pregunta,
      i.id_opcion,
      i.valor_numerico,
      i.valor_texto,  -- ✅ AGREGADO
      CASE
        WHEN COALESCE(i.puntos,0) < 0 THEN 0
        WHEN COALESCE(i.puntos,0) > p.puntaje_maximo THEN p.puntaje_maximo
        ELSE COALESCE(i.puntos,0)
      END,
      CAST(
        CASE
          WHEN NULLIF(p.puntaje_maximo,0) IS NULL THEN 0
          ELSE (CAST(
                 CASE
                   WHEN COALESCE(i.puntos,0) < 0 THEN 0
                   WHEN COALESCE(i.puntos,0) > p.puntaje_maximo THEN p.puntaje_maximo
                   ELSE COALESCE(i.puntos,0)
                 END AS DECIMAL(10,4)
               ) / p.puntaje_maximo) * 10.0
        END
      AS DECIMAL(5,2))
    FROM inserted i
    JOIN cab.preguntas p ON p.id_pregunta = i.id_pregunta;
  END;
  GO



-- OTROS CAMBIOS

-- Script corregido para soportar opciones múltiples
-- Versión 2: Compatible con todas las versiones de SQL Server

USE db_cab;
GO

PRINT '🔧 Verificando estado de la base de datos...';
GO

-- Verificar que la restricción antigua fue eliminada
IF EXISTS (
    SELECT * FROM sys.key_constraints
    WHERE name = 'UQ_rdet_respuesta_preg'
    AND parent_object_id = OBJECT_ID('cab.respuestas_detalle')
)
BEGIN
    PRINT '⚠️  La restricción UQ_rdet_respuesta_preg aún existe. Eliminando...';
    ALTER TABLE cab.respuestas_detalle
    DROP CONSTRAINT UQ_rdet_respuesta_preg;
    PRINT '✅ Restricción eliminada';
END
ELSE
BEGIN
    PRINT '✅ La restricción antigua ya fue eliminada correctamente';
END
GO

-- Limpiar índice anterior si existe
IF EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'UQ_rdet_unique_answer'
    AND object_id = OBJECT_ID('cab.respuestas_detalle')
)
BEGIN
    PRINT '🧹 Eliminando índice anterior con error...';
    DROP INDEX UQ_rdet_unique_answer ON cab.respuestas_detalle;
    PRINT '✅ Índice anterior eliminado';
END
GO

-- Crear índice no único para mejorar rendimiento de búsquedas
-- Este índice NO previene duplicados, solo mejora el rendimiento
IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_respuestas_detalle_lookup'
    AND object_id = OBJECT_ID('cab.respuestas_detalle')
)
BEGIN
    PRINT '📊 Creando índice de rendimiento...';
    CREATE NONCLUSTERED INDEX IX_respuestas_detalle_lookup
    ON cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion);
    PRINT '✅ Índice de rendimiento creado';
END
ELSE
BEGIN
    PRINT '✅ El índice de rendimiento ya existe';
END
GO

PRINT '';
PRINT '🎉 ¡Configuración completada exitosamente!';
PRINT '';
PRINT '✅ Estado final:';
PRINT '   • Restricción única antigua: ELIMINADA';
PRINT '   • Opciones múltiples por pregunta: PERMITIDAS';
PRINT '   • Índice de rendimiento: CREADO';
PRINT '';
PRINT '📝 La tabla cab.respuestas_detalle ahora permite:';
PRINT '   ✓ Múltiples opciones para preguntas de opción múltiple';
PRINT '   ✓ Múltiples respuestas con el mismo id_respuesta + id_pregunta';
PRINT '';
PRINT '🧪 Listo para probar el guardado de encuestas con opciones múltiples';
GO



-- ALTER

/* =====================================================================
   SCRIPT: Agregar campos de persona encuestada a tabla respuestas
   FECHA: 2025-11-12
   DESCRIPCIÓN: Agrega columnas para almacenar información de la persona
                encuestada y el sexo del encuestador
   ===================================================================== */

PRINT '🔧 Iniciando modificación de tabla cab.respuestas...';
PRINT '';

-- Verificar que la tabla existe
IF OBJECT_ID('cab.respuestas', 'U') IS NULL
BEGIN
    PRINT '❌ ERROR: La tabla cab.respuestas no existe';
    RETURN;
END
GO

-- 1. Agregar columna nombre_encuestada
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.respuestas')
    AND name = 'nombre_encuestada'
)
BEGIN
    PRINT '📝 Agregando columna: nombre_encuestada...';
    ALTER TABLE cab.respuestas
    ADD nombre_encuestada NVARCHAR(200) NULL;
    PRINT '✅ Columna nombre_encuestada agregada';
END
ELSE
BEGIN
    PRINT '⚠️  La columna nombre_encuestada ya existe';
END
GO

-- 2. Agregar columna edad_encuestada
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.respuestas')
    AND name = 'edad_encuestada'
)
BEGIN
    PRINT '📝 Agregando columna: edad_encuestada...';
    ALTER TABLE cab.respuestas
    ADD edad_encuestada INT NULL
        CONSTRAINT CK_respuestas_edad CHECK (edad_encuestada >= 0 AND edad_encuestada <= 150);
    PRINT '✅ Columna edad_encuestada agregada (validación: 0-150 años)';
END
ELSE
BEGIN
    PRINT '⚠️  La columna edad_encuestada ya existe';
END
GO

-- 3. Agregar columna sexo_encuestador
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.respuestas')
    AND name = 'sexo_encuestador'
)
BEGIN
    PRINT '📝 Agregando columna: sexo_encuestador...';
    ALTER TABLE cab.respuestas
    ADD sexo_encuestador CHAR(1) NULL
        CONSTRAINT CK_respuestas_sexo CHECK (sexo_encuestador IN ('F', 'M'));
    PRINT '✅ Columna sexo_encuestador agregada (validación: F o M)';
END
ELSE
BEGIN
    PRINT '⚠️  La columna sexo_encuestador ya existe';
END
GO

PRINT '';
PRINT '🎉 ¡Modificación completada exitosamente!';
PRINT '';
PRINT '✅ Nuevas columnas en cab.respuestas:';
PRINT '   • nombre_encuestada  : NVARCHAR(200) - Nombre de la mujer encuestada';
PRINT '   • edad_encuestada    : INT (0-150)   - Edad de la encuestada';
PRINT '   • sexo_encuestador   : CHAR(1) (F/M) - Sexo del encuestador';
PRINT '';
PRINT '📋 Estructura actualizada de la tabla:';

-- Mostrar estructura actual de la tabla
SELECT
    COLUMN_NAME AS 'Columna',
    DATA_TYPE AS 'Tipo',
    CHARACTER_MAXIMUM_LENGTH AS 'Longitud',
    IS_NULLABLE AS 'Permite NULL'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'cab'
  AND TABLE_NAME = 'respuestas'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '🔍 Verificando restricciones (CHECK constraints):';
SELECT
    c.name AS 'Restricción',
    cc.definition AS 'Definición'
FROM sys.check_constraints c
JOIN sys.columns cc ON 1=1
WHERE c.parent_object_id = OBJECT_ID('cab.respuestas')
  AND c.name LIKE '%edad%' OR c.name LIKE '%sexo%';
GO

PRINT '';
PRINT '✅ La base de datos está lista para recibir los nuevos campos';
PRINT '📝 Próximos pasos:';
PRINT '   1. Actualizar el backend (Node.js) para:';
PRINT '      • Recibir estos campos en POST /respuestas';
PRINT '      • Guardarlos en la tabla cab.respuestas';
PRINT '      • Devolverlos en GET /respuestas';
PRINT '   2. El frontend ya está listo para enviar y mostrar estos datos';
PRINT '';


-- Verificar si la columna ya existe antes de agregarla
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.respuestas_detalle')
    AND name = 'valor_texto'
)
BEGIN
    ALTER TABLE cab.respuestas_detalle
    ADD valor_texto NVARCHAR(MAX) NULL;

    PRINT 'Columna valor_texto agregada exitosamente a cab.respuestas_detalle';
END
ELSE
BEGIN
    PRINT 'La columna valor_texto ya existe en cab.respuestas_detalle';
END
GO


/* =====================================================================
   SCRIPT: Agregar campos de persona encuestada a tabla respuestas
   FECHA: 2025-11-12
   DESCRIPCIÓN: Agrega columnas para almacenar información de la persona
                encuestada y el sexo del encuestador
   ===================================================================== */

USE DB_CAB;
GO

PRINT '🔧 Iniciando modificación de tabla cab.respuestas...';
PRINT '';

-- Verificar que la tabla existe
IF OBJECT_ID('cab.respuestas', 'U') IS NULL
BEGIN
    PRINT '❌ ERROR: La tabla cab.respuestas no existe';
    RETURN;
END
GO

-- 1. Agregar columna nombre_encuestada
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.respuestas')
    AND name = 'nombre_encuestada'
)
BEGIN
    PRINT '📝 Agregando columna: nombre_encuestada...';
    ALTER TABLE cab.respuestas
    ADD nombre_encuestada NVARCHAR(200) NULL;
    PRINT '✅ Columna nombre_encuestada agregada';
END
ELSE
BEGIN
    PRINT '⚠  La columna nombre_encuestada ya existe';
END
GO

-- 2. Agregar columna edad_encuestada
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.respuestas')
    AND name = 'edad_encuestada'
)
BEGIN
    PRINT '📝 Agregando columna: edad_encuestada...';
    ALTER TABLE cab.respuestas
    ADD edad_encuestada INT NULL
        CONSTRAINT CK_respuestas_edad CHECK (edad_encuestada >= 0 AND edad_encuestada <= 150);
    PRINT '✅ Columna edad_encuestada agregada (validación: 0-150 años)';
END
ELSE
BEGIN
    PRINT '⚠  La columna edad_encuestada ya existe';
END
GO

-- 3. Agregar columna sexo_encuestador
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('cab.respuestas')
    AND name = 'sexo_encuestador'
)
BEGIN
    PRINT '📝 Agregando columna: sexo_encuestador...';
    ALTER TABLE cab.respuestas
    ADD sexo_encuestador CHAR(1) NULL
        CONSTRAINT CK_respuestas_sexo CHECK (sexo_encuestador IN ('F', 'M'));
    PRINT '✅ Columna sexo_encuestador agregada (validación: F o M)';
END
ELSE
BEGIN
    PRINT '⚠  La columna sexo_encuestador ya existe';
END
GO

PRINT '';
PRINT '🎉 ¡Modificación completada exitosamente!';
PRINT '';
PRINT '✅ Nuevas columnas en cab.respuestas:';
PRINT '   • nombre_encuestada  : NVARCHAR(200) - Nombre de la mujer encuestada';
PRINT '   • edad_encuestada    : INT (0-150)   - Edad de la encuestada';
PRINT '   • sexo_encuestador   : CHAR(1) (F/M) - Sexo del encuestador';
PRINT '';
PRINT '📋 Estructura actualizada de la tabla:';

-- Mostrar estructura actual de la tabla
SELECT
    COLUMN_NAME AS 'Columna',
    DATA_TYPE AS 'Tipo',
    CHARACTER_MAXIMUM_LENGTH AS 'Longitud',
    IS_NULLABLE AS 'Permite NULL'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'cab'
  AND TABLE_NAME = 'respuestas'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '🔍 Verificando restricciones (CHECK constraints):';
SELECT
    c.name AS 'Restricción',
    cc.definition AS 'Definición'
FROM sys.check_constraints c
JOIN sys.columns cc ON 1=1
WHERE c.parent_object_id = OBJECT_ID('cab.respuestas')
  AND c.name LIKE '%edad%' OR c.name LIKE '%sexo%';
GO

PRINT '';
PRINT '✅ La base de datos está lista para recibir los nuevos campos';
PRINT '📝 Próximos pasos:';
PRINT '   1. Actualizar el backend (Node.js) para:';
PRINT '      • Recibir estos campos en POST /respuestas';
PRINT '      • Guardarlos en la tabla cab.respuestas';
PRINT '      • Devolverlos en GET /respuestas';
PRINT '   2. El frontend ya está listo para enviar y mostrar estos datos';
PRINT '';

-- =====================================================================
-- INSERCIÓN DE PRUEBA: Encuesta Madre de niño/a de 6 a 24 meses
-- Basada en la encuesta física del PDF
-- =====================================================================

USE db_cab;
GO

-- Obtener IDs necesarios
DECLARE @id_encuesta_6a24 BIGINT;
DECLARE @id_comunidad INT;
DECLARE @id_usuario BIGINT;
DECLARE @boleta_num BIGINT = 2000001; -- Número de boleta de prueba

-- Obtener la encuesta (asumiendo que ya existe una con este título)
SELECT @id_encuesta_6a24 = id_encuesta
FROM cab.encuestas
WHERE titulo LIKE '%6%24%meses%' OR titulo LIKE '%Nutrición%';

-- Si no existe, usar la primera encuesta disponible
IF @id_encuesta_6a24 IS NULL
BEGIN
    SELECT TOP 1 @id_encuesta_6a24 = id_encuesta FROM cab.encuestas WHERE estado = 'Activa';
END

-- Obtener una comunidad de prueba
SELECT TOP 1 @id_comunidad = id_comunidad FROM cab.comunidades;

-- Obtener un usuario de prueba
SELECT TOP 1 @id_usuario = id_usuario FROM cab.usuarios WHERE rol = 'Encuestador' OR rol = 'Admin';

PRINT '==================================================';
PRINT 'Insertando respuesta de prueba para encuesta 6-24 meses';
PRINT 'Boleta: ' + CAST(@boleta_num AS VARCHAR);
PRINT 'Encuesta ID: ' + CAST(@id_encuesta_6a24 AS VARCHAR);
PRINT 'Comunidad ID: ' + CAST(@id_comunidad AS VARCHAR);
PRINT 'Usuario ID: ' + CAST(@id_usuario AS VARCHAR);
PRINT '==================================================';

-- Insertar el encabezado de la respuesta
IF NOT EXISTS (SELECT 1 FROM cab.respuestas WHERE boleta_num = @boleta_num)
BEGIN
    INSERT INTO cab.respuestas (boleta_num, id_encuesta, id_comunidad, id_usuario, estado)
    VALUES (@boleta_num, @id_encuesta_6a24, @id_comunidad, @id_usuario, 'Enviada');

    PRINT '✓ Encabezado de respuesta insertado';
END
ELSE
BEGIN
    PRINT '⚠ La boleta ya existe, saltando inserción';
    GOTO FIN;
END

DECLARE @id_respuesta BIGINT = (SELECT id_respuesta FROM cab.respuestas WHERE boleta_num = @boleta_num);

-- =====================================================================
-- SECCIÓN 1: HIGIENE BÁSICA
-- =====================================================================

-- Pregunta: ¿Cuándo hay que lavarse las manos? (OpcionMultiple)
-- Respuestas seleccionadas: Antes de comer, Antes de cocinar, Después de cambiar pañales, Cuando las tiene sucias

DECLARE @p_lavarse_manos BIGINT;
SELECT @p_lavarse_manos = id_pregunta
FROM cab.preguntas
WHERE id_encuesta = @id_encuesta_6a24 AND texto LIKE '%lavarse%manos%';

IF @p_lavarse_manos IS NOT NULL
BEGIN
    -- Antes de comer
    DECLARE @op_antes_comer BIGINT;
    SELECT @op_antes_comer = id_opcion FROM cab.preguntas_opciones
    WHERE id_pregunta = @p_lavarse_manos AND etiqueta LIKE '%Antes de comer%';

    IF @op_antes_comer IS NOT NULL
        INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto)
        VALUES (@id_respuesta, @p_lavarse_manos, @op_antes_comer, NULL, NULL);

    -- Antes de cocinar
    DECLARE @op_antes_cocinar BIGINT;
    SELECT @op_antes_cocinar = id_opcion FROM cab.preguntas_opciones
    WHERE id_pregunta = @p_lavarse_manos AND etiqueta LIKE '%Antes de cocinar%';

    IF @op_antes_cocinar IS NOT NULL
        INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto)
        VALUES (@id_respuesta, @p_lavarse_manos, @op_antes_cocinar, NULL, NULL);

    -- Después de cambiar pañales
    DECLARE @op_cambiar_panales BIGINT;
    SELECT @op_cambiar_panales = id_opcion FROM cab.preguntas_opciones
    WHERE id_pregunta = @p_lavarse_manos AND etiqueta LIKE '%cambiar pañales%';

    IF @op_cambiar_panales IS NOT NULL
        INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto)
        VALUES (@id_respuesta, @p_lavarse_manos, @op_cambiar_panales, NULL, NULL);

    PRINT '✓ Respuestas de Lavarse las manos insertadas';
END

-- =====================================================================
-- SECCIÓN 2: AGUA Y ENFERMEDADES
-- =====================================================================

-- Pregunta: ¿Sabe usted si el agua para beber, que no ha sido desinfectada, puede provocar enfermedades?
DECLARE @p_agua_enfermedades BIGINT;
SELECT @p_agua_enfermedades = id_pregunta
FROM cab.preguntas
WHERE id_encuesta = @id_encuesta_6a24 AND texto LIKE '%agua%desinfectada%enfermedades%';

IF @p_agua_enfermedades IS NOT NULL
BEGIN
    INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto)
    VALUES (@id_respuesta, @p_agua_enfermedades, NULL, 1, NULL); -- 1 = Sí

    PRINT '✓ Respuesta Agua y enfermedades insertada';
END

-- Pregunta: ¿Qué enfermedades puede provocar esta agua? (Texto libre)
DECLARE @p_que_enfermedades BIGINT;
SELECT @p_que_enfermedades = id_pregunta
FROM cab.preguntas
WHERE id_encuesta = @id_encuesta_6a24 AND texto LIKE '%enfermedades puede provocar%agua%' AND tipo = 'Texto';

IF @p_que_enfermedades IS NOT NULL
BEGIN
    INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto)
    VALUES (@id_respuesta, @p_que_enfermedades, NULL, NULL, 'Diarrea, dolor de estomago, infección estomacal');

    PRINT '✓ Respuesta Qué enfermedades (texto) insertada';
END

-- =====================================================================
-- SECCIÓN 3: PURIFICACIÓN DEL AGUA
-- =====================================================================

-- Pregunta: ¿Cuáles métodos de desinfección del agua utilizan en su casa?
DECLARE @p_metodos_agua BIGINT;
SELECT @p_metodos_agua = id_pregunta
FROM cab.preguntas
WHERE id_encuesta = @id_encuesta_6a24 AND texto LIKE '%métodos%desinfección%agua%';

IF @p_metodos_agua IS NOT NULL
BEGIN
    -- Hervir el agua
    DECLARE @op_hervir BIGINT;
    SELECT @op_hervir = id_opcion FROM cab.preguntas_opciones
    WHERE id_pregunta = @p_metodos_agua AND etiqueta LIKE '%Hervir%';

    IF @op_hervir IS NOT NULL
        INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto)
        VALUES (@id_respuesta, @p_metodos_agua, @op_hervir, NULL, NULL);

    -- Agua embotellada
    DECLARE @op_embotellada BIGINT;
    SELECT @op_embotellada = id_opcion FROM cab.preguntas_opciones
    WHERE id_pregunta = @p_metodos_agua AND etiqueta LIKE '%embotellada%';

    IF @op_embotellada IS NOT NULL
        INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto)
        VALUES (@id_respuesta, @p_metodos_agua, @op_embotellada, NULL, NULL);

    PRINT '✓ Respuestas Métodos de desinfección insertadas';
END

-- =====================================================================
-- SECCIÓN 4: LACTANCIA MATERNA
-- =====================================================================

-- Pregunta: ¿Al cuanto tiempo de nacido le dio pecho a su hijo menor?
DECLARE @p_tiempo_lactancia BIGINT;
SELECT @p_tiempo_lactancia = id_pregunta
FROM cab.preguntas
WHERE id_encuesta = @id_encuesta_6a24 AND texto LIKE '%tiempo%nacido%pecho%';

IF @p_tiempo_lactancia IS NOT NULL
BEGIN
    DECLARE @op_1hora BIGINT;
    SELECT @op_1hora = id_opcion FROM cab.preguntas_opciones
    WHERE id_pregunta = @p_tiempo_lactancia AND etiqueta LIKE '%1 hora%';

    IF @op_1hora IS NOT NULL
        INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto)
        VALUES (@id_respuesta, @p_tiempo_lactancia, @op_1hora, NULL, NULL);

    PRINT '✓ Respuesta Lactancia materna insertada';
END

-- =====================================================================
-- SECCIÓN 5: CONTROL PEDIÁTRICO
-- =====================================================================

-- Pregunta: ¿Usted lleva a su hijo/a al servicios de salud para control de peso y talla?
DECLARE @p_control_pediatrico BIGINT;
SELECT @p_control_pediatrico = id_pregunta
FROM cab.preguntas
WHERE id_encuesta = @id_encuesta_6a24 AND texto LIKE '%servicios de salud%control%peso%talla%';

IF @p_control_pediatrico IS NOT NULL
BEGIN
    INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto)
    VALUES (@id_respuesta, @p_control_pediatrico, NULL, 1, NULL); -- 1 = Sí

    PRINT '✓ Respuesta Control pediátrico insertada';
END

-- Pregunta: Edad en meses de su hijo/a (numérica)
DECLARE @p_edad_meses BIGINT;
SELECT @p_edad_meses = id_pregunta
FROM cab.preguntas
WHERE id_encuesta = @id_encuesta_6a24 AND texto LIKE '%edad%meses%hijo%' AND tipo = 'Numerica';

IF @p_edad_meses IS NOT NULL
BEGIN
    INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto)
    VALUES (@id_respuesta, @p_edad_meses, NULL, 12, NULL); -- 12 meses

    PRINT '✓ Edad del niño/a insertada';
END

-- =====================================================================
-- SECCIÓN 6: PREVENCIÓN DE VIOLENCIA
-- =====================================================================

-- Pregunta: ¿Conoce que tipo de violencia pueden sufrir los niños/as en el hogar?
DECLARE @p_conoce_violencia BIGINT;
SELECT @p_conoce_violencia = id_pregunta
FROM cab.preguntas
WHERE id_encuesta = @id_encuesta_6a24 AND texto LIKE '%Conoce%violencia%niños%hogar%';

IF @p_conoce_violencia IS NOT NULL
BEGIN
    INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto)
    VALUES (@id_respuesta, @p_conoce_violencia, NULL, 0, NULL); -- 0 = No

    PRINT '✓ Respuesta Prevención de violencia insertada';
END

FIN:
PRINT '==================================================';
PRINT 'Inserción de prueba completada';
PRINT '==================================================';

