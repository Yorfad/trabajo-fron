# 📌 Notas Importantes: Opciones Múltiples

## ¿Cómo funcionan las preguntas de Opción Múltiple?

### Concepto Básico

Las preguntas de **Opción Múltiple** funcionan como **checkboxes (casillas de verificación)**, donde el encuestado puede marcar **una, varias o ninguna** de las opciones disponibles.

### ❌ Concepto INCORRECTO

**NO funciona así:**
```
Pregunta: ¿Cuándo te lavas las manos?

Opciones que creas:
- Antes de comer: Sí / No
- Después del baño: Sí / No  
- Antes de cocinar: Sí / No
```

### ✅ Concepto CORRECTO

**SÍ funciona así:**
```
Pregunta: ¿Cuándo te lavas las manos?

Opciones que creas:
☐ Antes de comer
☐ Después del baño
☐ Antes de cocinar
☐ Después de cambiar pañales
☐ Cuando las tiene sucias
```

El encuestado simplemente **marca las que aplican** y **NO marca las que no aplican**.

## Ejemplo Práctico Completo

### Al Crear la Encuesta

```
Texto de la Pregunta: ¿Cuándo te lavas las manos?
Categoría: Higiene Básica
Tipo: Opción Múltiple

Opciones:
1. Etiqueta: "Antes de comer"
   Valor: "antes_comer"
   Puntos: 5

2. Etiqueta: "Después de usar la letrina"
   Valor: "despues_letrina"
   Puntos: 5

3. Etiqueta: "Antes de cocinar"
   Valor: "antes_cocinar"
   Puntos: 5

4. Etiqueta: "Después de cambiar pañales"
   Valor: "despues_panales"
   Puntos: 5

5. Etiqueta: "Cuando las tiene sucias"
   Valor: "cuando_sucias"
   Puntos: 2
```

### Al Responder la Encuesta

El encuestado ve:
```
¿Cuándo te lavas las manos?

☑️ Antes de comer              (marcó)
☐ Después de usar la letrina   (no marcó)
☑️ Antes de cocinar             (marcó)
☐ Después de cambiar pañales   (no marcó)
☑️ Cuando las tiene sucias      (marcó)
```

### Datos que se Envían al Sistema

Solo se envían las opciones **MARCADAS**:
```json
{
  "respuestas": [
    { "valor": "antes_comer", "puntos": 5 },
    { "valor": "antes_cocinar", "puntos": 5 },
    { "valor": "cuando_sucias", "puntos": 2 }
  ],
  "puntos_totales": 12
}
```

**Las opciones NO marcadas NO se envían** - simplemente se ignoran.

## Campo "Valor" - ¿Para qué sirve?

El campo **Valor** es un **identificador único** de cada opción:

- **Etiqueta**: Lo que ve el usuario (puede tener espacios, acentos, etc.)
- **Valor**: Código interno para la base de datos (sin espacios, sin acentos)

### Ejemplos:

| Etiqueta | Valor |
|----------|-------|
| Antes de comer | `antes_comer` |
| Después de usar la letrina | `despues_letrina` |
| Sí | `si` |
| No | `no` |
| Casi siempre | `casi_siempre` |
| A veces | `a_veces` |
| Nunca | `nunca` |

### Buenas Prácticas para "Valor":

1. ✅ Usar solo letras minúsculas
2. ✅ Usar guión bajo `_` en lugar de espacios
3. ✅ No usar acentos ni caracteres especiales
4. ✅ Ser descriptivo pero conciso
5. ✅ Usar el mismo valor si la pregunta se repite en otras encuestas

## Sistema de Puntajes

### Opción Única (Radio)
- Solo se marca **UNA** opción
- Solo se obtienen los puntos de **ESA** opción

Ejemplo:
```
¿Te lavas las manos?
○ Sí (10 puntos)  ← marcó esta
○ No (0 puntos)

Resultado: 10 puntos
```

### Opción Múltiple (Checkbox)
- Se pueden marcar **VARIAS** opciones
- Los puntos de **CADA** opción marcada se **SUMAN**

Ejemplo:
```
¿Cuándo te lavas las manos?
☑️ Antes de comer (5 puntos)           ← marcó
☐ Después de la letrina (5 puntos)    
☑️ Antes de cocinar (5 puntos)         ← marcó
☑️ Cuando sucias (2 puntos)            ← marcó

Resultado: 5 + 5 + 2 = 12 puntos
```

## Diferencia entre Opción Única vs Opción Múltiple

| Aspecto | Opción Única | Opción Múltiple |
|---------|--------------|-----------------|
| Control UI | Radio button (○) | Checkbox (☐) |
| Selección | Solo UNA opción | Varias opciones |
| Uso típico | Sí/No, Sexo, Selección exclusiva | Frecuencia, Actividades múltiples |
| Puntaje | De la opción seleccionada | Suma de todas las marcadas |
| Ejemplo | ¿Eres mayor de edad? Sí/No | ¿Qué frutas te gustan? Manzana, Pera, Uva |

## Errores Comunes a Evitar

### ❌ Error 1: Crear opciones Sí/No para cada caso
```
INCORRECTO:
¿Cuándo te lavas las manos?
- Antes de comer: Sí / No
- Después del baño: Sí / No
```

### ✅ Correcto: Solo listar las opciones
```
CORRECTO:
¿Cuándo te lavas las manos?
- Antes de comer
- Después del baño
```

### ❌ Error 2: Poner espacios en el campo "Valor"
```
INCORRECTO:
Valor: "antes de comer"
Valor: "después del baño"
```

### ✅ Correcto: Usar guiones bajos
```
CORRECTO:
Valor: "antes_comer"
Valor: "despues_bano"
```

### ❌ Error 3: Confundir cuándo usar cada tipo
```
INCORRECTO:
¿Eres mayor de edad? (Opción Múltiple)
☐ Sí
☐ No
```

### ✅ Correcto:
```
CORRECTO:
¿Eres mayor de edad? (Opción Única)
○ Sí
○ No
```

## Resumen Final

1. **Opción Múltiple** = El usuario puede marcar varias casillas
2. Solo se registran las opciones **MARCADAS**
3. Las opciones **NO marcadas** se ignoran (no se envían)
4. Los puntos de todas las opciones marcadas se **SUMAN**
5. El campo **Valor** es el código interno (usa `guion_bajo`)
6. El campo **Etiqueta** es lo que ve el usuario (puede tener espacios)

---

**¿Tienes más dudas?** Usa el botón "❓ Ayuda" dentro del formulario de creación de encuestas.
