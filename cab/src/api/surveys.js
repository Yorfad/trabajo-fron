// src/api/surveys.js
import API from "./axiosInstance"; // Importamos el mismo Axios con el token

/**
 * Obtiene la lista de todas las encuestas (versión simple).
 * Corresponde a: GET /encuestas
 */
export const getSurveys = () => {
  return API.get("/encuestas");
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
  return API.post("/encuestas", surveyData);
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

/**
 * Crea una nueva respuesta de encuesta (llenado por el encuestador).
 * Corresponde a: POST /respuestas
 * @param {object} responseData - Los datos de la respuesta
 */
export const createSurveyResponse = (responseData) => {
  return API.post("/respuestas", responseData);
};

/**
 * Obtiene las encuestas activas disponibles para ser llenadas.
 * Corresponde a: GET /encuestas/activas
 * Fallback: Si falla, usa /encuestas y filtra en el cliente
 */
export const getActiveSurveys = async () => {
  try {
    // Intentar primero con el endpoint específico
    return await API.get("/encuestas/activas");
  } catch (error) {
    // Si falla (404 o 500), usar el endpoint general y filtrar
    if (error.response?.status === 404 || error.response?.status === 500) {
      console.log('Endpoint /encuestas/activas con problemas (status ' + error.response?.status + '), usando fallback');
      const response = await API.get("/encuestas");
      // Filtrar solo las activas
      const encuestasActivas = response.data.filter(e => e.estado === 'Activa');
      return { data: encuestasActivas };
    }
    // Si es otro error, lanzarlo
    throw error;
  }
};

/**
 * Genera un número de boleta único
 * Corresponde a: GET /respuestas/generar-boleta
 */
export const generateBoletaNumber = () => {
  return API.get("/respuestas/generar-boleta");
};

// NOTA: Basado en la API que mostraste, no hay un "Editar" completo
// (PUT /encuestas/{id}) ni un "Eliminar" (DELETE /encuestas/{id}).
// Solo se puede cambiar el ESTADO (Activa/Inactiva).