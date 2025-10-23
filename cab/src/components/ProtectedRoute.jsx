import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// 'allowedRoles' debe ser un array: ['admin'], ['surveyor'], o ['admin', 'surveyor']
const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, userRole, loading } = useAuth();

    if (loading) {
        // Espera a que la lógica de AuthContext cargue
        return <div>Cargando...</div>; 
    }

    // 1. No autenticado? -> Ir a Login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 2. Autenticado y el rol está permitido? -> Mostrar la vista
    if (allowedRoles.includes(userRole)) {
        return <Outlet />;
    }

    // 3. Autenticado pero rol no permitido? -> Ir a Denegado o a un dashboard
    // Aquí redirigimos al dashboard del rol que SÍ tiene (ej. Admin logueado en ruta Surveyor)
    if (userRole === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
    }
    
    // Si no es admin, asume que es surveyor y lo manda a su dashboard
    return <Navigate to="/surveyor/list" replace />; 
};

export default ProtectedRoute;