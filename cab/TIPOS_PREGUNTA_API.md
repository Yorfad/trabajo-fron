# 📋 Tipos de Pregunta - Referencia API

**Fuente:** Swagger de la API CAB  
**Endpoint:** `POST /encuestas`  
**Fecha:** 30 de octubre de 2025

## ✅ Tipos VÁLIDOS (CamelCase, sin espacios, sin tildes)

La base de datos tiene un CHECK constraint `CK_preguntas_tipo` que **SOLO** acepta estos valores exactos:

| Tipo en la API | Descripción | Uso en el frontend |
|---------------|-------------|-------------------|
| `OpcionUnica` | Opción única (radio buttons, Sí/No) | Preguntas donde el usuario elige UNA opción |
| `OpcionMultiple` | Opción múltiple (checkboxes) | Preguntas donde el usuario puede marcar VARIAS opciones |
| `Texto` | Texto corto | Nombre, dirección corta, etc. |
| `TextoLargo` | Texto largo | Comentarios, observaciones, descripciones |
| `Numerica` | Numérico | Edad, cantidad, peso, etc. |

## ❌ Valores que NO funcionan

Estos valores causan error 500 con el CHECK constraint:

- ❌ `"Opcion Unica"` (con espacios)
- ❌ `"Opción Única"` (con tildes y espacios)
- ❌ `"Opcion_Unica"` (con guiones bajos)
- ❌ `"opcionunica"` (minúsculas)
- ❌ `"OPCIONUNICA"` (mayúsculas)
- ❌ `"Catalogo"` (no existe este tipo)

## 📝 Ejemplo de JSON válido

```json
{
  "titulo": "Encuesta de Hábitos de Higiene",
  "descripcion": "Evaluación de hábitos de higiene en la comunidad.",
  "id_grupo_focal": 1,
  "version": "v1.1",
  "preguntas": [
    {
      "id_categoria_pregunta": 1,
      "texto": "¿Con qué frecuencia lava sus manos?",
      "tipo": "OpcionUnica",
      "orden": 1,
      "opciones": [
        {
          "etiqueta": "Casi siempre",
          "valor": "casi_siempre",
          "puntos": 75,
          "orden": 1
        },
        {
          "etiqueta": "A veces",
          "valor": "a_veces",
          "puntos": 50,
          "orden": 2
        }
      ]
    },
    {
      "id_categoria_pregunta": 1,
      "texto": "¿Cuándo se lava las manos?",
      "tipo": "OpcionMultiple",
      "orden": 2,
      "opciones": [
        {
          "etiqueta": "Antes de comer",
          "valor": "antes_comer",
          "puntos": 25,
          "orden": 1
        },
        {
          "etiqueta": "Después del baño",
          "valor": "despues_bano",
          "puntos": 25,
          "orden": 2
        }
      ]
    },
    {
      "id_categoria_pregunta": null,
      "texto": "Nombre completo",
      "tipo": "Texto",
      "orden": 3,
      "opciones": []
    },
    {
      "id_categoria_pregunta": 2,
      "texto": "Observaciones adicionales",
      "tipo": "TextoLargo",
      "orden": 4,
      "opciones": []
    },
    {
      "id_categoria_pregunta": null,
      "texto": "Edad",
      "tipo": "Numerica",
      "orden": 5,
      "opciones": []
    }
  ]
}
```

## 🔑 Notas importantes

1. **CamelCase estricto**: Primera palabra en minúscula, siguientes en mayúscula (OpcionUnica, OpcionMultiple, TextoLargo, Numerica)

2. **Sin espacios**: Los tipos no llevan espacios entre palabras

3. **Sin caracteres especiales**: No tildes, no guiones, no guiones bajos

4. **Case-sensitive**: La API distingue entre mayúsculas y minúsculas

5. **Categoría null**: Para preguntas "Sin Categoría" (datos generales), usar `id_categoria_pregunta: null`

6. **Opciones vacías**: Para tipos Texto, TextoLargo y Numerica, enviar `opciones: []`

## 🛠️ Implementación en el código

```javascript
// Estado inicial correcto
const newQuestionInitialState = {
  tipo: 'OpcionUnica', // ✅ Correcto
  // NO usar: 'Opción Única' ❌
};

// Validaciones correctas
if (p.tipo === 'OpcionUnica' || p.tipo === 'OpcionMultiple') {
  // Requiere opciones
}
```

## 📚 Referencia

- **API Base**: `https://cab-project-spwl.onrender.com/api`
- **Swagger**: `https://cab-project-spwl.onrender.com/swagger-ui/index.html`
- **Constraint**: `CK_preguntas_tipo` en tabla `cab.preguntas`
