# 📋 Flujo de Trabajo - Sistema de Encuestas CAB

## 🎯 Concepto Principal

**NO hay edición de encuestas.** Si se necesitan cambios, se crea una **nueva versión**.

## 🔄 Flujo Completo

### 1️⃣ Crear Nueva Encuesta
- Ir a **Gestión de Encuestas** → **+ Nueva Encuesta**
- Completar:
  - Título
  - Descripción  
  - Grupo Focal
  - **Versión** (ej: `v1.0`, `v1.1`, `v2.0`)
- Agregar preguntas con sus opciones
- Guardar

**Estado inicial:** 🔴 **Inactiva**

### 2️⃣ Activar Encuesta para Uso
- Desde **Gestión de Encuestas**
- Hacer clic en **✅ Activar**
- La encuesta ahora está disponible para los encuestadores

**Estado:** 🟢 **Activa** (en uso)

### 3️⃣ Desactivar Encuesta
- Desde **Gestión de Encuestas**
- Hacer clic en **🔴 Desactivar**
- La encuesta ya no está disponible para uso

**Estado:** 🔴 **Inactiva**

### 4️⃣ Modificar/Agregar Preguntas (Nueva Versión)

**⚠️ Importante:** No existe edición. Se debe crear una nueva encuesta.

**Proceso:**
1. Ir a **+ Nueva Encuesta**
2. Copiar manualmente el título y preguntas de la versión anterior
3. Agregar/modificar las preguntas necesarias
4. Actualizar la **versión** (ej: `v1.0` → `v1.1` o `v2.0`)
5. Guardar la nueva encuesta
6. Desactivar la encuesta anterior (opcional)
7. Activar la nueva versión

## 📊 Tabla de Gestión - Columnas

| ID | Título | Grupo Focal | Versión | Estado | Acciones |
|----|--------|-------------|---------|--------|----------|
| 15 | Encuesta Higiene | Embarazadas | v1.0 | 🟢 Activa | 🔴 Desactivar |
| 14 | Encuesta Higiene | Embarazadas | v0.9 | 🔴 Inactiva | ✅ Activar |

**Acciones disponibles:**
- ✅ **Activar** (solo si está inactiva)
- 🔴 **Desactivar** (solo si está activa)
- ❌ **NO hay botón Editar**

## 🎨 Estados Visuales

### 🟢 Activa
```
Badge verde: "Activa"
Botón rojo: "🔴 Desactivar"
```

### 🔴 Inactiva
```
Badge rojo: "Inactiva"
Botón verde: "✅ Activar"
```

## 💡 Casos de Uso

### Caso 1: Primera encuesta
```
1. Crear encuesta "Higiene v1.0"
2. Activar
3. Encuestadores la usan
```

### Caso 2: Agregar 2 preguntas nuevas
```
1. Crear encuesta "Higiene v1.1" 
2. Copiar las preguntas de v1.0
3. Agregar las 2 preguntas nuevas
4. Guardar
5. Desactivar "Higiene v1.0"
6. Activar "Higiene v1.1"
```

### Caso 3: Corrección de una pregunta
```
1. Crear encuesta "Higiene v1.2"
2. Copiar todo de v1.1
3. Corregir la pregunta con error
4. Guardar
5. Desactivar v1.1
6. Activar v1.2
```

### Caso 4: Cambio mayor (nueva estructura)
```
1. Crear encuesta "Higiene v2.0"
2. Diseñar nueva estructura completa
3. Guardar
4. Mantener v1.x activa mientras se prueba v2.0
5. Cuando v2.0 esté lista: Desactivar v1.x
6. Activar v2.0
```

## 🚫 Lo que NO se puede hacer

- ❌ Editar una encuesta existente
- ❌ Modificar preguntas de una encuesta ya creada
- ❌ Eliminar preguntas de una encuesta existente
- ❌ Cambiar el título de una encuesta creada

## ✅ Lo que SÍ se puede hacer

- ✅ Crear nuevas encuestas
- ✅ Activar/Desactivar encuestas
- ✅ Tener múltiples versiones de la misma encuesta
- ✅ Ver todas las encuestas (activas e inactivas)
- ✅ Cambiar entre versiones activando/desactivando

## 🔐 Beneficios de este Flujo

1. **Trazabilidad:** Se mantiene historial de todas las versiones
2. **Integridad:** No se pueden modificar encuestas ya usadas
3. **Auditoría:** Cada versión es inmutable
4. **Comparación:** Se pueden comparar versiones diferentes
5. **Reversión:** Se puede reactivar una versión anterior si es necesario

## 📝 Nomenclatura de Versiones Recomendada

- **v1.0:** Primera versión oficial
- **v1.1, v1.2, v1.3:** Cambios menores (agregar preguntas, correcciones)
- **v2.0, v3.0:** Cambios mayores (nueva estructura, rediseño completo)
- **v1.0-beta, v2.0-test:** Versiones de prueba (opcional)

## 👥 Roles y Permisos

### Administrador
- ✅ Crear nuevas encuestas
- ✅ Activar/Desactivar encuestas
- ✅ Ver todas las encuestas

### Encuestador
- ✅ Ver solo encuestas activas
- ✅ Responder encuestas activas
- ❌ No puede crear ni modificar encuestas

## 🛠️ Implementación Técnica

### Rutas disponibles:
- `/admin/surveys` - Gestión de Encuestas (lista)
- `/admin/surveys/new` - Crear Nueva Encuesta

### Rutas NO disponibles:
- ~~`/admin/surveys/edit/:id`~~ - No existe edición

### API Endpoints usados:
- `GET /encuestas` - Listar todas
- `POST /encuestas` - Crear nueva
- `PUT /encuestas/{id}/estado` - Activar/Desactivar
- ~~`PUT /encuestas/{id}`~~ - No existe edición completa

## 📞 Preguntas Frecuentes

**P: ¿Por qué no hay edición?**
R: Para mantener integridad de datos y trazabilidad de cambios. Cada versión es inmutable.

**P: ¿Qué pasa con las respuestas ya recolectadas?**
R: Quedan asociadas a su versión específica de la encuesta. No se pierden.

**P: ¿Puedo tener 2 encuestas activas al mismo tiempo?**
R: Sí, siempre que sean de diferentes títulos/grupos focales. No hay límite de encuestas activas.

**P: ¿Cómo recupero una versión anterior?**
R: Simplemente activa la versión anterior desde Gestión de Encuestas.

**P: ¿Se puede eliminar una encuesta?**
R: No está implementado por ahora. Solo se puede desactivar.

---

**Última actualización:** 30 de octubre de 2025
