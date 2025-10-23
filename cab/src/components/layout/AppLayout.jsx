// /src/components/layout/AppLayout.jsx
import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

// Este layout debe usarse para envolver TODAS las vistas protegidas
const AppLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Barra lateral - fixed position */}
            <Sidebar /> 
            
            {/* Contenido principal - con margen a la izquierda para el Sidebar */}
            <div className="flex-1 ml-64 flex flex-col">
                {/* Barra de navegación superior */}
                <Navbar /> 
                
                {/* Contenido de la página */}
                <main className="p-8 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;