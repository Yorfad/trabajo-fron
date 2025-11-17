# ERRORES ENCONTRADOS Y SOLUCIONES

## Resumen Ejecutivo

He identificado múltiples problemas en tu sistema que explican por qué:
1. ❌ **El dashboard de analítica no carga datos**
2. ❌ **Solo puedes crear preguntas de Opción Única**
3. ❌ **Las encuestas creadas aparecen inactivas**

---

## PROBLEMA 1: Frontend - Solo permite crear preguntas "Opción Única" ⚠️⚠️⚠️

### Ubicación
`cab/src/pages/admin/SurveyForm.jsx` líneas 391-396

### Problema
Los tipos de pregunta están comentados en el código:
```jsx
<option value="OpcionUnica">Opción Única</option>
{/* <option value="OpcionMultiple">Opción Múltiple</option> */}
{/* <option value="Numerica">Numérica</option> */}
{/* <option value="Texto">Texto Abierto</option> */}
```

### Impacto
- Solo se pueden crear preguntas de tipo "Opción Única"
- No se pueden crear preguntas numéricas, de texto libre, Sí/No, ni Fecha
- No se pueden crear preguntas de opción múltiple

### Solución
Descomentar las opciones y agregar los tipos faltantes:
```jsx
<option value="OpcionUnica">Opción Única</option>
<option value="OpcionMultiple">Opción Múltiple</option>
<option value="Numerica">Numérica</option>
<option value="SiNo">Sí/No</option>
<option value="Texto">Texto Abierto</option>
<option value="Fecha">Fecha</option>
```

---

## PROBLEMA 2: API - Analytics intenta acceder a columna inexistente ⚠️⚠️⚠️

### Ubicación
`API-REST-CAB/api/controllers/analytics.controller.js` múltiples líneas

### Problema
El código intenta acceder a `r.promedio_0a10` directamente de la tabla `cab.respuestas`:
```javascript
// Línea 44, 140, 239, 340
AVG(r.promedio_0a10) as promedio_general
```

**PERO** `promedio_0a10` NO EXISTE en la tabla `respuestas`. Es una vista calculada.

### Impacto
- ❌ El dashboard de analítica NO CARGA DATOS (error SQL)
- ❌ Todas las consultas de analytics fallan
- ❌ No se pueden ver estadísticas globales

### Solución
Hay 2 opciones:

#### Opción A: Usar JOIN con la vista calculada
```sql
SELECT ...
FROM cab.respuestas r
LEFT JOIN cab.vw_promedio_por_respuesta vpr ON r.id_respuesta = vpr.id_respuesta
...
AVG(vpr.promedio_0a10) as promedio_general
```

#### Opción B: Calcular el promedio directamente (más eficiente)
```sql
SELECT
  AVG(rd.puntaje_0a10) as promedio_general
FROM cab.respuestas r
INNER JOIN cab.respuestas_detalle rd ON r.id_respuesta = rd.id_respuesta
WHERE r.estado = 'Enviada'
```

---

## PROBLEMA 3: API - Sintaxis SQL incompatible con SQL Server

### Ubicación
`API-REST-CAB/api/controllers/analytics.controller.js` línea 352

### Problema
```sql
ORDER BY promedio_general DESC NULLS LAST
```

`NULLS LAST` NO es soportado por SQL Server (es sintaxis de PostgreSQL)

### Impacto
- Error en consulta `getAllCommunitiesStats`

### Solución
```sql
ORDER BY CASE WHEN promedio_general IS NULL THEN 1 ELSE 0 END, promedio_general DESC
```

---

## PROBLEMA 4: API - Intentainternal insertar columna que no existe

### Ubicación
`API-REST-CAB/api/controllers/respuestas.controller.js` línea 115

### Problema
```javascript
INSERT INTO cab.respuestas_detalle (id_respuesta, id_pregunta, id_opcion, valor_numerico, valor_texto)
```

La columna `valor_texto` NO existe en `cab.respuestas_detalle`

### Estructura actual de respuestas_detalle
```sql
CREATE TABLE cab.respuestas_detalle (
  id_respuesta_detalle  BIGINT
  id_respuesta          BIGINT
  id_pregunta           BIGINT
  id_opcion             BIGINT (para OpcionUnica/OpcionMultiple)
  valor_numerico        DECIMAL(10,2) (para Numerica)
  puntos                INT
  puntaje_0a10          DECIMAL(5,2)
)
```

**FALTA**: No hay forma de guardar respuestas de tipo `Texto`, `Fecha`, o `SiNo`

### Impacto
- No se pueden enviar respuestas de preguntas tipo Texto o Fecha

### Solución
Agregar columna `valor_texto` a la tabla:
```sql
ALTER TABLE cab.respuestas_detalle
ADD valor_texto NVARCHAR(MAX) NULL;
```

---

## PROBLEMA 5: Encuestas creadas aparecen "Inactivas" ⚠️

### Ubicación
`API-REST-CAB/api/controllers/encuestas.controller.js` línea 26

### Problema
Cuando se crea una encuesta, el código establece el estado como `'Inactiva'`:
```javascript
INSERT INTO cab.encuestas (..., estado) VALUES (..., 'Inactiva');
```

### Impacto
- Las encuestas recién creadas NO aparecen en las listas para encuestadores
- Hay que activarlas manualmente desde el admin

### Solución
Hay 2 enfoques:

#### Opción A: Cambiar el comportamiento por defecto
```javascript
// Línea 26 - Crear como Activa por defecto
VALUES (..., 'Activa');
```

#### Opción B: Mantener Inactiva pero notificar al usuario
Mostrar un mensaje después de crear:
*"Encuesta creada exitosamente. Recuerda activarla para que esté disponible."*

---

## PROBLEMA 6: Estructura de datos - Falta distinción Valor vs Puntaje ✅

### Análisis
**BUENAS NOTICIAS**: La estructura de la BD YA tiene lo que necesitas

La tabla `preguntas_opciones` tiene:
- `etiqueta` - El texto que ve el usuario
- `valor` - El valor para análisis/filtros (LO QUE NECESITAS!)
- `puntos` - El puntaje que otorga

### Ejemplo de uso correcto:
```sql
-- Pregunta: "¿Qué es para usted la discapacidad?"
INSERT INTO preguntas_opciones (id_pregunta, etiqueta, valor, puntos, orden)
VALUES
  (X, 'Es cuando un niño no puede caminar', 'habilidades_motoras', 1, 1),
  (X, 'Cuando partes del cuerpo son diferentes', 'deformaciones_fisicas', 1, 2),
  (X, 'Cuando un niño no habla y no pone atención', 'falta_raciocinio', 1, 3);
```

Luego puedes filtrar por `valor` en tus análisis:
```sql
SELECT valor, COUNT(*) as total
FROM respuestas_detalle rd
JOIN preguntas_opciones po ON rd.id_opcion = po.id_opcion
WHERE po.valor IN ('habilidades_motoras', 'falta_raciocinio')
GROUP BY valor
```

**Conclusión**: La estructura de la BD está BIEN diseñada. Solo hay que usarla correctamente.

---

## PRIORIDADES DE CORRECCIÓN

### 🔴 **URGENTE** (Impiden funcionamiento básico)
1. **Frontend SurveyForm.jsx** - Descomentar tipos de pregunta
2. **API analytics.controller.js** - Arreglar queries de promedio_0a10
3. **DB respuestas_detalle** - Agregar columna valor_texto

### 🟡 **IMPORTANTE** (Mejoran experiencia)
4. **API analytics.controller.js** - Arreglar NULLS LAST
5. **API encuestas.controller.js** - Cambiar estado inicial a Activa (opcional)

### 🟢 **MEJORAS** (Pueden esperar)
6. Documentación de cómo usar `valor` vs `puntos` correctamente

---

## SIGUIENTE PASO RECOMENDADO

¿Quieres que corrija estos errores en el orden de prioridad? Podemos:
1. Primero arreglar el frontend (SurveyForm.jsx)
2. Luego arreglar la API (analytics y respuestas)
3. Finalmente ajustar la BD si es necesario

¿Por dónde empezamos?
