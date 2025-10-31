# 🧪 Pruebas de Endpoint - Actualizar Estado de Encuesta

## ❌ Error actual: Status 400 (Bad Request)

## 🔍 Posibles formatos que podría esperar la API:

### Opción 1: Con body JSON (formato actual que falla)
```javascript
PUT /encuestas/15/estado
Body: { "activo": true }
```

### Opción 2: Sin body (toggle automático)
```javascript
PUT /encuestas/15/estado
Body: (vacío)
```
**Resultado:** ❌ (probablemente también falla)

### Opción 3: Con query parameter
```javascript
PUT /encuestas/15/estado?activo=true
Body: (vacío)
```
**Probar ahora**

### Opción 4: Diferente estructura de body
```javascript
PUT /encuestas/15/estado
Body: { "estado": true }
// o
Body: { "activa": true }
// o  
Body: true
```

### Opción 5: POST en vez de PUT
```javascript
POST /encuestas/15/estado
Body: { "activo": true }
```

### Opción 6: PATCH en vez de PUT
```javascript
PATCH /encuestas/15/estado
Body: { "activo": true }
```

### Opción 7: Endpoint diferente
```javascript
PUT /encuestas/15
Body: { "activo": true }
// Actualizar solo el campo activo
```

## 📋 Información necesaria del Swagger:

1. **Método HTTP:** PUT, POST, PATCH?
2. **Ruta exacta:** /encuestas/{id}/estado o diferente?
3. **Request Body Schema:** ¿Qué estructura espera?
4. **Parámetros:** ¿Query params, path params, body?

## 🛠️ Cómo verificar en Swagger:

1. Ir a: https://cab-project-spwl.onrender.com/swagger-ui/index.html
2. Buscar el endpoint de actualización de estado
3. Ver el ejemplo de "Request body"
4. Copiar el formato exacto

## 💡 Solución temporal:

Si el Swagger no está disponible, podemos:
- Revisar el código del backend (si tienes acceso)
- Usar herramientas como Postman para probar manualmente
- Ver en la red (Network tab) cómo otros sistemas similares lo hacen
