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
 * @param {boolean} estado - true para activa, false para inactiva
 */
export const updateSurveyStatus = (id, estado) => {
  // La API espera un body, ej: { "activo": true }
  return API.put(`/encuestas/${id}/estado`, { activo: estado });
};

// NOTA: Basado en la API que mostraste, no hay un "Editar" completo
// (PUT /encuestas/{id}) ni un "Eliminar" (DELETE /encuestas/{id}).
// Solo se puede cambiar el ESTADO (Activa/Inactiva).
