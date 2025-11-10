import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import API from '../api/axiosInstance';
import { normalizeRoleForAuth } from '../utils/roleUtils';

const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          const rawRole = decoded.role || decoded.rol || decoded.roleName || decoded?.user?.role;
          setIsAuthenticated(true);
          setUserRole(normalizeRoleForAuth(rawRole));
        } else {
          handleLogout();
        }
      } catch (e) {
        console.error('Token inválido:', e);
        handleLogout();
      }
    }
    setLoading(false);
  }, []);

  // Función de Login
  const handleLogin = async (credentials) => {
    try {
      const res = await API.post('/auth/login', {
        correo: (credentials.username ?? credentials.email)?.trim(),
        password: (credentials.password ?? '').trim(),
      });

      const token =
        res.data?.token || res.data?.accessToken || res.data?.jwt || res.data?.data?.token;

      if (!token) throw new Error('La API no devolvió token');

      localStorage.setItem('jwt_token', token);

      const decoded = jwtDecode(token);

      const rawRole = decoded.role || decoded.rol || decoded.roleName || decoded?.user?.role;
      const role = normalizeRoleForAuth(rawRole);

      setIsAuthenticated(true);
      setUserRole(role);
      return role; // 👈 Login.jsx usará este valor para navegar
    } catch (e) {
      console.error('Login error:', e.response?.status, e.response?.data || e.message);
      throw new Error(
        e.response?.data?.message || e.response?.data?.error || 'Credenciales inválidas'
      );
    }
  };

  // Función de Logout
  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setIsAuthenticated(false);
    setUserRole(null);
    // Opcional: Redirigir al usuario al login aquí
  };

  const value = {
    isAuthenticated,
    userRole,
    loading,
    login: handleLogin,
    logout: handleLogout,
  };

  if (loading) {
    // Aquí podría poner un componente de "Cargando..."
    return <div>Cargando sesión...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
