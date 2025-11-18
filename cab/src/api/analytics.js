import API from './axiosInstance';

/**
 * Obtiene estadísticas de todas las comunidades
 * GET /api/analytics/communities
 */
export const getAllCommunitiesStats = () => {
  return API.get('/analytics/communities');
};

/**
 * Obtiene análisis completo de una comunidad específica
 * GET /api/analytics/community/:id
 * @param {number} communityId - ID de la comunidad
 */
export const getAnalyticsByCommunity = (communityId) => {
  return API.get(`/analytics/community/${communityId}`);
};

/**
 * Obtiene datos de semáforo para una comunidad
 * GET /api/analytics/traffic-light/:id
 * @param {number} communityId - ID de la comunidad
 */
export const getTrafficLightData = (communityId) => {
  return API.get(`/analytics/traffic-light/${communityId}`);
};

/**
 * Compara múltiples comunidades
 * GET /api/analytics/compare?ids=1,2,3
 * @param {array} communityIds - Array de IDs de comunidades
 */
export const compareCommunities = (communityIds) => {
  const ids = communityIds.join(',');
  return API.get(`/analytics/compare?ids=${ids}`);
};

/**
 * Obtiene análisis detallado por categoría de preguntas
 * GET /api/analytics/category/:categoria
 * @param {string} categoria - Nombre de la categoría
 * @param {number} communityId - (Opcional) ID de comunidad para filtrar
 */
export const getAnalyticsByCategory = (categoria, communityId = null) => {
  const params = communityId ? `?communityId=${communityId}` : '';
  return API.get(`/analytics/category/${encodeURIComponent(categoria)}${params}`);
};

/**
 * Obtiene análisis filtrado por comunidad, vuelta y encuesta
 * GET /api/analytics/filtered?comunidad=1&vuelta=1&encuesta=5
 * @param {number} comunidad - ID de la comunidad
 * @param {number} vuelta - Número de vuelta
 * @param {number} encuesta - ID de la encuesta
 */
export const getFilteredAnalytics = (comunidad, vuelta, encuesta) => {
  return API.get(`/analytics/filtered?comunidad=${comunidad}&vuelta=${vuelta}&encuesta=${encuesta}`);
};

/**
 * Obtiene detalle completo de una respuesta individual
 * GET /api/analytics/response/:id
 * @param {number} responseId - ID de la respuesta
 */
export const getResponseDetail = (responseId) => {
  return API.get(`/analytics/response/${responseId}`);
};
