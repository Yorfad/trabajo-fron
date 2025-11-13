import axios from 'axios';

// 1. Crear una instancia base usando variables de entorno
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api-rest-cab.onrender.com/api',
  timeout: import.meta.env.VITE_API_TIMEOUT || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log de configuración (útil para debugging)
console.log('[API Config] Base URL:', API.defaults.baseURL);
console.log('[API Config] Timeout:', API.defaults.timeout);

// 2. Interceptor de Solicitudes: Añade el JWT a cada Header
API.interceptors.request.use(
  (config) => {
    // Obtenemos el token del almacenamiento local (donde lo guardaremos al loguearse)
    const token = localStorage.getItem('jwt_token');

    // Si el token existe, se añade al header de la solicitud
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log de la petición (útil para debugging)
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);

    return config;
  },
  (error) => {
    // Manejar errores de solicitud
    console.error('[API Request Error]:', error);
    return Promise.reject(error);
  }
);

// 3. Interceptor de Respuestas: Maneja errores de forma centralizada
API.interceptors.response.use(
  (response) => {
    // Log de respuesta exitosa
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Manejo mejorado de errores
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('[API Error Response]:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta (problema de red o CORS)
      console.error('[API Network Error]: No response received', {
        url: error.config?.url,
        message: error.message
      });
    } else {
      // Algo pasó al configurar la petición
      console.error('[API Config Error]:', error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
