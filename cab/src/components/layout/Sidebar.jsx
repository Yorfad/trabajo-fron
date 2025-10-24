// /src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { userRole } = useAuth();
  const isAdmin = (userRole || '').toLowerCase() === 'admin';

const adminLinks = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/admin/users', label: 'Gestión de Usuarios', icon: '👥' },
  { path: '/admin/surveys', label: 'Crear Encuestas', icon: '📝' },
  { path: '/admin/analytics', label: 'Analítica Global', icon: '📊' }, // ← Cambiar de DataAnalytics a analytics
];

const surveyorLinks = [
  { path: '/surveyor/viewer', label: 'Visor de Datos', icon: '📊' }, // ← Cambiar de DataViewer a viewer
  { path: '/surveyor/list', label: 'Encuestas Disponibles', icon: '📋' },
  { path: '/surveyor/my-data', label: 'Mis Datos', icon: '🔎' },
];


  const linksToShow = isAdmin ? adminLinks : surveyorLinks;

  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen fixed">
      <div className="p-4 text-2xl font-bold border-b border-gray-700">
        CAB System ({isAdmin ? 'Admin' : 'Encuestador'})
      </div>
      <nav className="p-4 space-y-1">
        {linksToShow.map(link => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 ${
                isActive ? 'bg-gray-900 font-bold' : ''
              }`
            }
            end
          >
            {link.icon} {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
