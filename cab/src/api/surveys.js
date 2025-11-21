// src/api/surveys.js
import API from './axiosInstance'; // Importamos el mismo Axios con el token

/**
 * Obtiene la lista de todas las encuestas (versión simple).
 * Corresponde a: GET /encuestas
 */
export const getSurveys = () => {
  return API.get('/encuestas');
};

/**
 * Obtiene el detalle completo de UNA encuesta,
 * incluyendo sus preguntas y opciones.
 * Corresponde a: GET /encuestas/{id}
 * @param {number|string} id - El ID de la encuesta
 */
export const getSurveyById = (id) => {
  return API.get(`/encuestas/${id}`);
};

/**
 * Crea una nueva encuesta con sus preguntas y opciones.
 * Corresponde a: POST /encuestas
 * @param {object} surveyData - El JSON completo de la encuesta (como el que mostraste)
 */
export const createSurvey = (surveyData) => {
  return API.post('/encuestas', surveyData);
};

/**
 * Actualiza el estado de una encuesta (Activa/Inactiva).
 * Corresponde a: PUT /encuestas/{id}/estado
 * @param {number|string} id - El ID de la encuesta
 * @param {string} estado - "Activa" o "Inactiva"
 */
export const updateSurveyStatus = (id, estado) => {
  // La API espera un body, ej: { "estado": "Activa" }
  return API.put(`/encuestas/${id}/estado`, { estado });
};

/**
 * Verifica si una encuesta tiene respuestas registradas.
 * Corresponde a: GET /encuestas/{id}/has-responses
 * @param {number|string} id - El ID de la encuesta
 * @returns {Promise} - { hasResponses: boolean, respuestas_count: number }
 */
export const checkSurveyHasResponses = (id) => {
  return API.get(`/encuestas/${id}/has-responses`);
};

/**
 * Elimina una encuesta (solo si no tiene respuestas).
 * Corresponde a: DELETE /encuestas/{id}
 * @param {number|string} id - El ID de la encuesta
 */
export const deleteSurvey = (id) => {
  return API.delete(`/encuestas/${id}`);
};
