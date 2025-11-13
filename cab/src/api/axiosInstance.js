import axios from 'axios';

// 1. Crear una instancia base
const API = axios.create({
    // DESARROLLO: Usando API local
    baseURL: 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// 2. Interceptor de Solicitudes: Añade el JWT a cada Header
API.interceptors.request.use(
    (config) => {
        // Obtenemos el token del almacenamiento local (donde lo guardaremos al loguearse)
        const token = localStorage.getItem('jwt_token');

        // Si el token existe, se añade al header de la solicitud
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Token agregado al request:', config.url);
        } else {
            console.warn('No hay token JWT disponible para:', config.url);
        }
        return config;
    },
    (error) => {
        // Manejar errores de solicitud
        return Promise.reject(error);
    }
);

// 3. Interceptor de Respuestas: Manejar errores de autenticación
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('Error 401: Token inválido o expirado');
            // Opcional: Limpiar token y redirigir al login
            // localStorage.removeItem('jwt_token');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;