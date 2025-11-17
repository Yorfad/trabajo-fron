# Instrucciones para Insertar Datos de Encuesta

## Problema Resuelto

El error **"invalid column name 'promedio_0a10'"** ha sido corregido. El problema era que el script intentaba insertar en columnas que no existían en la tabla `cab.respuestas`.

## Cambios Realizados

### 1. Script Python Corregido (`generate_sql_fixed.py`)
- ✅ Eliminado `promedio_0a10` (no es una columna, es una vista calculada)
- ✅ Cambiado `fecha_aplicada` → `aplicada_en`
- ✅ Agregado `id_usuario` (campo requerido)
- ✅ SQL regenerado correctamente

### 2. Nuevo Archivo SQL Corregido
El archivo `INSERTAR_DATOS_ENCUESTA.sql` ahora usa las columnas correctas.

---

## ⚠️ PASOS PARA EJECUTAR (ORDEN IMPORTANTE)

### Paso 1: Agregar Columnas a la Tabla (PRIMERO)
El dueño de la base de datos debe ejecutar:

```
01_AGREGAR_COLUMNAS_RESPUESTAS.sql
```

Este script agrega 3 columnas nuevas a la tabla `cab.respuestas`:
- `nombre_encuestada` (NVARCHAR(200))
- `edad_encuestada` (INT, validación 0-150)
- `sexo_encuestador` (CHAR(1), F o M)

**Nota:** Si las columnas ya existen, el script las detecta y no hace nada (es seguro ejecutarlo).

### Paso 2: Insertar los Datos de las Encuestas (DESPUÉS)
Una vez ejecutado el Paso 1, ejecutar:

```
INSERTAR_DATOS_ENCUESTA.sql
```

Este script insertará:
- Datos geográficos (Departamento, Municipio, Comunidad)
- 2 usuarios encuestadores (Gabriel Martinez, Arleth López)
- 1 encuesta principal con 33 preguntas
- 40 respuestas completas

---

## Estructura Corregida del INSERT

**ANTES (con error):**
```sql
INSERT INTO cab.respuestas (
    id_encuesta,
    boleta_num,
    id_comunidad,
    nombre_encuestada,
    edad_encuestada,
    sexo_encuestador,
    fecha_aplicada,        -- ❌ No existe
    estado,
    promedio_0a10          -- ❌ No existe
)
```

**DESPUÉS (corregido):**
```sql
INSERT INTO cab.respuestas (
    id_encuesta,
    boleta_num,
    id_comunidad,
    id_usuario,            -- ✅ Agregado (requerido)
    nombre_encuestada,     -- ✅ Existe (después del Paso 1)
    edad_encuestada,       -- ✅ Existe (después del Paso 1)
    sexo_encuestador,      -- ✅ Existe (después del Paso 1)
    aplicada_en,           -- ✅ Nombre correcto
    estado
)
```

---

## Nota sobre el Promedio

El `promedio_0a10` NO es una columna física de la tabla. Es una **vista calculada** (`cab.vw_promedio_por_respuesta`) que automáticamente calcula el promedio basado en los puntajes del detalle de respuestas.

Para obtener el promedio de una respuesta, usar:
```sql
SELECT * FROM cab.vw_promedio_por_respuesta WHERE id_respuesta = X;
```

---

## Archivos Importantes

1. **01_AGREGAR_COLUMNAS_RESPUESTAS.sql** - Ejecutar PRIMERO
2. **INSERTAR_DATOS_ENCUESTA.sql** - Ejecutar DESPUÉS
3. **generate_sql_fixed.py** - Script Python corregido (por si necesitas regenerar)

---

## Contacto

Si hay algún problema adicional, contactar al administrador del sistema.
