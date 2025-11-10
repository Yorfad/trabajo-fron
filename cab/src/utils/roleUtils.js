/**
 * Utilidades para manejo consistente de roles en toda la aplicación
 */

/**
 * Normaliza un rol del backend al formato usado en el frontend (para routing y permisos)
 * @param {string} role - Rol del backend (puede ser 'Admin', 'Encuestador', etc.)
 * @returns {string} - Rol normalizado ('admin' o 'surveyor')
 */
export const normalizeRoleForAuth = (role) => {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'encuestador' || r === 'surveyor') return 'surveyor';
  return 'surveyor'; // Default
};

/**
 * Normaliza un rol para mostrar en la UI (capitalizado)
 * @param {string} role - Rol en cualquier formato
 * @returns {string} - Rol formateado para UI ('Admin' o 'Encuestador')
 */
export const normalizeRoleForDisplay = (role) => {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return 'Admin';
  if (r === 'encuestador' || r === 'surveyor') return 'Encuestador';
  return 'Encuestador'; // Default
};

/**
 * Convierte rol del frontend al formato del backend
 * @param {string} role - Rol del frontend ('admin' o 'surveyor')
 * @returns {string} - Rol del backend ('Admin' o 'Encuestador')
 */
export const roleToBackend = (role) => {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return 'Admin';
  if (r === 'surveyor' || r === 'encuestador') return 'Encuestador';
  return 'Encuestador'; // Default
};

// Constantes de roles
export const ROLES = {
  ADMIN: 'admin',
  SURVEYOR: 'surveyor',
};

export const ROLES_DISPLAY = {
  ADMIN: 'Admin',
  SURVEYOR: 'Encuestador',
};
