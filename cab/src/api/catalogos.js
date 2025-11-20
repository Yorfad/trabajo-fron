// src/api/catalogos.js
import API from './axiosInstance';

/**
 * Obtiene la lista de todos los grupos focales.
 * (Embarazadas, General, etc.)
 */
export const getGruposFocales = () => {
  return API.get('/grupos-focales');
};

/**
 * Obtiene la lista de todas las categorías de preguntas.
 * (Agua y Enfermedades, Higiene Básica, etc.)
 */
export const getCategoriasPreguntas = () => {
  return API.get('/categorias-preguntas');
};

/**
 * Obtiene la lista de todas las comunidades.
 */
export const getComunidades = () => {
  return API.get('/comunidades');
};

/**
 * Obtiene la lista de todos los departamentos.
 */
export const getDepartamentos = () => {
  return API.get('/departamentos');
};

/**
 * Obtiene la lista de todos los municipios.
 */
export const getMunicipios = () => {
  return API.get('/municipios');
};

/**
 * Obtiene datos de un catálogo dinámico
 * @param {string} tabla - Nombre de la tabla
 * @param {string} valor - Columna para el valor
 * @param {string} etiqueta - Columna para la etiqueta
 */
export const getCatalogData = (tabla, valor, etiqueta) => {
  return API.get('/catalogos/data', {
    params: { tabla, valor, etiqueta }
  });
};

/**
 * Obtiene la lista de catálogos disponibles
 */
export const getAvailableCatalogs = () => {
  return API.get('/catalogos/available');
};

/**
 * Obtiene los municipios de un departamento específico
 * @param {number} id_departamento - ID del departamento
 */
export const getMunicipiosByDepartamento = (id_departamento) => {
  return API.get(`/departamentos/${id_departamento}/municipios`);
};

/**
 * Obtiene las comunidades de un municipio específico
 * @param {number} id_municipio - ID del municipio
 */
export const getComunidadesByMunicipio = (id_municipio) => {
  return API.get(`/municipios/${id_municipio}/comunidades`);
};

/**
 * Crea una nueva categoría de pregunta
 * @param {object} categoria - Datos de la categoría (nombre, descripcion)
 */
export const createCategoriaPregunta = (categoria) => {
  return API.post('/categorias-preguntas', categoria);
};
