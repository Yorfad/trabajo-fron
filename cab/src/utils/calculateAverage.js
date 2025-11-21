/**
 * Utilidad para calcular promedios correctamente
 *
 * LÓGICA:
 * 1. Agrupar respuestas por pregunta
 * 2. Sumar puntos de cada pregunta (opciones múltiples suman)
 * 3. Calcular promedio de los totales de preguntas
 */

/**
 * Calcula el puntaje máximo correcto de una pregunta desde los detalles
 * @param {Array} detalles - Todos los detalles de la pregunta (de todos los usuarios)
 * @param {string} tipoPregunta - Tipo de pregunta
 * @returns {number} Puntaje máximo correcto
 */
function calcularPuntajeMaximoCorrecto(detalles, tipoPregunta) {
  if (!detalles || detalles.length === 0) return 10;

  const puntos = detalles.map(d => parseFloat(d.puntos || 0));

  // Para SiNo y OpcionUnica: MAX de puntos
  if (tipoPregunta === 'SiNo' || tipoPregunta === 'OpcionUnica') {
    return Math.max(...puntos, 1); // Mínimo 1
  }

  // Para OpcionMultiple: SUM de puntos únicos
  if (tipoPregunta === 'OpcionMultiple') {
    // Obtener opciones únicas y sumar sus puntos
    const opcionesUnicas = {};
    detalles.forEach(d => {
      if (d.id_opcion && !opcionesUnicas[d.id_opcion]) {
        opcionesUnicas[d.id_opcion] = parseFloat(d.puntos || 1);
      }
    });
    const suma = Object.values(opcionesUnicas).reduce((a, b) => a + b, 0);
    return Math.max(suma, 1); // Mínimo 1
  }

  // Para otros tipos: usar 10
  return 10;
}

/**
 * Calcula el promedio correcto de una respuesta
 * IGNORA puntaje_0a10 de la BD y recalcula desde puntos
 * @param {Array} detalles - Array de respuestas_detalle
 * @returns {number} Promedio en escala 0-10
 */
export function calcularPromedioRespuesta(detalles) {
  if (!detalles || detalles.length === 0) {
    console.log('⚠️ calcularPromedioRespuesta: No hay detalles');
    return 0;
  }

  console.log('🔢 calcularPromedioRespuesta: Recibido', detalles.length, 'detalles');

  // Agrupar por pregunta
  const preguntasAgrupadas = {};

  detalles.forEach(detalle => {
    const idPregunta = detalle.id_pregunta;
    if (!preguntasAgrupadas[idPregunta]) {
      preguntasAgrupadas[idPregunta] = {
        tipo: detalle.pregunta_tipo || detalle.tipo || 'SiNo',
        detalles: []
      };
    }
    preguntasAgrupadas[idPregunta].detalles.push(detalle);
  });

  console.log('🔢 Preguntas agrupadas:', Object.keys(preguntasAgrupadas).length);

  // Calcular puntaje de cada pregunta
  const puntajesPorPregunta = [];

  Object.entries(preguntasAgrupadas).forEach(([idPregunta, pregunta]) => {
    const { tipo, detalles: detallesPregunta } = pregunta;

    // Sumar puntos de esta pregunta (para opciones múltiples)
    const puntosTotal = detallesPregunta.reduce((sum, d) => {
      const puntos = parseFloat(d.puntos || 0);
      console.log(`  - Detalle pregunta ${idPregunta}: puntos=${puntos}`, d);
      return sum + puntos;
    }, 0);

    // Calcular puntaje máximo correcto
    const puntajeMaximo = calcularPuntajeMaximoCorrecto(detallesPregunta, tipo);

    // Calcular puntaje en escala 0-10
    const puntaje = puntajeMaximo > 0 ? (puntosTotal / puntajeMaximo) * 10 : 0;

    console.log(`🔢 Pregunta ${idPregunta} (${tipo}): puntos=${puntosTotal}, max=${puntajeMaximo}, puntaje=${puntaje}`);

    puntajesPorPregunta.push(Math.max(0, Math.min(10, puntaje))); // Limitar entre 0 y 10
  });

  // Calcular promedio de todas las preguntas
  if (puntajesPorPregunta.length === 0) {
    console.log('⚠️ No hay puntajes por pregunta');
    return 0;
  }

  const promedio = puntajesPorPregunta.reduce((sum, val) => sum + val, 0) / puntajesPorPregunta.length;

  console.log(`🔢 Promedio final: ${promedio} (de ${puntajesPorPregunta.length} preguntas)`);

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
