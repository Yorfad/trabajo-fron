# 📋 Explicación del Script SQL 12_CORREGIR_PUNTAJE_MAXIMO.sql

## ¿Qué Hace Este Script?

Este script **NO modifica las respuestas que ya guardaste**. Solo corrige la configuración de las preguntas para que **las nuevas respuestas** se calculen correctamente.

## 🔍 Problema Actual

### En la Tabla `preguntas`:
Cada pregunta tiene un campo `puntaje_maximo` que indica cuántos puntos vale la pregunta completa.

**Problema:** Todas las preguntas tienen `puntaje_maximo = 100` (valor por defecto)

**Consecuencia:**
- Si respondes "Sí" (1 punto) en una pregunta SiNo
- Cálculo: (1 punto / 100 máximo) × 10 = **0.10** = Rojo ❌
- Debería ser: (1 punto / 1 máximo) × 10 = **10.00** = Verde ✓

## 🔧 Lo Que Hace El Script

### 1. Preguntas SiNo y OpcionUnica
```sql
-- Ejemplo: Pregunta "¿Sabe usted si el agua...?"
-- Opciones:
--   - Sí = 1 punto
--   - No = 0 puntos

-- ANTES: puntaje_maximo = 100
-- DESPUÉS: puntaje_maximo = 1 (máximo de las opciones)
```

### 2. Preguntas OpcionMultiple
```sql
-- Ejemplo: "¿Cuándo lavarse las manos?" (8 opciones)
-- Opciones:
--   - Antes de comer = 1 punto
--   - Después del baño = 1 punto
--   - ... (8 opciones × 1 punto)

-- ANTES: puntaje_maximo = 100
-- DESPUÉS: puntaje_maximo = 8 (suma de todas las opciones)
```

### 3. Preguntas Numéricas/Texto
```sql
-- ANTES: puntaje_maximo = 100
-- DESPUÉS: puntaje_maximo = 10 (escala estándar)
```

## 📊 Ejemplo Práctico

### ANTES del Script:
```
Pregunta: "¿Sabe usted si el agua...?" (SiNo)
├─ Opción: Sí = 1 punto
├─ Opción: No = 0 puntos
└─ puntaje_maximo = 100

Si respondes "Sí":
  Cálculo: (1 / 100) × 10 = 0.10 → 🔴 Rojo (MAL)
```

### DESPUÉS del Script:
```
Pregunta: "¿Sabe usted si el agua...?" (SiNo)
├─ Opción: Sí = 1 punto
├─ Opción: No = 0 puntos
└─ puntaje_maximo = 1 ← CORREGIDO

Si respondes "Sí":
  Cálculo: (1 / 1) × 10 = 10.00 → 🟢 Verde (BIEN)
```

## ❓ Preguntas y Respuestas

### 1. ¿Corregirá las respuestas que ya di?
**NO.** El script solo corrige la **configuración de las preguntas**, no las respuestas ya guardadas.

**Las respuestas antiguas:**
- Seguirán teniendo el cálculo incorrecto en la base de datos
- PERO el frontend las recalculará correctamente cuando las veas
- (El frontend ya tiene el código de recálculo correcto)

### 2. ¿Si lleno la misma encuesta otra vez, esta vez tomará bien los datos?
**SÍ**, después de ejecutar el script:
1. Las preguntas tendrán el `puntaje_maximo` correcto
2. El trigger calculará correctamente: (puntos / puntaje_maximo) × 10
3. Los semáforos se mostrarán correctos

### 3. ¿Cambiará algo de la estructura de la base de datos?
**NO.** El script solo hace UPDATE a los valores del campo `puntaje_maximo`.

**NO se agregan columnas**
**NO se eliminan tablas**
**NO se modifican relaciones**

Solo se actualizan valores numéricos en una columna existente.

### 4. ¿Necesito ejecutar el script cada vez que creo una pregunta nueva?
**NO.** Solo necesitas ejecutarlo **UNA VEZ** para corregir las preguntas existentes.

**IMPORTANTE:** Cuando crees preguntas nuevas en el futuro, asegúrate de:
- Para SiNo/OpcionUnica: establecer `puntaje_maximo` = puntos de la opción correcta
- Para OpcionMultiple: establecer `puntaje_maximo` = suma de puntos de todas las opciones

## 📝 Qué Hace El Script Paso a Paso

```sql
-- PASO 1: Mostrar preguntas con puntaje incorrecto
SELECT * FROM preguntas WHERE puntaje_maximo != (cálculo correcto)

-- PASO 2: Corregir SiNo y OpcionUnica
UPDATE preguntas
SET puntaje_maximo = (MAX puntos de opciones)
WHERE tipo IN ('SiNo', 'OpcionUnica')

-- PASO 3: Corregir OpcionMultiple
UPDATE preguntas
SET puntaje_maximo = (SUM puntos de opciones)
WHERE tipo = 'OpcionMultiple'

-- PASO 4: Corregir Numerica/Texto
UPDATE preguntas
SET puntaje_maximo = 10
WHERE tipo IN ('Numerica', 'Texto', 'Fecha')
  AND puntaje_maximo = 100

-- PASO 5: Mostrar resumen de correcciones
SELECT tipo, COUNT(*), AVG(puntaje_maximo) FROM preguntas GROUP BY tipo
```

## ✅ Resumen

| Aspecto | Estado |
|---------|--------|
| ¿Modifica respuestas existentes? | ❌ NO |
| ¿Modifica estructura de BD? | ❌ NO |
| ¿Solo actualiza valores? | ✅ SÍ |
| ¿Necesito ejecutarlo varias veces? | ❌ NO, solo una vez |
| ¿Las nuevas respuestas se calcularán bien? | ✅ SÍ |
| ¿Es reversible? | ✅ SÍ (pero no es necesario) |
| ¿Es seguro? | ✅ SÍ, 100% seguro |

## 🚀 Cómo Ejecutarlo

1. Abre SQL Server Management Studio
2. Conecta a tu base de datos
3. Abre el archivo `12_CORREGIR_PUNTAJE_MAXIMO.sql`
4. Click en "Execute" o presiona F5
5. Verás un reporte de qué se corrigió

**Tiempo estimado:** 1-2 segundos

---

**¿Alguna otra duda sobre el script?** Es completamente seguro ejecutarlo.
