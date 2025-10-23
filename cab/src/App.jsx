import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Importa tus vistas
import Login from './pages/auth/Login'; 
import DashboardAdmin from './pages/admin/DashboardAdmin';
import UserManagement from './pages/admin/UserManagement';
import SurveyList from './pages/Surveyor/SurveyList';
import AppLayout from './components/layout/AppLayout';
import DataViewer from './pages/Surveyor/DataViewer';
// ...otras vistas...

const App = () => {
    return (
        <Routes>

            <Route path="/" element={<Login />} />
            {/* Rutas Públicas (Login) */}
            <Route path="/login" element={<Login />} />
            {/* ... */}

            {/* RUTAS PROTEGIDAS PARA ADMINISTRADOR */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<AppLayout />}> {/* Usa AppLayout */}
                    <Route path="/admin/dashboard" element={<DashboardAdmin />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                    {/* ... */}
                </Route>
            </Route>

            {/* RUTAS PROTEGIDAS PARA ENCUESTADOR */}
            <Route element={<ProtectedRoute allowedRoles={['surveyor', 'admin']} />}>
                <Route element={<AppLayout />}> {/* Usa AppLayout */}
                    <Route path="/surveyor/list" element={<SurveyList />} />
                    <Route path="/surveyor/viewer" element={<DataViewer />} />
                    {/* ... */}
                </Route>
            </Route>
            
            {/* ... */}
        </Routes>
    );
};

export default App;