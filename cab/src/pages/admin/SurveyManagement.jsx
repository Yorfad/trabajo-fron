// src/pages/admin/SurveyManagement.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSurveys, updateSurveyStatus, checkSurveyHasResponses, deleteSurvey } from '../../api/surveys';
// --- 1. IMPORTAR la API de catálogos ---
import { getGruposFocales } from '../../api/catalogos';

function SurveyManagement() {
  const [surveys, setSurveys] = useState([]);
  // --- 2. AÑADIR ESTADO para guardar los grupos focales ---
  const [gruposFocales, setGruposFocales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Estado para rastrear qué encuestas pueden ser eliminadas
  const [surveysCanDelete, setSurveysCanDelete] = useState({});
  const navigate = useNavigate();

  // Función para cargar SOLO las encuestas (la usaremos para refrescar)
  const fetchSurveys = async () => {
    try {
      const response = await getSurveys();
      setSurveys(response.data);
      setError(null);

      // Verificar qué encuestas pueden ser eliminadas
      // NOTA: Si el endpoint no existe (404), asumimos que no se puede eliminar
      const canDeleteMap = {};
      for (const survey of response.data) {
        try {
          const checkRes = await checkSurveyHasResponses(survey.id_encuesta);
          canDeleteMap[survey.id_encuesta] = !checkRes.data.hasResponses;
        } catch (err) {
          // Si es 404, el endpoint aún no está desplegado - deshabilitar eliminación
          if (err.response?.status === 404) {
            console.warn('El endpoint has-responses no está disponible. Asegúrate de desplegar el backend actualizado.');
            canDeleteMap[survey.id_encuesta] = false;
          } else {
            console.error(`Error al verificar respuestas de encuesta ${survey.id_encuesta}:`, err);
            canDeleteMap[survey.id_encuesta] = false;
          }
        }
      }
      setSurveysCanDelete(canDeleteMap);
    } catch (err) {
      console.error('Error al cargar encuestas:', err);
      setError('No se pudieron cargar las encuestas.');
    }
  };

  // Función para cargar SOLO los catálogos
  const fetchCatalogs = async () => {
    try {
      const gruposRes = await getGruposFocales();
      setGruposFocales(gruposRes.data || []);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
      // No sobreescribir el error principal si las encuestas fallan
      if (!error) setError('No se pudieron cargar los catálogos.');
    }
  };

  // --- 3. useEffect MODIFICADO para cargar todo en paralelo ---
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      // Carga ambas listas al mismo tiempo
      await Promise.all([fetchSurveys(), fetchCatalogs()]);
      setIsLoading(false);
    };
    loadAllData();
  }, []); // Se ejecuta solo una vez al montar

  // Función para alternar estado de encuesta
  const handleToggleStatus = async (survey) => {
    // El backend espera "Activa" o "Inactiva", no booleanos
    const nuevoEstado = survey.estado === 'Activa' ? 'Inactiva' : 'Activa';
    try {
      await updateSurveyStatus(survey.id_encuesta, nuevoEstado);
      fetchSurveys();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      alert('No se pudo actualizar el estado de la encuesta.');
    }
  };

  // Función para eliminar encuesta con confirmación
  const handleDelete = async (survey) => {
    // Verificar si puede eliminarse
    if (!surveysCanDelete[survey.id_encuesta]) {
      alert(
        'No se puede eliminar esta encuesta porque ya tiene respuestas registradas. ' +
        'Solo puede deshabilitarla cambiando su estado a Inactiva.'
      );
      return;
    }

    // Confirmación antes de eliminar
    const confirmacion = window.confirm(
      `¿Está seguro que desea ELIMINAR permanentemente la encuesta "${survey.titulo}"?\n\n` +
      'Esta acción NO se puede deshacer. Se eliminarán todas las preguntas y opciones asociadas.\n\n' +
      '¿Desea continuar?'
    );

    if (!confirmacion) {
      return;
    }

    try {
      await deleteSurvey(survey.id_encuesta);
      alert('Encuesta eliminada exitosamente.');
      fetchSurveys(); // Recargar la lista
    } catch (err) {
      console.error('Error al eliminar encuesta:', err);
      const errorMsg = err.response?.data?.msg || 'No se pudo eliminar la encuesta.';
      alert(errorMsg);
    }
  };

  // --- 4. FUNCIÓN HELPER para buscar el nombre del grupo ---
  const getGrupoNombre = (id) => {
    // Si los grupos aún no cargan, muestra 'Cargando...'
    if (gruposFocales.length === 0) return 'N/A';

    // Busca el grupo en la lista de catálogos
    const grupo = gruposFocales.find((g) => g.id_grupo_focal === id);

    // Devuelve el nombre si lo encuentra, o 'N/A' si no
    return grupo ? grupo.nombre : 'ID No Encontrado';
  };

  if (isLoading) {
    return <div className="p-4">Cargando gestión de encuestas...</div>;
  }

  if (error) {
    return <div className="p-4 font-bold text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestión de Encuestas</h1>
        <button
          onClick={() => navigate('/admin/surveys/new')}
          className="rounded-lg bg-blue-500 px-4 py-2 font-bold text-white shadow hover:bg-blue-700"
        >
          + Nueva Encuesta
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Título
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Grupo Focal
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Versión
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {surveys.length > 0 ? (
              surveys.map((survey) => (
                <tr key={survey.id_encuesta} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">{survey.id_encuesta}</td>
                  <td className="whitespace-nowrap px-4 py-3">{survey.titulo}</td>

                  {/* --- 5. CAMBIO AQUÍ: Usar la función helper --- */}
                  <td className="whitespace-nowrap px-4 py-3">
                    {getGrupoNombre(survey.id_grupo_focal)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">{survey.version}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {survey.estado === 'Activa' ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                        Activa
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      onClick={() => navigate(`/admin/surveys/edit/${survey.id_encuesta}`)}
                      className="mr-3 text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleStatus(survey)}
                      className={
                        survey.estado === 'Activa'
                          ? 'mr-3 text-red-600 hover:text-red-900'
                          : 'mr-3 text-green-600 hover:text-green-900'
                      }
                    >
                      {survey.estado === 'Activa' ? 'Desactivar' : 'Activar'}
                    </button>
                    {surveysCanDelete[survey.id_encuesta] ? (
                      <button
                        onClick={() => handleDelete(survey)}
                        className="text-red-700 hover:text-red-900 font-semibold"
                        title="Eliminar encuesta permanentemente"
                      >
                        Eliminar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(survey)}
                        className="text-gray-400 cursor-not-allowed"
                        title="No se puede eliminar porque tiene respuestas registradas"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                  No hay encuestas creadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SurveyManagement;
