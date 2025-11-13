# 📋 Instrucciones para Actualizar Backend (Node.js)

## Paso 1: Ejecutar Script SQL ✅

```bash
# Ejecuta el archivo: ALTER_respuestas_add_encuestada_fields.sql
# En SQL Server Management Studio o Azure Data Studio
```

---

## Paso 2: Modificar POST /respuestas (Guardar)

Busca el endpoint que maneja `POST /respuestas` y actualízalo así:

### Antes:
```javascript
// Controller o Route de POST /respuestas
router.post('/respuestas', async (req, res) => {
  const {
    boleta_num,
    id_encuesta,
    id_comunidad,
    fecha_entrevista,
    detalles
  } = req.body;

  const id_usuario = req.usuario.id_usuario; // del JWT

  // INSERT ...
});
```

### Después:
```javascript
// Controller o Route de POST /respuestas
router.post('/respuestas', async (req, res) => {
  const {
    boleta_num,
    id_encuesta,
    id_comunidad,
    fecha_entrevista,
    nombre_encuestada,    // ⬅️ AGREGAR
    edad_encuestada,      // ⬅️ AGREGAR
    sexo_encuestador,     // ⬅️ AGREGAR
    detalles
  } = req.body;

  const id_usuario = req.usuario.id_usuario; // del JWT

  // INSERT ... (ver abajo)
});
```

### Actualizar el INSERT SQL:

```javascript
// Ejemplo con mssql
const pool = await sql.connect(config);
const request = pool.request();

request.input('boleta_num', sql.BigInt, boleta_num);
request.input('id_encuesta', sql.BigInt, id_encuesta);
request.input('id_usuario', sql.BigInt, id_usuario);
request.input('id_comunidad', sql.Int, id_comunidad);
request.input('fecha_entrevista', sql.Date, fecha_entrevista);
request.input('nombre_encuestada', sql.NVarChar(200), nombre_encuestada || null);     // ⬅️ AGREGAR
request.input('edad_encuestada', sql.Int, edad_encuestada || null);                   // ⬅️ AGREGAR
request.input('sexo_encuestador', sql.Char(1), sexo_encuestador || null);             // ⬅️ AGREGAR

const result = await request.query(`
  INSERT INTO cab.respuestas (
    boleta_num,
    id_encuesta,
    id_usuario,
    id_comunidad,
    fecha_entrevista,
    nombre_encuestada,    -- ⬅️ AGREGAR
    edad_encuestada,      -- ⬅️ AGREGAR
    sexo_encuestador,     -- ⬅️ AGREGAR
    aplicada_en
  )
  OUTPUT INSERTED.id_respuesta
  VALUES (
    @boleta_num,
    @id_encuesta,
    @id_usuario,
    @id_comunidad,
    @fecha_entrevista,
    @nombre_encuestada,   -- ⬅️ AGREGAR
    @edad_encuestada,     -- ⬅️ AGREGAR
    @sexo_encuestador,    -- ⬅️ AGREGAR
    SYSDATETIME()
  )
`);

const id_respuesta = result.recordset[0].id_respuesta;
```

---

## Paso 3: Modificar GET /respuestas (Consultar)

Busca el endpoint que maneja `GET /respuestas` y actualiza el SELECT:

### Antes:
```sql
SELECT
  r.id_respuesta,
  r.boleta_num,
  r.id_encuesta,
  e.titulo AS encuestaNombre,
  r.id_comunidad,
  c.nombre AS comunidadNombre,
  -- ... otros campos
FROM cab.respuestas r
LEFT JOIN cab.encuestas e ON e.id_encuesta = r.id_encuesta
LEFT JOIN cab.comunidades c ON c.id_comunidad = r.id_comunidad
-- ... resto del query
```

### Después:
```sql
SELECT
  r.id_respuesta,
  r.boleta_num,
  r.nombre_encuestada,      -- ⬅️ AGREGAR
  r.edad_encuestada,        -- ⬅️ AGREGAR
  r.sexo_encuestador,       -- ⬅️ AGREGAR
  r.id_encuesta,
  e.titulo AS encuestaNombre,
  r.id_comunidad,
  c.nombre AS comunidadNombre,
  -- ... otros campos
FROM cab.respuestas r
LEFT JOIN cab.encuestas e ON e.id_encuesta = r.id_encuesta
LEFT JOIN cab.comunidades c ON c.id_comunidad = r.id_comunidad
-- ... resto del query
```

### Código completo del endpoint:

```javascript
// Ejemplo de GET /respuestas
router.get('/respuestas', async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT
        CONCAT(r.id_respuesta, '-', d.id_pregunta) AS id,
        r.id_respuesta,
        r.boleta_num,
        r.nombre_encuestada,      -- ⬅️ AGREGAR
        r.edad_encuestada,        -- ⬅️ AGREGAR
        r.sexo_encuestador,       -- ⬅️ AGREGAR
        r.id_encuesta,
        e.titulo AS encuestaNombre,
        r.id_comunidad,
        c.nombre AS comunidadNombre,
        m.nombre AS municipioNombre,
        dep.nombre AS departamentoNombre,
        r.id_usuario,
        u.nombre AS usuarioNombre,
        p.id_pregunta AS preguntaId,
        p.texto AS pregunta,
        p.tipo AS preguntaTipo,
        -- ... resto de campos
        d.valor_texto,
        d.valor_numerico,
        p.id_categoria_pregunta AS categoria,
        cat.nombre AS categoriaNombre,
        CAST(r.aplicada_en AS DATE) AS fecha
      FROM cab.respuestas r
      LEFT JOIN cab.encuestas e ON e.id_encuesta = r.id_encuesta
      LEFT JOIN cab.comunidades c ON c.id_comunidad = r.id_comunidad
      LEFT JOIN cab.municipios m ON m.id_municipio = c.id_municipio
      LEFT JOIN cab.departamentos dep ON dep.id_departamento = m.id_departamento
      LEFT JOIN cab.usuarios u ON u.id_usuario = r.id_usuario
      LEFT JOIN cab.respuestas_detalle d ON d.id_respuesta = r.id_respuesta
      LEFT JOIN cab.preguntas p ON p.id_pregunta = d.id_pregunta
      LEFT JOIN cab.categorias_preguntas cat ON cat.id_categoria_pregunta = p.id_categoria_pregunta
      WHERE r.estado = 'Enviada'
      ORDER BY r.boleta_num, p.orden
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener respuestas:', error);
    res.status(500).json({ error: 'Error al obtener respuestas' });
  }
});
```

---

## Paso 4: Probar

### 1. Ejecuta el script SQL:
```bash
# En SQL Server Management Studio
# Abre: ALTER_respuestas_add_encuestada_fields.sql
# Ejecuta (F5)
```

### 2. Reinicia el backend de Node.js:
```bash
# En la terminal del backend
npm run dev
# o
node server.js
```

### 3. Llena una nueva encuesta desde el frontend:
- Nombre de la mujer encuestada: **Juana Ramirez**
- Edad: **23**
- Sexo del encuestador: **Masculino (M)**

### 4. Verifica los logs del backend:
Deberías ver algo como:
```
📝 POST /respuestas - Recibido:
{
  "boleta_num": 20000128,
  "nombre_encuestada": "Juana Ramirez",
  "edad_encuestada": 23,
  "sexo_encuestador": "M"
}
✅ Respuesta guardada con ID: 48
```

### 5. Verifica en el DataViewer:
Los logs del frontend ahora deberían mostrar:
```
👤 ¿Existe campo "nombre_encuestada"? true
👤 ¿Existe campo "edad_encuestada"? true
👤 ¿Existe campo "sexo_encuestador"? true
```

---

## ✅ Checklist

- [ ] Ejecutar script SQL `ALTER_respuestas_add_encuestada_fields.sql`
- [ ] Verificar que las columnas se crearon en la tabla
- [ ] Actualizar POST /respuestas para recibir los 3 campos nuevos
- [ ] Actualizar el INSERT para guardar los 3 campos nuevos
- [ ] Actualizar GET /respuestas para devolver los 3 campos nuevos
- [ ] Reiniciar backend
- [ ] Llenar una nueva encuesta de prueba
- [ ] Verificar que se guarden correctamente
- [ ] Verificar que se muestren en DataViewer

---

## 🆘 Troubleshooting

### Error: "Invalid column name 'nombre_encuestada'"
- Verifica que ejecutaste el script SQL correctamente
- Ejecuta: `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'respuestas'`

### El frontend envía pero no se guarda
- Revisa los logs del backend
- Verifica que el INSERT incluya los nuevos campos
- Verifica que los `request.input()` estén correctos

### El backend guarda pero no devuelve
- Verifica que el SELECT del GET incluya los nuevos campos
- Verifica que no estés usando un `SELECT *` que cache columnas

---

## 📞 Soporte

Si tienes problemas:
1. Comparte los logs del backend
2. Comparte los logs del frontend
3. Ejecuta: `SELECT TOP 1 * FROM cab.respuestas ORDER BY id_respuesta DESC`
