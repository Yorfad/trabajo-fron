// /src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { userRole } = useAuth();
    const location = useLocation();

    // 1. Definición de enlaces por rol
    const adminLinks = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
        { path: '/admin/users', label: 'Gestión de Usuarios', icon: '👥' },
        { path: '/admin/surveys', label: 'Crear Encuestas', icon: '📝' },
        { path: '/admin/analytics', label: 'Analítica Global', icon: '📊' },
    ];

    const surveyorLinks = [
        { path: '/surveyor/list', label: 'Encuestas Disponibles', icon: '📋' },
        { path: '/surveyor/viewer', label: 'Mis Datos', icon: '🔎' },
    ];
    
    // Seleccionar los enlaces a mostrar
    const linksToShow = userRole === 'admin' ? adminLinks : surveyorLinks;

    return (
        <div className="w-64 bg-gray-800 text-white min-h-screen fixed">
            <div className="p-4 text-2xl font-bold border-b border-gray-700">
                CAB System ({userRole === 'admin' ? 'Admin' : 'Encuestador'})
            </div>
            <nav className="p-4">
                {linksToShow.map(link => (
                    <Link 
                        key={link.path} 
                        to={link.path}
                        className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 ${
                            location.pathname.startsWith(link.path) ? 'bg-gray-900 font-bold' : ''
                        }`}
                    >
                        {link.icon} {link.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;