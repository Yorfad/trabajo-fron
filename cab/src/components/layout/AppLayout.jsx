// /src/components/layout/AppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Contenido principal desplazado por el sidebar */}
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar />
        <main className="p-8 flex-1">
          <Outlet /> {/* <- aquí se pintan las páginas hijas */}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
