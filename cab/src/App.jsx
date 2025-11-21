import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Importa tus vistas
import Login from './pages/auth/Login';
import UnifiedDashboard from './pages/admin/UnifiedDashboard';
import UserManagement from './pages/admin/UserManagement';
import SurveyManagement from './pages/admin/SurveyManagement';
import SurveyForm from './pages/admin/SurveyForm';
import SurveyList from './pages/Surveyor/SurveyList';
import SurveyFillForm from './pages/Surveyor/SurveyFillForm';
import AppLayout from './components/layout/AppLayout';
import ResponseDetail from './pages/admin/ResponseDetail';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* RUTAS PROTEGIDAS PARA ADMINISTRADOR */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin/dashboard" element={<UnifiedDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/surveys" element={<SurveyManagement />} />

          {/* Surveys */}
          <Route path="/admin/surveys/new" element={<SurveyForm />} />
          <Route path="/admin/surveys/edit/:surveyId" element={<SurveyForm />} />
          <Route path="/admin/surveys/fill/:surveyId" element={<SurveyFillForm />} />

          {/* Analytics - Solo detalle de respuesta */}
          <Route path="/admin/analytics/response/:id" element={<ResponseDetail />} />
        </Route>
      </Route>

      {/* RUTAS PROTEGIDAS PARA ENCUESTADOR */}
      <Route element={<ProtectedRoute allowedRoles={['surveyor', 'admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/surveyor/list" element={<SurveyList />} />
          <Route path="/surveyor/fill/:surveyId" element={<SurveyFillForm />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
