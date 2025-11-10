import React from 'react';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SurveyList = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Mis Encuestas</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No hay encuestas asignadas</h3>
            <p className="mt-2 text-sm text-gray-500">
              Cuando el administrador te asigne encuestas, aparecerán aquí.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Estado de Encuestas</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">En Proceso</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Completadas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Puedes ver los datos recopilados en la sección{' '}
            <Link to="/surveyor/viewer" className="font-semibold underline">
              Visualización de Datos
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default SurveyList;
