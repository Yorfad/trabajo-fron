// /src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ¡CAMBIO AQUÍ! (Recibimos props)
const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { userRole } = useAuth();
  const isAdmin = (userRole || '').toLowerCase() === 'admin';

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/admin/users', label: 'Gestión de Usuarios', icon: '👥' },
    { path: '/admin/surveys', label: 'Crear Encuestas', icon: '📝' },
    { path: '/surveyor/list', label: 'Llenar Encuestas', icon: '✍️' },
    { path: '/surveyor/viewer', label: 'Ver Datos', icon: '🔎' },
    { path: '/admin/analytics', label: 'Analítica Global', icon: '📊' },
    { path: '/admin/analytics/filtered', label: 'Análisis Filtrado', icon: '🔍' },
  ];

  const surveyorLinks = [
    { path: '/surveyor/list', label: 'Encuestas Disponibles', icon: '📋' },
    { path: '/surveyor/viewer', label: 'Mis Datos', icon: '🔎' },
  ];

  const linksToShow = isAdmin ? adminLinks : surveyorLinks;

  return (
    <>
      {/* ¡CAMBIO AQUÍ! (Capa oscura de fondo para móvil) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black opacity-50 transition-opacity lg:hidden"
        ></div>
      )}

      {/* ¡CAMBIO AQUÍ! (Clases de Tailwind para responsividad) */}
      <div
        className={`fixed inset-y-0 left-0 z-30 min-h-screen w-64 transform bg-gray-800 text-white transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="border-b border-gray-700 p-4 text-2xl font-bold">
          CAB System ({isAdmin ? 'Admin' : 'Encuestador'})
        </div>

        <nav className="space-y-1 p-4">
          {linksToShow.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `block rounded px-4 py-2.5 transition duration-200 hover:bg-gray-700 ${
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
    </>
  );
};

export default Sidebar;
