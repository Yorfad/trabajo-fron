# Guía de Nuevas Funcionalidades - Sistema CAB

## 📋 Resumen de Cambios

Este documento describe todas las funcionalidades implementadas en el sistema CAB para el análisis filtrado de datos, visualización de semáforos y generación de reportes PDF.

---

## ✅ Correcciones Implementadas

### 1. Preguntas Condicionales
**Problema:** Error al crear encuestas con preguntas condicionales debido a referencias a IDs que aún no existen.

**Solución:** Implementación de dos pasadas en la creación:
- **Primera pasada:** Crear todas las preguntas y mapear `orden → id_pregunta`
- **Segunda pasada:** Crear opciones mapeando `condicional_pregunta_orden` al ID real

**Archivos modificados:**
- `API-REST-CAB/api/controllers/encuestas.controller.js:30-68`
- `cab/src/pages/admin/SurveyForm.jsx:234-251`

**Commit:** `3a16e94` (Backend), `a0dd6cc` (Frontend)

---

### 2. Valores Duplicados en Opciones
**Problema:** Constraint `UQ_opcion` violado por valores duplicados en opciones de preguntas.

**Solución:** Auto-generación de valores únicos a partir de etiquetas o usando `opcion_{index}`.

**Archivos modificados:**
- `cab/src/pages/admin/SurveyForm.jsx:227-232`

**Commit:** `0a9818b`

---

### 3. Keys Duplicadas en DataViewer
**Problema:** Warning de React por keys duplicadas.

**Solución:** Uso de key compuesta: `item.id || ${item.id_respuesta}-${item.preguntaId}-${idx}`

**Archivos modificados:**
- `cab/src/pages/Surveyor/DataViewer.jsx:409`

**Commit:** `0a9818b`

---

### 4. Permisos de Admin para Llenar Encuestas
**Problema:** Los usuarios admin no podían acceder a las rutas de encuestador.

**Solución:** Agregados enlaces "Llenar Encuestas" y "Ver Datos" al sidebar de admin.

**Archivos modificados:**
- `cab/src/components/layout/Sidebar.jsx:15-16`

**Commit:** `0a9818b`

---

## 🆕 Nuevas Funcionalidades

### 1. Análisis Filtrado

#### Backend: Nuevos Endpoints

**GET /api/analytics/filtered**
- **Parámetros:** `comunidad`, `vuelta`, `encuesta` (query params)
- **Retorna:**
  - Información de filtros aplicados
  - Semáforo por cada pregunta (promedio, color, respuestas)
  - Semáforo por cada categoría (promedio, color, respuestas)
  - Lista de respuestas individuales con promedio

**GET /api/analytics/response/:id**
- **Parámetro:** `id` (ID de respuesta)
- **Retorna:**
  - Información general de la respuesta
  - Todas las preguntas con respuestas agrupadas por categoría
  - Puntajes y semáforos individuales

**Archivos creados/modificados:**
- `API-REST-CAB/api/controllers/analytics.controller.js:380-650`
- `API-REST-CAB/api/routes/analytics.routes.js:168-193`

**Commit:** `9a6fc78`

---

#### Frontend: Nuevas Páginas

**FilteredAnalytics** (`/admin/analytics/filtered`)

Funcionalidades:
- 🔽 **Filtros dinámicos:**
  - Selector de comunidad (carga desde API)
  - Selector de vuelta (1-5)
  - Selector de encuesta (solo activas)

- 📊 **Semáforos por Categoría:**
  - Cards con promedio y badge de color
  - Total de respuestas por categoría

- 📝 **Semáforos por Pregunta:**
  - Tabla completa con todas las preguntas
  - Columnas: Pregunta, Categoría, Tipo, Promedio, Semáforo, Respuestas
  - Ordenadas por orden de la encuesta

- 📋 **Lista de Respuestas:**
  - Tabla con todas las boletas aplicadas
  - Columnas: Boleta, Encuestada, Edad, Encuestador, Fecha, Promedio, Semáforo
  - Botón "Ver" para cada respuesta

- 📥 **Descargar PDF:**
  - Genera reporte completo en PDF
  - Incluye todas las tablas con colores de semáforo

**ResponseDetail** (`/admin/analytics/response/:id`)

Funcionalidades:
- 📄 **Información General:**
  - Boleta, encuesta, comunidad
  - Nombre y edad de encuestada
  - Nombre del encuestador
  - Fecha y vuelta

- 📚 **Respuestas por Categoría:**
  - Agrupadas por categoría de preguntas
  - Cada pregunta muestra: texto, tipo, respuesta, puntaje, semáforo

- 📥 **Descargar PDF:**
  - Genera reporte individual de la respuesta
  - Incluye todas las preguntas y respuestas

**Archivos creados:**
- `cab/src/pages/admin/FilteredAnalytics.jsx`
- `cab/src/pages/admin/ResponseDetail.jsx`
- `cab/src/api/analytics.js` (servicios agregados)

**Commit:** `4c5edc5`

---

### 2. Generación de PDFs

#### Librería Utilizada
- **jsPDF:** Generación de documentos PDF
- **jspdf-autotable:** Tablas automáticas en PDF

#### PDFs Generados

**1. PDF de Análisis Filtrado**

Contenido:
- Página 1:
  - Título y filtros aplicados
  - Tabla de semáforos por categoría
  - Inicio de tabla de semáforos por pregunta

- Páginas siguientes:
  - Continuación de tabla de preguntas (si es necesaria)
  - Tabla de respuestas individuales

- Todas las páginas:
  - Pie de página con número de página
  - Nombre del sistema

Características:
- Colores de semáforo en las celdas (verde, amarillo, naranja, rojo)
- Nombre de archivo: `Analisis_{Comunidad}_Vuelta{N}_{timestamp}.pdf`

**2. PDF de Respuesta Individual**

Contenido:
- Información general de la respuesta
- Tablas agrupadas por categoría
- Cada tabla muestra: pregunta, tipo, respuesta, puntaje, semáforo

Características:
- Colores de semáforo en las celdas
- Nombre de archivo: `Respuesta_Boleta{N}_{timestamp}.pdf`

**Archivo creado:**
- `cab/src/utils/pdfGenerator.js`

**Commit:** `37ed6cd`

---

## 📁 Scripts SQL Necesarios

### 1. Tipo 'Catalogo' en CHECK Constraint
**Archivo:** `db/agregar_tipo_catalogo.sql`

Ejecutar si necesitas usar preguntas tipo "Catalogo":
```sql
USE cab123;
GO

ALTER TABLE cab.preguntas
DROP CONSTRAINT CK_preguntas_tipo;
GO

ALTER TABLE cab.preguntas
ADD CONSTRAINT CK_preguntas_tipo CHECK (
  tipo IN ('OpcionUnica','OpcionMultiple','Numerica','SiNo','Fecha','Texto','Catalogo')
);
GO
```

**Commit:** `0a9818b`

---

### 2. Campos Adicionales en Tabla Respuestas
**Archivo:** `db/agregar_campo_vuelta.sql`

Ejecutar si tu base de datos no tiene estos campos:
```sql
USE cab123;
GO

-- Agrega los siguientes campos si no existen:
- vuelta (INT)
- nombre_encuestada (NVARCHAR)
- edad_encuestada (INT)
- sexo_encuestador (CHAR)
- nombre_encuestador (NVARCHAR)
```

**Commit:** `e5983d5`

---

## 🚀 Cómo Usar el Sistema

### 1. Configuración Inicial

**Ejecutar Scripts SQL:**
```bash
# En SQL Server Management Studio o Azure Data Studio
# 1. Ejecutar db/agregar_campo_vuelta.sql
# 2. (Opcional) Ejecutar db/agregar_tipo_catalogo.sql
```

**Desplegar Cambios:**
- Frontend: Render desplegará automáticamente desde GitHub
- Backend: Render desplegará automáticamente desde GitHub

**Probar Localmente (Opcional):**
```bash
# Backend
cd API-REST-CAB
npm install
npm start

# Frontend
cd cab
npm install
npm run dev
```

---

### 2. Crear Encuestas con Preguntas Condicionales

1. Ir a **"📝 Crear Encuestas"**
2. Agregar preguntas normalmente
3. Para hacer una opción condicional:
   - Marcar checkbox **"🔗 Pregunta condicional"**
   - Seleccionar la pregunta que se mostrará si se elige esa opción
4. Guardar encuesta
5. ✅ Las preguntas condicionales ahora se crean sin errores

---

### 3. Llenar Encuestas

**Como Admin:**
1. Ir a **"✍️ Llenar Encuestas"** desde el sidebar
2. Seleccionar encuesta
3. Completar datos:
   - Comunidad
   - **Vuelta** (número de ronda)
   - Nombre y edad de encuestada (opcional)
4. Responder todas las preguntas
5. Enviar

**Como Encuestador:**
- Mismo proceso que admin

---

### 4. Ver Análisis Filtrado

1. Ir a **"🔍 Análisis Filtrado"** desde el sidebar de admin

2. **Seleccionar filtros:**
   - Comunidad: Ej. "Carmen"
   - Vuelta: Ej. "Vuelta 1"
   - Encuesta: Ej. "Encuesta para embarazadas"

3. Hacer clic en **"Aplicar Filtros"**

4. **Ver resultados:**
   - 📊 **Semáforos por Categoría:** Promedio por categoría con badge de color
   - 📝 **Semáforos por Pregunta:** Tabla detallada de todas las preguntas
   - 📋 **Respuestas Individuales:** Lista de todas las boletas

5. **Acciones disponibles:**
   - 👁️ **Ver:** Haz clic en "Ver" de cualquier respuesta para ver detalle completo
   - 📥 **Descargar PDF:** Genera reporte completo en PDF

---

### 5. Ver Detalle de Respuesta Individual

1. Desde **Análisis Filtrado**, hacer clic en botón **"Ver"** de una respuesta

2. **Ver información:**
   - Datos generales (boleta, comunidad, encuestador, fecha)
   - Todas las preguntas agrupadas por categoría
   - Respuestas con puntajes y semáforos

3. **Descargar PDF:**
   - Haz clic en **"Descargar PDF"** para obtener reporte individual

4. **Volver:**
   - Haz clic en **"← Volver"** para regresar al análisis filtrado

---

### 6. Descargar Reportes PDF

**PDF de Análisis Filtrado:**
- Contenido: Filtros, semáforos por categoría, semáforos por pregunta, lista de respuestas
- Nombre: `Analisis_NombreComunidad_VueltaX_timestamp.pdf`
- Uso: Reporte general para presentaciones o archivo

**PDF de Respuesta Individual:**
- Contenido: Información completa de una boleta con todas sus respuestas
- Nombre: `Respuesta_BoletaX_timestamp.pdf`
- Uso: Registro detallado de una entrevista específica

---

## 🎨 Sistema de Semáforos

### Rangos de Puntaje

| Color | Rango | Significado |
|-------|-------|-------------|
| 🟢 Verde | 8.0 - 10.0 | Excelente conocimiento |
| 🟡 Amarillo | 6.0 - 7.9 | Buen conocimiento |
| 🟠 Naranja | 4.0 - 5.9 | Conocimiento regular |
| 🔴 Rojo | 0.0 - 3.9 | Necesita mejoras urgentes |

### Cálculo de Puntajes

- **Por Pregunta:** Promedio de `puntaje_0a10` de todas las respuestas a esa pregunta
- **Por Categoría:** Promedio de `puntaje_0a10` de todas las preguntas de esa categoría
- **Por Respuesta:** Promedio de `puntaje_0a10` de todas las respuestas en una boleta

---

## 📊 Estructura de Datos

### Campo `vuelta` en Tabla `respuestas`
- **Tipo:** INT
- **Propósito:** Identificar la ronda de aplicación de la encuesta (1, 2, 3, 4, 5)
- **Uso:** Permite hacer seguimiento temporal y comparar evolución

### Tabla `respuestas_detalle`
- **puntaje_0a10:** Valor normalizado 0-10 usado para análisis
- **valor_numerico:** Valor numérico original de la respuesta
- **valor_texto:** Valor textual de la respuesta

---

## 🔐 Permisos

### Admin
- ✅ Crear y editar encuestas
- ✅ Gestionar usuarios
- ✅ **Llenar encuestas** (nuevo)
- ✅ **Ver datos** (nuevo)
- ✅ **Análisis Global** (existente)
- ✅ **Análisis Filtrado** (nuevo)

### Encuestador (Surveyor)
- ✅ Llenar encuestas
- ✅ Ver sus propios datos
- ❌ Crear encuestas
- ❌ Ver análisis filtrado

---

## 📝 Commits Realizados

| Commit | Descripción |
|--------|-------------|
| `3a16e94` | Backend: Preguntas condicionales con dos pasadas |
| `a0dd6cc` | Frontend: Enviar orden en lugar de tempId para condicionales |
| `0a9818b` | Correcciones múltiples: valores únicos, keys, permisos admin |
| `9a6fc78` | Backend: Endpoints de análisis filtrado y detalle de respuestas |
| `4c5edc5` | Frontend: Vistas de análisis filtrado y detalle |
| `e5983d5` | Script SQL para campos adicionales en respuestas |
| `37ed6cd` | Implementación completa de generación de PDFs |

---

## 🐛 Solución de Problemas

### Error: "Field vuelta does not exist"
**Solución:** Ejecutar `db/agregar_campo_vuelta.sql` en la base de datos

### Error: "CHECK constraint violated for tipo 'Catalogo'"
**Solución:** Ejecutar `db/agregar_tipo_catalogo.sql` en la base de datos

### PDFs no se generan
**Solución:** Verificar que las dependencias estén instaladas:
```bash
cd cab
npm install jspdf jspdf-autotable
```

### No aparece opción "Análisis Filtrado"
**Solución:**
1. Verificar que estás logueado como admin
2. Refrescar la página (Ctrl+F5)
3. Verificar que el despliegue de Render haya completado

---

## 📞 Soporte

Si encuentras algún problema:
1. Verificar que los scripts SQL se hayan ejecutado
2. Verificar que Render haya desplegado la última versión
3. Revisar la consola del navegador (F12) para errores
4. Revisar logs del servidor en Render

---

## 🎯 Próximos Pasos Sugeridos

- [ ] Agregar filtros adicionales (por departamento, municipio)
- [ ] Exportar a Excel además de PDF
- [ ] Gráficos interactivos en análisis filtrado
- [ ] Comparación entre vueltas en una misma vista
- [ ] Dashboard de evolución temporal

---

**Última actualización:** $(date)
**Versión del sistema:** 2.0.0
**Generado por:** Claude Code
