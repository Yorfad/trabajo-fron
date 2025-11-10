// /src/components/layout/Navbar.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';

const prettyRole = (r = '') => (r.toLowerCase() === 'admin' ? 'Admin' : 'Encuestador');

// ¡CAMBIO AQUÍ! (Recibimos la prop)
const Navbar = ({ setSidebarOpen }) => {
  const { logout, userRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-16 items-center justify-between border-b bg-white px-6 shadow">
      {/* ¡CAMBIO AQUÍ! (Botón de Hamburguesa para móvil) */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="text-gray-500 focus:outline-none md:hidden"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </button>
      {/* ¡CAMBIO AQUÍ! (Ocultamos el título en móvil para dar espacio) */}
      <h1 className="hidden text-xl font-semibold text-gray-800 md:block">Sistema de Control</h1>
      {/* Tu código de Usuario/Logout (no cambia) */}
      <div className="flex items-center space-x-4">
        <span className="text-gray-600">
          Rol:
          <span className="font-bold">{prettyRole(userRole)}</span>
        </span>
        <Button type="button" variant="secondary" onClick={handleLogout} className="ml-4">
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
