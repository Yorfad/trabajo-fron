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
    const nuevoEstado = !survey.activo;
    try {
      await updateSurveyStatus(survey.id_encuesta, nuevoEstado);
      fetchSurveys(); 
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      alert("No se pudo actualizar el estado de la encuesta.");
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
                    {survey.activo ? (
                      <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Activa</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Inactiva</span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button 
                      onClick={() => navigate(`/admin/surveys/edit/${survey.id_encuesta}`)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(survey)}
                      className={survey.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                    >
                      {survey.activo ? 'Desactivar' : 'Activar'}
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