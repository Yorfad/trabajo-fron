import API from './axiosInstance.js';

/*CRUD de usuarios
Obtiene la lista de todos los usuarios registrados*/

//Corresponde a GET /api/usuarios
export const getUsers = () => {
  /*Nota: como esto es solo para Admin, la API requerirá un token
    Asegurar de que el axiosClient esté configurado
    para enviar el token (ver nota en aciosClient.js)*/
  return API.get('/usuarios');
};

/**
 * Crea un nuevo usuario.
 * Corresponde a: POST /usuarios
 * @param {object} userData - Datos del usuario (ej: { nombre_completo, email, password, rol_id })
 */
export const createUser = (userData) => {
  return API.post('/usuarios', userData);
};

/*Actualizar usuario existente
Corresponde a PUT /api/usuarios/:id
@param {number} id - ID del usuario a actualizar
@param {object} userData - Datos actualizados del usuario
*/
export const updateUser = (id, userData) => {
  return API.put(`/usuarios/${id}`, userData);
};

/*Eliminar usuario existente
Corresponde a DELETE /api/usuarios/:id
@param {number} id - ID del usuario a eliminar
*/
export const deleteUser = (id) => {
  return API.delete(`/usuarios/${id}`);
};
