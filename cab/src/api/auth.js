// src/api/auth.js
import { jwtDecode } from 'jwt-decode';

/**
 * Obtiene el token JWT del localStorage
 * @returns {string|null} El token o null si no existe
 */
export const getToken = () => {
  return localStorage.getItem('jwt_token');
};

/**
 * Decodifica el token JWT y obtiene la informaci�n del usuario
 * @returns {object|null} Objeto con los datos del usuario o null si no hay token
 */
export const getCurrentUser = () => {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode(token);

    // El token contiene: id, nombre, correo, rol, exp, iat
    return {
      id: decoded.id,
      nombre: decoded.nombre,
      correo: decoded.correo,
      rol: decoded.rol
    };
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return null;
  }
};

/**
 * Verifica si el usuario est� autenticado
 * @returns {boolean} true si hay un token v�lido
 */
export const isAuthenticated = () => {
  const token = getToken();

  if (!token) {
    return false;
  }

  try {
    const decoded = jwtDecode(token);

    // Verificar si el token ha expirado
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

/**
 * Cierra la sesi�n del usuario
 */
export const logout = () => {
  localStorage.removeItem('jwt_token');
};
