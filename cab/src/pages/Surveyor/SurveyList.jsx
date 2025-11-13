// src/pages/Surveyor/SurveyList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveSurveys } from '../../api/surveys';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const SurveyList = () => {
  const [surveys, setSurveys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadActiveSurveys();
  }, []);

  const loadActiveSurveys = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Cargando encuestas activas...');
      const response = await getActiveSurveys();
      console.log('Respuesta recibida:', response);

      setSurveys(response.data || []);
    } catch (err) {
      console.error('Error detallado cargando encuestas activas:', err);
      console.error('Error response:', err.response);

      let errorMessage = 'No se pudieron cargar las encuestas disponibles.';

      if (err.response?.status === 401) {
        errorMessage = 'Sesión expirada. Por favor inicie sesión nuevamente.';
      } else if (err.response?.status === 403) {
        errorMessage = 'No tiene permisos para ver las encuestas.';
      } else if (err.response?.data?.msg) {
        errorMessage = err.response.data.msg;
      } else if (err.message) {
        errorMessage += ' ' + err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSurvey = (surveyId) => {
    navigate(`/surveyor/survey/${surveyId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Cargando encuestas disponibles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <div className="text-red-700">
            <p className="font-semibold mb-2">Error</p>
            <p>{error}</p>
            <Button
              variant="secondary"
              onClick={loadActiveSurveys}
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Encuestas Disponibles</h1>
        <p className="text-gray-600 mt-2">
          Selecciona una encuesta para comenzar el llenado
        </p>
      </div>

      {surveys.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium">No hay encuestas disponibles</p>
            <p className="text-sm mt-1">
              No se encontraron encuestas activas en este momento
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <Card key={survey.id_encuesta} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                      {survey.titulo}
                    </h3>
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full whitespace-nowrap">
                      Activa
                    </span>
                  </div>

                  {survey.descripcion && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {survey.descripcion}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <span>Versión: {survey.version}</span>
                    </div>

                    {survey.vigente_desde && (
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          Vigente desde: {new Date(survey.vigente_desde).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {survey.preguntas_count && (
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{survey.preguntas_count} preguntas</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Button
                    variant="primary"
                    onClick={() => handleStartSurvey(survey.id_encuesta)}
                    className="w-full"
                  >
                    Iniciar Encuesta
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {surveys.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Total de encuestas disponibles: {surveys.length}</p>
        </div>
      )}
    </div>
  );
};

export default SurveyList;
