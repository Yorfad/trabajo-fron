// /src/components/layout/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// ¡CAMBIO AQUÍ! (Recibimos props)
const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { userRole } = useAuth();
  const isAdmin = (userRole || "").toLowerCase() === "admin";

  const adminLinks = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/admin/users", label: "Gestión de Usuarios", icon: "👥" },
    { path: "/admin/surveys", label: "Crear Encuestas", icon: "📝" },
    { path: "/admin/analytics", label: "Analítica Global", icon: "📊" },
  ];

  const surveyorLinks = [
    { path: "/surveyor/list", label: "Encuestas Disponibles", icon: "📋" },
    { path: "/surveyor/viewer", label: "Mis Datos", icon: "🔎" },
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
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-white min-h-screen 
                    transform transition-transform duration-300 ease-in-out
                    md:translate-x-0 
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        
        
        <div className="p-4 text-2xl font-bold border-b border-gray-700">
          CAB System ({isAdmin ? "Admin" : "Encuestador"})  
        </div>
         
        <nav className="p-4 space-y-1">
           
          {linksToShow.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 ${
                  isActive ? "bg-gray-900 font-bold" : ""
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
