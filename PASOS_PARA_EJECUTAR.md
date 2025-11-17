# 🚀 PASOS PARA EJECUTAR TODAS LAS CORRECCIONES

**Fecha**: 2025-11-16
**Estado**: Listo para ejecutar

---

## ✅ RESUMEN DE LO QUE SE HA ARREGLADO

### FASE 1: Errores Críticos (COMPLETADO)
1. ✅ Frontend habilitado para todos los tipos de pregunta
2. ✅ API Analytics corregida para usar puntajes correctos
3. ✅ API Respuestas preparada para múltiples tipos
4. ✅ Scripts SQL creados para modificar BD

### FASE 2: Funcionalidades Avanzadas (COMPLETADO)
5. ✅ Selección múltiple con puntaje fraccionario implementada
6. ✅ Frontend con checkboxes funcionales
7. ✅ Trigger de BD actualizado para cálculo correcto

---

## 📋 PASOS A SEGUIR (EN ORDEN EXACTO)

### PASO 1: Ejecutar Scripts SQL en la Base de Datos

**IMPORTANTE**: Estos scripts DEBEN ejecutarse en la base de datos ANTES de usar la aplicación.

Ejecutar en SQL Server Management Studio (o tu cliente SQL) **EN ESTE ORDEN**:

#### 1.1. Agregar columnas a tabla `respuestas`
```sql
-- Archivo: 01_AGREGAR_COLUMNAS_RESPUESTAS.sql
-- Agrega: nombre_encuestada, edad_encuestada, sexo_encuestador
```
**Ejecutar**: `01_AGREGAR_COLUMNAS_RESPUESTAS.sql`

#### 1.2. Agregar columna valor_texto a `respuestas_detalle`
```sql
-- Archivo: 02_AGREGAR_VALOR_TEXTO_RESPUESTAS_DETALLE.sql
-- Agrega: valor_texto para respuestas tipo Texto/Fecha
```
**Ejecutar**: `02_AGREGAR_VALOR_TEXTO_RESPUESTAS_DETALLE.sql`

#### 1.3. Modificar constraint para permitir selección múltiple
```sql
-- Archivo: 03_MODIFICAR_RESPUESTAS_DETALLE_MULTIPLES_OPCIONES.sql
-- Permite múltiples opciones por pregunta (OpcionMultiple)
```
**Ejecutar**: `03_MODIFICAR_RESPUESTAS_DETALLE_MULTIPLES_OPCIONES.sql`

#### 1.4. Actualizar trigger para puntaje fraccionario
```sql
-- Archivo: 04_TRIGGER_PUNTAJE_FRACCIONARIO.sql
-- Calcula correctamente 4/8 * 10 = 5.0 puntos
```
**Ejecutar**: `04_TRIGGER_PUNTAJE_FRACCIONARIO.sql`

#### 1.5. Agregar sistema de vueltas/rondas
```sql
-- Archivo: 05_AGREGAR_SISTEMA_VUELTAS.sql
-- Agrega: vuelta (INT) para seguimiento temporal
```
**Ejecutar**: `05_AGREGAR_SISTEMA_VUELTAS.sql`

#### 1.6. Agregar soporte para tipo Catálogo
```sql
-- Archivo: 06_AGREGAR_TIPO_CATALOGO.sql
-- Agrega: catalogo_tabla, catalogo_valor, catalogo_etiqueta
```
**Ejecutar**: `06_AGREGAR_TIPO_CATALOGO.sql`

#### 1.7. Agregar nombre del encuestador automático
```sql
-- Archivo: 07_AGREGAR_NOMBRE_ENCUESTADOR.sql
-- Agrega: nombre_encuestador (se llena automáticamente)
```
**Ejecutar**: `07_AGREGAR_NOMBRE_ENCUESTADOR.sql`

#### 1.8. Agregar rangos de semáforo personalizados
```sql
-- Archivo: 08_AGREGAR_SEMAFORO_PERSONALIZADO.sql
-- Agrega: rango_rojo_max, rango_naranja_max, rango_amarillo_max
```
**Ejecutar**: `08_AGREGAR_SEMAFORO_PERSONALIZADO.sql`

#### 1.9. Actualizar trigger para puntos negativos
```sql
-- Archivo: 09_TRIGGER_PUNTOS_NEGATIVOS.sql
-- Permite puntos negativos para respuestas incorrectas
```
**Ejecutar**: `09_TRIGGER_PUNTOS_NEGATIVOS.sql`

---

### PASO 2: Reiniciar el Backend (API)

```bash
cd API-REST-CAB
# Detener el servidor si está corriendo (Ctrl+C)
npm start
```

---

### PASO 3: Reiniciar el Frontend

```bash
cd cab
# Detener el servidor si está corriendo (Ctrl+C)
npm run dev
```

---

## 🎉 FUNCIONALIDADES DISPONIBLES DESPUÉS DE EJECUTAR

### ✅ Tipos de Pregunta Soportados

Al crear encuestas desde `/admin/surveys/new`, ahora puedes seleccionar:

1. **Opción Única** - Radio buttons, solo una respuesta
2. **Opción Múltiple** - Checkboxes, múltiples respuestas con puntaje fraccionario
3. **Numérica** - Campo numérico
4. **Sí/No** - Dos opciones simples
5. **Texto Abierto** - Textarea para texto libre
6. **Fecha** - Selector de fecha
7. **Catálogo** - Carga opciones dinámicamente desde tablas de BD (comunidades, departamentos, etc.)

### ✅ Dashboard de Analítica Funcional

El dashboard en `/admin/analytics` ahora carga correctamente:
- Promedio general por comunidad
- Distribución por semáforo (Verde/Amarillo/Naranja/Rojo)
- Promedios por categoría de preguntas
- Comparación entre comunidades

### ✅ Selección Múltiple con Puntaje Fraccionario

**Ejemplo**: Pregunta "¿Cuándo lavarse las manos?" con 8 opciones

- Usuario marca 4 opciones correctas
- Sistema calcula: (4/8) × 10 = 5.0 puntos
- Se guardan 4 filas en `respuestas_detalle`, una por cada opción
- El promedio se calcula automáticamente

**Cómo configurar en Admin**:
1. Crear pregunta tipo "Opción Múltiple"
2. Agregar todas las opciones (ej: 8 opciones)
3. Asignar 1 punto a cada opción correcta
4. Establecer `puntaje_maximo = 8` (total de opciones)

### ✅ Sistema de Vueltas/Rondas

Permite hacer seguimiento temporal del progreso/retroceso de comunidades:
- Seleccionar número de vuelta al llenar encuesta (1ra, 2da, 3ra, etc.)
- Comparar resultados entre diferentes visitas
- Analizar evolución temporal

**Ejemplo**:
- Vuelta 1 (Enero 2025): Promedio 5.2
- Vuelta 2 (Junio 2025): Promedio 6.8
- Mejora de 1.6 puntos

### ✅ Tipo Catálogo para Preguntas

Carga opciones dinámicamente desde tablas de base de datos:
- Comunidades
- Departamentos
- Municipios
- Categorías de preguntas
- Grupos focales

**Configuración**:
1. Seleccionar tipo "Catálogo"
2. Elegir tabla origen
3. Especificar columna valor e ID
4. Las opciones se cargan automáticamente al llenar la encuesta

### ✅ Nombre Encuestador Automático

El nombre del encuestador se captura automáticamente del usuario logueado:
- No requiere input manual
- Se muestra en el formulario (solo lectura)
- Permite auditoría de quién realizó cada encuesta

### ✅ Semáforo Personalizado por Pregunta

Define rangos personalizados para cada pregunta:
- Rojo hasta: X puntos
- Naranja hasta: Y puntos
- Amarillo hasta: Z puntos
- Verde: > Z puntos

Si no se especifica, usa rangos globales por defecto (5.0, 7.0, 8.0).

### ✅ Puntos Negativos

Permite asignar puntos negativos a respuestas incorrectas:
- Útil para penalizar errores
- El puntaje_0a10 puede ser negativo
- Ejemplo: -1 punto por respuesta incorrecta

### ✅ Preguntas Condicionales

Muestra/oculta preguntas basándose en respuestas anteriores:
- Marcar opción como "condicional"
- Seleccionar qué pregunta mostrar si se elige esa opción
- La pregunta aparece/desaparece dinámicamente

**Ejemplo**:
- "¿Tiene familiar con discapacidad?"
  - NO → Continuar a siguiente categoría
  - SÍ → Mostrar preguntas adicionales sobre discapacidad

---

## 📊 EJEMPLOS DE USO

### Crear Encuesta con Selección Múltiple

1. Ir a `/admin/surveys/new`
2. Agregar pregunta:
   - Texto: "¿Cuándo hay que lavarse las manos?"
   - Tipo: **Opción Múltiple**
   - Categoría: Higiene Básica

3. Agregar opciones (cada una vale 1 punto):
   - "Antes de comer" - Puntos: 1
   - "Antes de cocinar" - Puntos: 1
   - "Después de usar la letrina" - Puntos: 1
   - ... (total 8 opciones)

4. Guardar encuesta

### Llenar Encuesta como Encuestador

1. Ir a `/surveyor/list`
2. Seleccionar encuesta activa
3. Llenar datos de encabezado
4. En pregunta de selección múltiple: **marcar varios checkboxes**
5. Enviar respuesta

### Ver Resultados en Analytics

1. Ir a `/admin/analytics`
2. Seleccionar comunidad
3. Ver promedio calculado automáticamente con puntaje fraccionario

---

## ⚠️ NOTAS IMPORTANTES

### Sobre Selección Múltiple

- **Backend**: Espera recibir múltiples filas con el mismo `id_pregunta` pero diferentes `id_opcion`
- **Frontend**: Envía array de opciones que se convierte en múltiples filas
- **BD**: El trigger calcula automáticamente el puntaje normalizado a 0-10

### Sobre Respuestas Negativas

- Puntos negativos están soportados en `preguntas_opciones.puntos`
- Puedes asignar `-1` a respuestas incorrectas
- El trigger maneja correctamente puntos negativos

### Sobre Datos de Encuestadora

- `nombre_encuestada`: Nombre de la persona entrevistada
- `edad_encuestada`: Edad de la persona
- `sexo_encuestador`: Sexo del encuestador (M/F)
- **PENDIENTE**: Obtener nombre del encuestador desde usuario logueado

---

## 🔜 FUNCIONALIDADES PENDIENTES

Estas funcionalidades están en la lista pero **NO implementadas aún**:

- [ ] Tipo "Catálogo" para respuestas (seleccionar desde tabla como comunidades)
- [ ] Sistema de vueltas/rondas para seguimiento temporal
- [ ] Semáforo personalizado por pregunta
- [ ] Preguntas condicionales (mostrar/ocultar según respuesta anterior)

Si necesitas alguna de estas, házmelo saber.

---

## ❓ PROBLEMAS COMUNES

### Error: "invalid column name 'promedio_0a10'"
**Solución**: Ejecutar scripts SQL del PASO 1

### Error: "invalid column name 'valor_texto'"
**Solución**: Ejecutar `02_AGREGAR_VALOR_TEXTO_RESPUESTAS_DETALLE.sql`

### Dashboard no carga datos
**Solución**: Verificar que scripts SQL 1-4 se ejecutaron correctamente

### No puedo crear preguntas de tipo Texto/Fecha
**Solución**: Verificar que el frontend está actualizado (archivo `SurveyForm.jsx`)

---

## 📞 CONTACTO

Si tienes problemas ejecutando estos pasos, revisa:
1. Archivo `.claude/CONTEXTO_PROYECTO.md` - Contexto completo
2. Archivo `ERRORES_ENCONTRADOS_Y_SOLUCIONES.md` - Detalles técnicos

---

## ✅ CHECKLIST DE EJECUCIÓN

Marca cada paso al completarlo:

### Scripts SQL
- [ ] Ejecutado `01_AGREGAR_COLUMNAS_RESPUESTAS.sql`
- [ ] Ejecutado `02_AGREGAR_VALOR_TEXTO_RESPUESTAS_DETALLE.sql`
- [ ] Ejecutado `03_MODIFICAR_RESPUESTAS_DETALLE_MULTIPLES_OPCIONES.sql`
- [ ] Ejecutado `04_TRIGGER_PUNTAJE_FRACCIONARIO.sql`
- [ ] Ejecutado `05_AGREGAR_SISTEMA_VUELTAS.sql`
- [ ] Ejecutado `06_AGREGAR_TIPO_CATALOGO.sql`
- [ ] Ejecutado `07_AGREGAR_NOMBRE_ENCUESTADOR.sql`
- [ ] Ejecutado `08_AGREGAR_SEMAFORO_PERSONALIZADO.sql`
- [ ] Ejecutado `09_TRIGGER_PUNTOS_NEGATIVOS.sql`

### Aplicación
- [ ] Reiniciado API (Backend)
- [ ] Reiniciado Frontend

### Pruebas
- [ ] Probado crear encuesta con Opción Múltiple
- [ ] Probado tipo Catálogo
- [ ] Probado preguntas condicionales
- [ ] Probado sistema de vueltas
- [ ] Probado llenar encuesta como encuestador
- [ ] Verificado Dashboard Analytics carga correctamente
- [ ] Verificado nombre encuestador aparece automáticamente

---

**¡Todo listo para usar el sistema mejorado!** 🎉
