// src/pages/admin/SurveyForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSurveyById, createSurvey } from '../../api/surveys';
import { getGruposFocales, getCategoriasPreguntas } from '../../api/catalogos';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input'; // Usaremos tu Input

// Estado inicial para una pregunta nueva
const newQuestionInitialState = {
  // Usamos un ID temporal para el 'key' de React
  tempId: Date.now(), 
  id_categoria_pregunta: '',
  texto: '',
  tipo: 'OpcionUnica', // Tipo por defecto
  orden: 1, // (Podríamos manejar esto luego)
  opciones: [],
};

// Estado inicial para una opción nueva
const newOptionInitialState = {
  tempId: Date.now(),
  etiqueta: '', // El texto que ve el usuario (ej: "Casi siempre")
  valor: '',   // El valor que se guarda (ej: "casi_siempre")
  puntos: 0,
  orden: 1,
};

// Estado inicial para una encuesta nueva
const newSurveyInitialState = {
  titulo: '',
  descripcion: '',
  id_grupo_focal: '',
  version: '1.0',
  preguntas: [],
};

function SurveyForm() {
  const [survey, setSurvey] = useState(newSurveyInitialState);
  const [catalogs, setCatalogs] = useState({ grupos: [], categorias: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(surveyId);

  // --- 1. Carga de Datos (Catálogos y Encuesta existente) ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Cargamos catálogos en paralelo
        const [gruposRes, categoriasRes] = await Promise.all([
          getGruposFocales(),
          getCategoriasPreguntas(),
        ]);
        
        const loadedCatalogs = {
          grupos: gruposRes.data || [],
          categorias: categoriasRes.data || [],
        };
        setCatalogs(loadedCatalogs);

        if (isEditMode) {
          const surveyRes = await getSurveyById(surveyId);
          // Añadimos 'tempId' a las preguntas y opciones para la gestión del estado
          const surveyData = {
            ...surveyRes.data,
            preguntas: surveyRes.data.preguntas.map(p => ({
              ...p,
              tempId: p.id_pregunta || Date.now(),
              opciones: p.opciones.map(o => ({
                ...o,
                tempId: o.id_opcion || Date.now(),
              }))
            }))
          };
          setSurvey(surveyData);
        } else {
          // Modo Crear: pre-seleccionamos el primer grupo y categoría
          setSurvey({
            ...newSurveyInitialState,
            id_grupo_focal: loadedCatalogs.grupos[0]?.id_grupo_focal || '',
          });
        }
      } catch (err) {
        console.error('Error cargando datos del formulario:', err);
        setError('No se pudieron cargar los datos necesarios.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [surveyId, isEditMode]);

  // --- 2. Lógica de Estado (El Cerebro del Constructor) ---

  // Maneja cambios simples (ej: título, descripción)
  const handleSurveyChange = (e) => {
    const { name, value } = e.target;
    setSurvey(prev => ({ ...prev, [name]: value }));
  };

  // --- Funciones de PREGUNTAS ---
  const handleAddQuestion = () => {
    setSurvey(prev => ({
      ...prev,
      preguntas: [
        ...prev.preguntas,
        { 
          ...newQuestionInitialState, 
          tempId: Date.now(), // Nuevo ID temporal
          // Pre-seleccionar la primera categoría
          id_categoria_pregunta: catalogs.categorias[0]?.id_categoria_pregunta || ''
        }
      ]
    }));
  };

  const handleDeleteQuestion = (questionTempId) => {
    setSurvey(prev => ({
      ...prev,
      preguntas: prev.preguntas.filter(p => p.tempId !== questionTempId)
    }));
  };

  // Maneja cambios en un campo de una pregunta (ej: texto, tipo, categoría)
  const handleQuestionChange = (questionTempId, e) => {
    const { name, value } = e.target;
    setSurvey(prev => ({
      ...prev,
      preguntas: prev.preguntas.map(p => {
        if (p.tempId !== questionTempId) return p;
        
        // Si cambia el tipo, reiniciamos las opciones
        const newOpciones = (name === 'tipo' && (value === 'OpcionUnica' || value === 'OpcionMultiple'))
          ? (p.opciones.length > 0 ? p.opciones : []) // Mantiene opciones si ya existen
          : (name === 'tipo') ? [] : p.opciones; // Borra opciones si no es de opción

        return { ...p, [name]: value, opciones: newOpciones };
      })
    }));
  };

  // --- Funciones de OPCIONES (Anidadas) ---
  const handleAddOption = (questionTempId) => {
    setSurvey(prev => ({
      ...prev,
      preguntas: prev.preguntas.map(p => {
        if (p.tempId !== questionTempId) return p;
        return {
          ...p,
          opciones: [
            ...p.opciones,
            { ...newOptionInitialState, tempId: Date.now() }
          ]
        };
      })
    }));
  };

  const handleDeleteOption = (questionTempId, optionTempId) => {
    setSurvey(prev => ({
      ...prev,
      preguntas: prev.preguntas.map(p => {
        if (p.tempId !== questionTempId) return p;
        return {
          ...p,
          opciones: p.opciones.filter(o => o.tempId !== optionTempId)
        };
      })
    }));
  };

  // Maneja cambios en un campo de una opción (ej: etiqueta, valor, puntos)
  const handleOptionChange = (questionTempId, optionTempId, e) => {
    const { name, value } = e.target;
    setSurvey(prev => ({
      ...prev,
      preguntas: prev.preguntas.map(p => {
        if (p.tempId !== questionTempId) return p;
        return {
          ...p,
          opciones: p.opciones.map(o => {
            if (o.tempId !== optionTempId) return o;
            return { ...o, [name]: value };
          })
        };
      })
    }));
  };

  // --- 3. Lógica de Guardado ---
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    // Limpiamos los 'tempId' antes de enviar a la API
    const surveyToSave = {
      ...survey,
      preguntas: survey.preguntas.map((p, pIndex) => ({
        // (Quitamos los IDs temporales)
        id_categoria_pregunta: parseInt(p.id_categoria_pregunta),
        texto: p.texto,
        tipo: p.tipo,
        orden: p.orden || (pIndex + 1),
        opciones: p.opciones.map((o, oIndex) => ({
          etiqueta: o.etiqueta,
          valor: o.valor,
          puntos: parseInt(o.puntos),
          orden: o.orden || (oIndex + 1),
        })),
      })),
    };

    // (Quitamos IDs de encuesta/pregunta/opcion si es modo "Crear")
    if (!isEditMode) {
      delete surveyToSave.id_encuesta;
    }

    console.log('Enviando a la API:', JSON.stringify(surveyToSave, null, 2));

    try {
      if (isEditMode) {
        // TODO: La API no parece tener un PUT /encuestas/{id} para editar
        // await updateSurvey(surveyId, surveyToSave); 
        console.warn('Modo Edición: La API no parece soportar la actualización de encuestas.');
        setError('Modo Edición aún no implementado por la API.');
      } else {
        await createSurvey(surveyToSave);
      }
      
      // Si tuvo éxito, volvemos a la lista
      navigate('/admin/surveys');

    } catch (err) {
      console.error('Error al guardar la encuesta:', err.response?.data || err.message);
      setError(`Error del servidor: ${err.response?.data?.message || 'No se pudo guardar'}`);
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return <div className="p-4">Cargando constructor de encuesta...</div>;
  }

  // --- 4. El Cuerpo (JSX del Formulario) ---
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? 'Editar Encuesta' : 'Crear Nueva Encuesta'}
      </h1>
      
      {/* === Formulario de Datos Generales === */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Datos Generales</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        <Input
          label="Título de la Encuesta"
          id="titulo"
          name="titulo"
          value={survey.titulo}
          onChange={handleSurveyChange}
          required
        />
        
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={survey.descripcion}
          onChange={handleSurveyChange}
          rows="3"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="id_grupo_focal" className="block text-sm font-medium text-gray-700 mb-1">Grupo Focal</label>
            <select
              id="id_grupo_focal"
              name="id_grupo_focal"
              value={survey.id_grupo_focal}
              onChange={handleSurveyChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Seleccione un grupo...</option>
              {catalogs.grupos.map(g => (
                <option key={g.id_grupo_focal} value={g.id_grupo_focal}>
                  {g.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <Input
            label="Versión"
            id="version"
            name="version"
            value={survey.version}
            onChange={handleSurveyChange}
            required
          />
        </div>
      </div>

      {/* === Constructor de Preguntas === */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Preguntas</h2>

        {survey.preguntas.length === 0 && (
          <p className="text-gray-500 text-center">Aún no hay preguntas. ¡Añade una!</p>
        )}

        {/* --- Lista Dinámica de Preguntas --- */}
        <div className="space-y-6">
          {survey.preguntas.map((pregunta, pIndex) => (
            <div key={pregunta.tempId} className="border border-gray-200 rounded-lg p-4 relative">
              
              {/* Botón de Eliminar Pregunta */}
              <Button 
                type="button"
                variant="danger"
                onClick={() => handleDeleteQuestion(pregunta.tempId)}
                className="absolute -top-3 -right-3 !p-1 !rounded-full h-8 w-8"
              >
                X
              </Button>

              <h3 className="font-semibold text-lg mb-3">Pregunta {pIndex + 1}</h3>
              
              <Input
                label="Texto de la Pregunta"
                id={`p-texto-${pregunta.tempId}`}
                name="texto"
                value={pregunta.texto}
                onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`p-cat-${pregunta.tempId}`} className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    id={`p-cat-${pregunta.tempId}`}
                    name="id_categoria_pregunta"
                    value={pregunta.id_categoria_pregunta}
                    onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccione categoría...</option>
                    {catalogs.categorias.map(c => (
                      <option key={c.id_categoria_pregunta} value={c.id_categoria_pregunta}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`p-tipo-${pregunta.tempId}`} className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pregunta</label>
                  <select
                    id={`p-tipo-${pregunta.tempId}`}
                    name="tipo"
                    value={pregunta.tipo}
                    onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="OpcionUnica">Opción Única</option>
                    {/* (Puedes añadir más tipos si tu API los soporta) */}
                    {/* <option value="OpcionMultiple">Opción Múltiple</option> */}
                    {/* <option value="Numerica">Numérica</option> */}
                    {/* <option value="Texto">Texto Abierto</option> */}
                  </select>
                </div>
              </div>

              {/* --- Constructor de Opciones (Anidado) --- */}
              {(pregunta.tipo === 'OpcionUnica' || pregunta.tipo === 'OpcionMultiple') && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-md mb-2">Opciones de Respuesta</h4>
                  <div className="space-y-3">
                    {pregunta.opciones.map((opcion, oIndex) => (
                      <div key={opcion.tempId} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <Input
                          placeholder="Etiqueta (ej: Sí)"
                          name="etiqueta"
                          value={opcion.etiqueta}
                          onChange={(e) => handleOptionChange(pregunta.tempId, opcion.tempId, e)}
                          className="!mb-0" // Sobrescribe el 'mb-4' de tu Input.jsx
                        />
                        <Input
                          placeholder="Valor (ej: si)"
                          name="valor"
                          value={opcion.valor}
                          onChange={(e) => handleOptionChange(pregunta.tempId, opcion.tempId, e)}
                          className="!mb-0"
                        />
                        <Input
                          type="number"
                          placeholder="Puntos"
                          name="puntos"
                          value={opcion.puntos}
                          onChange={(e) => handleOptionChange(pregunta.tempId, opcion.tempId, e)}
                          className="!mb-0 w-24"
                        />
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => handleDeleteOption(pregunta.tempId, opcion.tempId)}
                          className="!p-2 h-10 w-10"
                        >
                          X
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleAddOption(pregunta.tempId)}
                    className="mt-3"
                  >
                    + Añadir Opción
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={handleAddQuestion}
          className="mt-6"
        >
          + Añadir Pregunta
        </Button>
      </div>

      {/* === Botones de Acción Finales === */}
      <div className="mt-8 flex justify-end space-x-3">
        <Button 
          variant="secondary" 
          onClick={() => navigate('/admin/surveys')}
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : (isEditMode ? 'Actualizar Encuesta' : 'Guardar Encuesta')}
        </Button>
      </div>
    </div>
  );
}

export default SurveyForm;