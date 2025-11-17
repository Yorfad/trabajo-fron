import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, Edit, RefreshCw, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getSurveys } from '../../api/surveys';

const SurveyList = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getSurveys();
      const allSurveys = response.data;

      // Filtrar solo encuestas activas
      const activeSurveys = allSurveys.filter((s) => s.estado === 'Activa');
      setSurveys(activeSurveys);
      setLoading(false);
    } catch (err) {
      console.error('Error cargando encuestas:', err);
      setError('No se pudieron cargar las encuestas');
      setLoading(false);
    }
  };

  const handleFillSurvey = (surveyId) => {
    navigate(`/surveyor/fill/${surveyId}`);
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Error al cargar encuestas</h3>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={loadSurveys}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mis Encuestas</h1>
            <p className="mt-1 text-gray-600">Encuestas disponibles para completar</p>
          </div>
          <button
            onClick={loadSurveys}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="rounded-lg bg-white py-12 text-center shadow-md">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando encuestas...</p>
          </div>
        ) : surveys.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey) => (
              <div
                key={survey.id_encuesta}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{survey.titulo}</h3>
                    <p className="mt-1 text-sm text-gray-600">{survey.descripcion}</p>
                  </div>
                  <span className="ml-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                    Activa
                  </span>
                </div>

                <div className="mb-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Versión {survey.version}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Vigente:{' '}
                      {new Date(survey.vigente_desde).toLocaleDateString()} -{' '}
                      {new Date(survey.vigente_hasta).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleFillSurvey(survey.id_encuesta)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-white transition hover:bg-blue-700"
                >
                  <Edit className="h-5 w-5" />
                  Llenar Encuesta
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No hay encuestas activas</h3>
            <p className="mt-2 text-sm text-gray-500">
              Cuando haya encuestas activas disponibles, aparecerán aquí.
            </p>
          </div>
        )}

        {/* Estadísticas */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Estado de Encuestas</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{surveys.length}</p>
                <p className="text-sm text-gray-600">Disponibles</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-600">En Proceso</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-600">Completadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Puedes ver los datos recopilados en la sección{' '}
            <Link to="/surveyor/viewer" className="font-semibold underline">
              Visualización de Datos
            </Link>
            . Recuerda ingresar el código único de boleta para cada encuesta.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SurveyList;
