// src/pages/admin/SurveyManagement.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { getSurveys, updateSurveyStatus } from "../../api/surveys";
// --- 1. IMPORTAR la API de catálogos ---
import { getGruposFocales } from "../../api/catalogos";

function SurveyManagement() {
  const [surveys, setSurveys] = useState([]);
  // --- 2. AÑADIR ESTADO para guardar los grupos focales ---
  const [gruposFocales, setGruposFocales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null); // Para mostrar loading en el botón específico
  const navigate = useNavigate();

  // Función para cargar SOLO las encuestas (la usaremos para refrescar)
  const fetchSurveys = async () => {
    try {
      const response = await getSurveys();
      console.log("DATOS DE ENCUESTAS:", response.data);
      setSurveys(response.data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar encuestas:", err);
      setError("No se pudieron cargar las encuestas.");
    }
  };

  // Función para cargar SOLO los catálogos
  const fetchCatalogs = async () => {
    try {
      const gruposRes = await getGruposFocales();
      console.log("DATOS DE GRUPOS FOCALES:", gruposRes.data);
      setGruposFocales(gruposRes.data || []);
    } catch (err) {
      console.error("Error al cargar catálogos:", err);
      // No sobreescribir el error principal si las encuestas fallan
      if (!error) setError("No se pudieron cargar los catálogos.");
    }
  };

  // --- 3. useEffect MODIFICADO para cargar todo en paralelo ---
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      // Carga ambas listas al mismo tiempo
      await Promise.all([
        fetchSurveys(),
        fetchCatalogs()
      ]);
      setIsLoading(false);
    };
    loadAllData();
  }, []); // Se ejecuta solo una vez al montar

  // (Esta función está bien, ya llama a fetchSurveys)
  const handleToggleStatus = async (survey) => {
    // Manejar tanto survey.activo (boolean) como survey.estado (string)
    const estaActiva = survey.activo === true || survey.estado === "Activa";
    const nuevoEstado = !estaActiva;
    
    setProcessingId(survey.id_encuesta); // Marcar como procesando
    
    try {
      console.log('🔄 Cambiando estado de encuesta:', {
        id: survey.id_encuesta,
        estadoActual: estaActiva ? 'Activa' : 'Inactiva',
        nuevoEstado: nuevoEstado ? 'Activa' : 'Inactiva'
      });
      
      await updateSurveyStatus(survey.id_encuesta, nuevoEstado);
      
      console.log('✅ Estado actualizado correctamente');
      await fetchSurveys(); 
    } catch (err) {
      console.error("❌ Error al cambiar estado:", err);
      console.error("Respuesta del servidor:", err.response?.data);
      console.error("Status:", err.response?.status);
      
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error
        || err.message
        || "Error desconocido";
      
      alert(`No se pudo actualizar el estado de la encuesta.\n\nError: ${errorMessage}`);
    } finally {
      setProcessingId(null); // Quitar el loading
    }
  };
  
  // --- 4. FUNCIÓN HELPER para buscar el nombre del grupo ---
  const getGrupoNombre = (id) => {
    // Si los grupos aún no cargan, muestra 'Cargando...'
    if (gruposFocales.length === 0) return 'N/A';
    
    // Busca el grupo en la lista de catálogos
    const grupo = gruposFocales.find(g => g.id_grupo_focal == id);
    
    // Devuelve el nombre si lo encuentra, o 'N/A' si no
    return grupo ? grupo.nombre : 'ID No Encontrado';
  };


  if (isLoading) {
    return <div className="p-4">Cargando gestión de encuestas...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600 font-bold">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Encuestas</h1>
        <button 
          onClick={() => navigate('/admin/surveys/new')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow"
        >
          + Nueva Encuesta
        </button>
      </div>

      {/* Banner informativo sobre el flujo de trabajo */}
      <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">ℹ️ Cómo funciona el sistema de encuestas</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Nueva encuesta:</strong> Se crea inactiva por defecto.</li>
                <li><strong>Activar:</strong> Para poner la encuesta en uso y que los encuestadores puedan usarla.</li>
                <li><strong>Desactivar:</strong> Para retirar la encuesta del uso activo.</li>
                <li><strong>No hay edición:</strong> Si necesitas modificar preguntas, crea una nueva encuesta con versión actualizada (ej: v1.0 → v2.0).</li>
                <li><strong>Versiones:</strong> Solo una encuesta puede estar activa a la vez. Al activar una nueva, las demás se desactivan automáticamente.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Grupo Focal</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Versión</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {surveys.length > 0 ? (
              surveys.map((survey) => (
                <tr key={survey.id_encuesta} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap">{survey.id_encuesta}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{survey.titulo}</td>
                  
                  {/* --- 5. CAMBIO AQUÍ: Usar la función helper --- */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getGrupoNombre(survey.id_grupo_focal)}
                  </td>
                  
                  <td className="py-3 px-4 whitespace-nowrap">{survey.version}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {/* Manejar tanto survey.activo (boolean) como survey.estado (string) */}
                    {(survey.activo === true || survey.estado === "Activa") ? (
                      <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Activa</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Inactiva</span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleToggleStatus(survey)}
                      disabled={processingId === survey.id_encuesta}
                      className={`font-medium ${
                        processingId === survey.id_encuesta 
                          ? 'text-gray-400 cursor-wait' 
                          : (survey.activo === true || survey.estado === "Activa")
                            ? 'text-red-600 hover:text-red-900' 
                            : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {processingId === survey.id_encuesta 
                        ? '⏳ Procesando...' 
                        : (survey.activo === true || survey.estado === "Activa")
                          ? '🔴 Desactivar' 
                          : '✅ Activar'
                      }
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
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