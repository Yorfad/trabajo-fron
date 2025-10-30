# 📝 Guía de Creación de Encuestas - Sistema CAB

## 🎯 Características Implementadas

### Categorías de Preguntas

**Sin Categoría (Datos Generales)** 📋
- Para preguntas de identificación del encuestado
- Ejemplos: Nombre, Edad, Sexo, Fecha de entrevista, Número de boleta, Departamento, Municipio
- Estas preguntas van al inicio de la encuesta antes de las preguntas temáticas

**Con Categoría** 🏷️
- Para preguntas temáticas específicas
- Ejemplos: Higiene Básica, Agua y Enfermedades, etc.
- Agrupan preguntas relacionadas por tema

### Tipos de Preguntas Disponibles

1. **Opción Única (Radio Button)** ⭕
   - El encuestado selecciona **UNA SOLA** opción
   - Ideal para preguntas de Sí/No o selección única
   - Ejemplo: "¿Te lavas las manos?" → Solo puede elegir Sí o No
   - Cada opción tiene su etiqueta, valor y puntos

2. **Opción Múltiple (Checkboxes)** ☑️
   - El encuestado puede marcar **VARIAS** opciones
   - Ejemplo: "¿Cuándo te lavas las manos?" → Puede marcar: Antes de comer, Después del baño, etc.
   - **IMPORTANTE**: Las opciones NO marcadas simplemente no se registran
   - No es necesario crear opciones "No" para cada caso
   - Solo se envían al sistema las opciones que el encuestado SÍ marca
   - Cada opción marcada suma sus puntos independientemente

3. **Texto Corto** 📝
   - Campo de texto para respuestas breves
   - Ejemplo: Nombre, Apellido

4. **Texto Largo** 📄
   - Campo de texto amplio para respuestas extensas
   - Ejemplo: Observaciones, Comentarios

5. **Numérico** 🔢
   - Campo para ingresar números
   - Ejemplo: Edad, Número de boleta

6. **Catálogo** 📚
   - Selección de opciones predefinidas del sistema
   - Opciones disponibles:
     - Sexo (Masculino/Femenino)
     - Departamento
     - Municipio
     - Comunidad

## 🚀 Cómo Usar el Sistema

### Crear una Nueva Encuesta

1. **Acceder al Módulo**
   - Ingresar al sistema como Administrador
   - Navegar a "Gestión de Encuestas"
   - Click en "+ Nueva Encuesta"

2. **Completar Datos Generales**
   - **Título**: Nombre descriptivo de la encuesta (Requerido)
   - **Descripción**: Breve descripción del propósito
   - **Grupo Focal**: Seleccionar el grupo objetivo (Embarazadas, Madres con niños, etc.)
   - **Versión**: Versión de la encuesta (por defecto 1.0)

3. **Añadir Preguntas**

   #### Opción 1: Pregunta Rápida Sí/No
   - Click en "⚡ Sí/No"
   - Se creará automáticamente una pregunta con opciones:
     - Sí (10 puntos)
     - No (0 puntos)
   - Solo editar el texto de la pregunta y categoría

   #### Opción 2: Pregunta Personalizada
   - Click en "+ Añadir Pregunta"
   - Llenar los campos:
     - **Texto de la Pregunta**: La pregunta que verá el encuestado
     - **Categoría**: Seleccionar (Higiene Básica, Agua y Enfermedades, etc.)
     - **Tipo de Pregunta**: Seleccionar el tipo apropiado

4. **Configurar Opciones (para OpcionUnica/OpcionMultiple)**
   - Click en "+ Añadir Opción"
   - Para cada opción:
     - **Etiqueta**: Texto que verá el usuario (ej: "Sí")
     - **Valor**: Valor interno (ej: "si")
     - **Puntos**: Puntaje asignado a esta opción

5. **Configurar Catálogos (para tipo Catálogo)**
   - Seleccionar el tipo de catálogo deseado
   - Las opciones se cargarán automáticamente de la base de datos

6. **Guardar la Encuesta**
   - Revisar el resumen en la parte inferior
   - Click en "💾 Guardar Encuesta"

## 📊 Ejemplos de Uso

### Sección 1: Datos Generales (Sin Categoría)

Estas preguntas van primero para identificar al encuestado:

```
Texto: Fecha de entrevista
Categoría: Sin Categoría (Datos Generales)
Tipo: Texto Corto
```

```
Texto: Número de boleta
Categoría: Sin Categoría (Datos Generales)
Tipo: Numérico
```

```
Texto: Departamento
Categoría: Sin Categoría (Datos Generales)
Tipo: Catálogo
Tipo de Catálogo: Departamento
```

```
Texto: Municipio
Categoría: Sin Categoría (Datos Generales)
Tipo: Catálogo
Tipo de Catálogo: Municipio
```

```
Texto: Nombre del encuestador
Categoría: Sin Categoría (Datos Generales)
Tipo: Texto Corto
```

```
Texto: Sexo del encuestador
Categoría: Sin Categoría (Datos Generales)
Tipo: Catálogo
Tipo de Catálogo: Sexo
```

```
Texto: Nombre de la mujer
Categoría: Sin Categoría (Datos Generales)
Tipo: Texto Corto
```

```
Texto: Edad
Categoría: Sin Categoría (Datos Generales)
Tipo: Numérico
```

### Sección 2: Preguntas Temáticas (Con Categoría)

#### Ejemplo 1: Pregunta de Higiene Básica (Sí/No)

```
Texto: ¿Te lavas las manos?
Categoría: Higiene Básica
Tipo: Opción Única

Opciones:
- Sí (valor: si, puntos: 10)
- No (valor: no, puntos: 0)
```

#### Ejemplo 2: Pregunta de Frecuencia (Opción Múltiple)

```
Texto: ¿Cuándo te lavas las manos?
Categoría: Higiene Básica
Tipo: Opción Múltiple

Opciones:
- Antes de comer (valor: antes_comer, puntos: 5)
- Antes de cocinar (valor: antes_cocinar, puntos: 5)
- Después de usar la letrina (valor: despues_letrina, puntos: 5)
- Después de cambiar pañales (valor: despues_panales, puntos: 5)
- Cuando las tiene sucias (valor: cuando_sucias, puntos: 2)

📌 NOTA: Si el encuestado marca "Antes de comer" y "Después de usar la letrina",
solo esas dos opciones se registran y suma 10 puntos (5+5).
Las demás opciones NO se envían (no es necesario marcarlas como "No").
```

#### Ejemplo 3: Pregunta sobre Agua y Enfermedades

```
Texto: ¿Sabe usted si el agua para beber, que no ha sido desinfectada, puede provocar enfermedades?
Categoría: Agua y Enfermedades
Tipo: Opción Única

Opciones:
- Sí (valor: si, puntos: 10)
- No (valor: no, puntos: 0)
```

## ❓ Preguntas Frecuentes

### ¿Qué pongo en el campo "Valor" de las opciones?

El campo **Valor** es un identificador único para cada opción (como un código interno):
- Usa palabras en minúsculas sin espacios ni acentos
- Separa palabras con guion bajo `_`
- Ejemplos: `si`, `no`, `antes_comer`, `despues_bano`

### ¿Cómo funcionan las opciones múltiples?

En preguntas de **Opción Múltiple**:
1. El encuestado ve checkboxes (☑️)
2. Puede marcar las opciones que apliquen a su caso
3. Solo las opciones **MARCADAS** se envían al sistema
4. Las opciones **NO MARCADAS** simplemente no se registran
5. No necesitas crear opciones "No" o "No aplica"

**Ejemplo práctico:**
```
Pregunta: ¿Cuándo te lavas las manos?
Opciones disponibles:
☑️ Antes de comer (marcado)
☐ Antes de cocinar (no marcado)
☑️ Después de usar la letrina (marcado)
☐ Después de cambiar pañales (no marcado)

Resultado: Solo se registran "Antes de comer" y "Después de usar la letrina"
Puntos: 5 + 5 = 10 puntos
```

### ¿Cuándo uso "Sin Categoría"?

Usa **Sin Categoría (Datos Generales)** para:
- Información del encuestador (nombre, sexo)
- Información del encuestado (nombre, edad, sexo)
- Datos de ubicación (departamento, municipio, comunidad)
- Datos administrativos (fecha, número de boleta)
- Cualquier dato que identifique la encuesta pero no sea una pregunta temática

Usa **Con Categoría** para:
- Preguntas sobre higiene
- Preguntas sobre salud
- Preguntas sobre agua
- Preguntas sobre enfermedades
- Cualquier pregunta que evalúe conocimientos o prácticas específicas

## 🎨 Características de la Interfaz

- **Vista Previa en Tiempo Real**: Ve cómo se verá cada pregunta según su tipo
- **Validaciones Automáticas**: El sistema valida que todos los campos estén completos
- **Contador de Preguntas**: Muestra cuántas preguntas y opciones has creado
- **Botones de Acción Rápida**: Crea preguntas Sí/No con un solo click
- **Modal de Ayuda**: Guía interactiva sobre los tipos de preguntas
- **Confirmación de Guardado**: Muestra resumen antes de guardar
- **Indicador de Categoría**: Aviso especial cuando seleccionas "Sin Categoría"

## ⚠️ Validaciones del Sistema

El sistema valida:
- ✅ Título de encuesta no vacío
- ✅ Grupo focal seleccionado
- ✅ Al menos una pregunta agregada
- ✅ Cada pregunta tiene texto
- ✅ Cada pregunta tiene categoría (puede ser "Sin Categoría")
- ✅ Preguntas de opción tienen al menos una opción
- ✅ Preguntas de catálogo tienen tipo de catálogo seleccionado

## 🔄 Flujo de Trabajo Recomendado

1. **Planificar** las preguntas antes de comenzar
2. **Crear** la encuesta con datos generales (título, descripción, grupo focal)
3. **Agregar PRIMERO** las preguntas de identificación (Sin Categoría):
   - Fecha de entrevista
   - Número de boleta
   - Departamento, Municipio, Comunidad
   - Nombre del encuestador y sexo
   - Nombre del encuestado y edad
4. **Luego agregar** preguntas temáticas por categoría:
   - Higiene Básica
   - Agua y Enfermedades
   - Etc.
5. **Usar** el botón "⚡ Sí/No" para preguntas rápidas
6. **Usar** el botón "❓ Ayuda" si tienes dudas sobre tipos de preguntas
7. **Revisar** el resumen antes de guardar
8. **Guardar** y probar la encuesta

## 📱 Rutas del Sistema

- **Lista de Encuestas**: `/admin/surveys`
- **Crear Encuesta**: `/admin/surveys/new`
- **Editar Encuesta**: `/admin/surveys/edit/:id` (próximamente)

## 🛠️ Funcionalidades Técnicas

### Integración con API
- `GET /grupos-focales` - Obtiene grupos focales
- `GET /categorias-preguntas` - Obtiene categorías
- `GET /departamentos` - Obtiene departamentos
- `GET /municipios` - Obtiene municipios
- `GET /comunidades` - Obtiene comunidades
- `POST /encuestas` - Crea nueva encuesta

### Estructura de Datos Enviada

```json
{
  "titulo": "Encuesta de Higiene Básica",
  "descripcion": "Encuesta para medir prácticas de higiene",
  "id_grupo_focal": 1,
  "version": "1.0",
  "preguntas": [
    {
      "id_categoria_pregunta": 1,
      "texto": "¿Te lavas las manos?",
      "tipo": "OpcionUnica",
      "orden": 1,
      "opciones": [
        {
          "etiqueta": "Sí",
          "valor": "si",
          "puntos": 10,
          "orden": 1
        },
        {
          "etiqueta": "No",
          "valor": "no",
          "puntos": 0,
          "orden": 2
        }
      ]
    }
  ]
}
```

## 💡 Tips y Buenas Prácticas

1. **Usa nombres descriptivos** para las etiquetas de opciones
2. **Asigna puntajes coherentes** según la importancia de cada respuesta
3. **Agrupa preguntas por categoría** para mejor organización
4. **Usa el botón Sí/No** para agilizar la creación de preguntas comunes
5. **Revisa el resumen** antes de guardar para verificar todo está correcto
6. **Prueba la encuesta** después de crearla

## 🐛 Solución de Problemas

**Problema**: No se guardan las preguntas
- **Solución**: Verifica que cada pregunta tenga texto y categoría asignada

**Problema**: Error al guardar
- **Solución**: Revisa que las preguntas de opción tengan al menos una opción configurada

**Problema**: No aparecen los catálogos
- **Solución**: Verifica tu conexión a internet y que la API esté funcionando

## 📞 Soporte

Para más información o reportar problemas, contacta al equipo de desarrollo.

---

**Última actualización**: 30 de octubre de 2025
**Versión del Sistema**: 1.0
