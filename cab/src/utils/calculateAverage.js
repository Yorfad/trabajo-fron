/**
 * Utilidad para calcular promedios correctamente
 *
 * LÓGICA:
 * 1. Agrupar respuestas por pregunta
 * 2. Sumar puntos de cada pregunta (opciones múltiples suman)
 * 3. Calcular promedio de los totales de preguntas
 */

/**
 * Calcula el promedio correcto de una respuesta
 * @param {Array} detalles - Array de respuestas_detalle
 * @returns {number} Promedio en escala 0-10
 */
export function calcularPromedioRespuesta(detalles) {
  if (!detalles || detalles.length === 0) return 0;

  // Agrupar por pregunta y sumar puntajes
  const puntajesPorPregunta = {};

  detalles.forEach(detalle => {
    const idPregunta = detalle.id_pregunta;
    const puntaje = parseFloat(detalle.puntaje_0a10 || 0);

    if (!puntajesPorPregunta[idPregunta]) {
      puntajesPorPregunta[idPregunta] = 0;
    }

    puntajesPorPregunta[idPregunta] += puntaje;
  });

  // Calcular promedio de los totales de preguntas
  const totales = Object.values(puntajesPorPregunta);
  const promedio = totales.reduce((sum, val) => sum + val, 0) / totales.length;

  return promedio;
}

/**
 * Calcula el promedio de múltiples respuestas
 * @param {Array} respuestas - Array de respuestas con sus detalles
 * @returns {number} Promedio general
 */
export function calcularPromedioGeneral(respuestas) {
  if (!respuestas || respuestas.length === 0) return 0;

  const promedios = respuestas.map(respuesta => {
    return calcularPromedioRespuesta(respuesta.detalles || []);
  });

  const promedioGeneral = promedios.reduce((sum, val) => sum + val, 0) / promedios.length;

  return promedioGeneral;
}

/**
 * Calcula el promedio por categoría
 * @param {Array} detalles - Array de respuestas_detalle
 * @param {string} categoria - Nombre de la categoría
 * @returns {number} Promedio de la categoría
 */
export function calcularPromedioPorCategoria(detalles, categoria) {
  if (!detalles || detalles.length === 0) return 0;

  // Filtrar por categoría
  const detallesCategoria = detalles.filter(d => d.categoria_nombre === categoria || d.categoria === categoria);

  return calcularPromedioRespuesta(detallesCategoria);
}

/**
 * Obtiene el color del semáforo según el promedio
 * @param {number} promedio - Promedio en escala 0-10
 * @returns {string} Color del semáforo: 'Verde', 'Naranja', o 'Rojo'
 */
export function obtenerColorSemaforo(promedio) {
  if (promedio >= 6.67) return 'Verde';
  if (promedio >= 3.34) return 'Naranja';
  return 'Rojo';
}

/**
 * Recalcula todos los promedios de un conjunto de datos
 * @param {Object} data - Datos del dashboard
 * @returns {Object} Datos con promedios recalculados
 */
export function recalcularPromedios(data) {
  // Si hay respuestas individuales
  if (data.respuestas && Array.isArray(data.respuestas)) {
    data.respuestas = data.respuestas.map(respuesta => {
      const promedio = calcularPromedioRespuesta(respuesta.detalles || []);
      return {
        ...respuesta,
        promedio_respuesta: promedio.toFixed(2),
        color_semaforo: obtenerColorSemaforo(promedio)
      };
    });
  }

  // Si hay semáforo de preguntas
  if (data.semaforo_preguntas && Array.isArray(data.semaforo_preguntas)) {
    data.semaforo_preguntas = data.semaforo_preguntas.map(pregunta => {
      // Mantener el promedio original de la pregunta si existe
      return pregunta;
    });
  }

  return data;
}

/**
 * Calcula estadísticas de distribución de semáforos
 * @param {Array} respuestas - Array de respuestas
 * @returns {Object} Estadísticas de distribución
 */
export function calcularDistribucionSemaforos(respuestas) {
  if (!respuestas || respuestas.length === 0) {
    return {
      verde: 0,
      naranja: 0,
      rojo: 0,
      total: 0
    };
  }

  let verde = 0, naranja = 0, rojo = 0;

  respuestas.forEach(respuesta => {
    const promedio = calcularPromedioRespuesta(respuesta.detalles || []);
    const color = obtenerColorSemaforo(promedio);

    if (color === 'Verde') verde++;
    else if (color === 'Naranja') naranja++;
    else rojo++;
  });

  return {
    verde,
    naranja,
    rojo,
    total: respuestas.length,
    porcentajeVerde: ((verde / respuestas.length) * 100).toFixed(1),
    porcentajeNaranja: ((naranja / respuestas.length) * 100).toFixed(1),
    porcentajeRojo: ((rojo / respuestas.length) * 100).toFixed(1)
  };
}

export default {
  calcularPromedioRespuesta,
  calcularPromedioGeneral,
  calcularPromedioPorCategoria,
  obtenerColorSemaforo,
  recalcularPromedios,
  calcularDistribucionSemaforos
};
