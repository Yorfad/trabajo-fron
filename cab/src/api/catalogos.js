// src/api/catalogos.js
import API from "./axiosInstance";

/**
 * Obtiene la lista de todos los grupos focales.
 * (Embarazadas, General, etc.)
 */
export const getGruposFocales = () => {
  return API.get("/grupos-focales");
};

/**
 * Obtiene la lista de todas las categorías de preguntas.
 * (Agua y Enfermedades, Higiene Básica, etc.)
 */
export const getCategoriasPreguntas = () => {
  return API.get("/categorias-preguntas");
};

/**
 * Obtiene la lista de todas las comunidades.
 */
export const getComunidades = () => {
  return API.get("/comunidades");
};

/**
 * Obtiene la lista de todos los departamentos.
 */
export const getDepartamentos = () => {
  return API.get("/departamentos");
};

/**
 * Obtiene la lista de todos los municipios.
 */
export const getMunicipios = () => {
  return API.get("/municipios");
};