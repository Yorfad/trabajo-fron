// /src/components/layout/Navbar.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button'; 
import { useNavigate } from 'react-router-dom';

const prettyRole = (r='') => (r.toLowerCase()==='admin' ? 'Admin' : 'Encuestador');

const Navbar = () => {
  const { logout, userRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true }); // evita volver con Back
  };

  return (
    <div className="bg-white shadow h-16 flex items-center justify-between px-6 border-b">
      <h1 className="text-xl font-semibold text-gray-800">Sistema de Control</h1>
      <div className="flex items-center space-x-4">
        <span className="text-gray-600">
          Rol: <span className="font-bold">{prettyRole(userRole)}</span>
        </span>
        <Button type="button" variant="secondary" onClick={handleLogout} className="ml-4">
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
