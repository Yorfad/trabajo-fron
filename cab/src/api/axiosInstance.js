import axios from 'axios';

// 1. Crear una instancia base usando variables de entorno
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://cab-project-spwl.onrender.com/api',
  timeout: import.meta.env.VITE_API_TIMEOUT || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Interceptor de Solicitudes: Añade el JWT a cada Header
API.interceptors.request.use(
  (config) => {
    // Obtenemos el token del almacenamiento local (donde lo guardaremos al loguearse)
    const token = localStorage.getItem('jwt_token');

    // Si el token existe, se añade al header de la solicitud
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Manejar errores de solicitud
    return Promise.reject(error);
  }
);

export default API;
