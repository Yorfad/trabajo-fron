// /src/components/layout/AppLayout.jsx
import React, { useState } from 'react'; // 1. Importar useState
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppLayout = () => {
  // 2. Estado para manejar la visibilidad del sidebar en móvil
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    // 'relative' es necesario para el 'absolute' del sidebar móvil
    <div className="relative flex min-h-screen bg-gray-50">
      {/* 3. Sidebar */}
      {/* Le pasamos el estado y la función para que se pueda controlar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* 4. Contenido principal */}
      {/* ¡CAMBIOS CLAVE AQUÍ!
        - 'w-full' -> Ocupa siempre el 100% de ancho.
        - 'md:ml-64' -> EN DESKTOP (md) aplica el margen. En móvil es 'ml-0'.
      */}
      <div className="flex w-full flex-1 flex-col md:ml-64">
        {/* 5. Navbar */}
        {/* Le pasamos la función de 'abrir' (setSidebarOpen) */}
        <Navbar setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 p-4 md:p-8">
          <Outlet /> {/* <- aquí se pintan las páginas hijas */}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
