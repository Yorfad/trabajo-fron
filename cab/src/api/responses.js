import API from './axiosInstance';

/**
 * Envía las respuestas de una encuesta completada
 * POST /api/respuestas
 * @param {object} data - Datos de la respuesta
 * @param {number} data.boleta_num - Código único de la boleta
 * @param {number} data.id_encuesta - ID de la encuesta
 * @param {number} data.id_comunidad - ID de la comunidad
 * @param {string} data.nombre_encuestada - Nombre de la persona encuestada
 * @param {number} data.edad_encuestada - Edad de la encuestada
 * @param {string} data.sexo_encuestador - Sexo del encuestador (F/M)
 * @param {string} data.fecha_entrevista - Fecha de la entrevista (YYYY-MM-DD)
 * @param {array} data.respuestas - Array de respuestas
 */
export const submitSurveyResponse = (data) => {
  return API.post('/respuestas', data);
};

/**
 * Obtiene todas las respuestas
 * GET /api/respuestas
 */
export const getAllResponses = () => {
  return API.get('/respuestas');
};

/**
 * Obtiene las respuestas de una comunidad específica
 * GET /api/respuestas?id_comunidad=X
 * @param {number} communityId - ID de la comunidad
 */
export const getResponsesByCommunity = (communityId) => {
  return API.get(`/respuestas?id_comunidad=${communityId}`);
};

/**
 * Obtiene las respuestas de una encuesta específica
 * GET /api/respuestas?id_encuesta=X
 * @param {number} surveyId - ID de la encuesta
 */
export const getResponsesBySurvey = (surveyId) => {
  return API.get(`/respuestas?id_encuesta=${surveyId}`);
};

/**
 * Anula una respuesta
 * PUT /api/respuestas/:id/anular
 * @param {number} id - ID de la respuesta
 * @param {string} motivo - Motivo de anulación
 */
export const cancelResponse = (id, motivo) => {
  return API.put(`/respuestas/${id}/anular`, { motivo });
};

/**
 * Cuenta las respuestas registradas para una comunidad y encuesta específica
 * GET /api/respuestas/count/:id_comunidad/:id_encuesta
 * @param {number} id_comunidad - ID de la comunidad
 * @param {number} id_encuesta - ID de la encuesta
 * @returns {Promise} - { respuestas_count, next_vuelta }
 */
export const getResponsesCount = (id_comunidad, id_encuesta) => {
  return API.get(`/respuestas/count/${id_comunidad}/${id_encuesta}`);
};
