// src/pages/admin/SurveyForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSurveyById, createSurvey } from '../../api/surveys';
import { 
  getGruposFocales, 
  getCategoriasPreguntas,
  getDepartamentos,
  getMunicipios,
  getComunidades 
} from '../../api/catalogos';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

// Estado inicial para una pregunta nueva
const newQuestionInitialState = {
  tempId: Date.now(), 
  id_categoria_pregunta: '',
  texto: '',
  tipo: 'OpcionUnica', // Tipo por defecto - sin espacios ni tildes
  fuenteDatos: 'manual', // 'manual', 'sexo', 'departamento', 'municipio', 'comunidad'
  // orden se asignará dinámicamente
  opciones: [],
};

// Estado inicial para una opción nueva
const newOptionInitialState = {
  tempId: Date.now(),
  etiqueta: '',
  valor: '',
  puntos: 0,
  // orden se asignará dinámicamente
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
  const [catalogs, setCatalogs] = useState({ 
    grupos: [], 
    categorias: [],
    departamentos: [],
    municipios: [],
    comunidades: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  
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
        const [gruposRes, categoriasRes, deptosRes, municRes, comunRes] = await Promise.all([
          getGruposFocales(),
          getCategoriasPreguntas(),
          getDepartamentos(),
          getMunicipios(),
          getComunidades(),
        ]);
        
        const loadedCatalogs = {
          grupos: gruposRes.data || [],
          categorias: categoriasRes.data || [],
          departamentos: deptosRes.data || [],
          municipios: municRes.data || [],
          comunidades: comunRes.data || [],
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
          // Modo Crear: pre-seleccionamos el primer grupo
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
          tempId: Date.now(),
          id_categoria_pregunta: catalogs.categorias[0]?.id_categoria_pregunta || ''
        }
      ]
    }));
  };

  // Función para añadir una pregunta Sí/No con opciones predefinidas
  const handleAddQuickYesNoQuestion = () => {
    setSurvey(prev => ({
      ...prev,
      preguntas: [
        ...prev.preguntas,
        { 
          ...newQuestionInitialState, 
          tempId: Date.now(),
          id_categoria_pregunta: catalogs.categorias[0]?.id_categoria_pregunta || '',
          tipo: 'OpcionUnica',
          opciones: [
            {
              tempId: Date.now(),
              etiqueta: 'Sí',
              valor: 'si',
              puntos: 10
            },
            {
              tempId: Date.now() + 1,
              etiqueta: 'No',
              valor: 'no',
              puntos: 0
            }
          ]
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
        
        // Si cambia el tipo de pregunta
        if (name === 'tipo') {
          // Para tipos que necesitan opciones predefinidas
          if (value === 'Opcion Unica' || value === 'Opcion Múltiple') {
            return { 
              ...p, 
              tipo: value,
              fuenteDatos: 'manual',
              opciones: p.opciones.length > 0 ? p.opciones : [] 
            };
          }
          // Para otros tipos (texto, número)
          else {
            return { 
              ...p, 
              tipo: value,
              fuenteDatos: 'manual',
              opciones: [] 
            };
          }
        }
        
        // Si cambia la fuente de datos
        if (name === 'fuenteDatos') {
          let nuevasOpciones = [];
          
          // Generar opciones automáticamente según la fuente
          if (value === 'sexo') {
            nuevasOpciones = [
              { tempId: Date.now(), etiqueta: 'Masculino', valor: 'masculino', puntos: 0 },
              { tempId: Date.now() + 1, etiqueta: 'Femenino', valor: 'femenino', puntos: 0 }
            ];
          } else if (value === 'departamento') {
            nuevasOpciones = catalogs.departamentos.map((dept, index) => ({
              tempId: Date.now() + index,
              etiqueta: dept.nombre,
              valor: dept.nombre.toLowerCase().replace(/\s+/g, '_'),
              puntos: 0
            }));
          } else if (value === 'municipio') {
            nuevasOpciones = catalogs.municipios.map((muni, index) => ({
              tempId: Date.now() + index,
              etiqueta: muni.nombre,
              valor: muni.nombre.toLowerCase().replace(/\s+/g, '_'),
              puntos: 0
            }));
          } else if (value === 'comunidad') {
            nuevasOpciones = catalogs.comunidades.map((comu, index) => ({
              tempId: Date.now() + index,
              etiqueta: comu.nombre,
              valor: comu.nombre.toLowerCase().replace(/\s+/g, '_'),
              puntos: 0
            }));
          }
          
          return { ...p, fuenteDatos: value, opciones: nuevasOpciones };
        }
        
        return { ...p, [name]: value };
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
    // Validaciones básicas
    if (!survey.titulo.trim()) {
      setError('El título de la encuesta es obligatorio.');
      return;
    }
    if (!survey.id_grupo_focal) {
      setError('Debe seleccionar un grupo focal.');
      return;
    }
    if (survey.preguntas.length === 0) {
      setError('Debe añadir al menos una pregunta.');
      return;
    }

    // Validar que cada pregunta tenga sus datos completos
    for (let i = 0; i < survey.preguntas.length; i++) {
      const p = survey.preguntas[i];
      if (!p.texto.trim()) {
        setError(`La pregunta ${i + 1} necesita un texto.`);
        return;
      }
      if (!p.id_categoria_pregunta && p.id_categoria_pregunta !== '0') {
        setError(`La pregunta ${i + 1} necesita una categoría.`);
        return;
      }
      if ((p.tipo === 'OpcionUnica' || p.tipo === 'OpcionMultiple') && p.opciones.length === 0) {
        setError(`La pregunta ${i + 1} necesita al menos una opción.`);
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    
    // Preparamos las preguntas para enviar
    const surveyToSave = {
      ...survey,
      preguntas: survey.preguntas.map((p, pIndex) => {
        const preguntaBase = {
          // Si es categoría 0, enviamos null o un valor especial según lo que acepte tu API
          id_categoria_pregunta: p.id_categoria_pregunta === '0' ? null : parseInt(p.id_categoria_pregunta),
          texto: p.texto,
          tipo: p.tipo,
          orden: p.orden || (pIndex + 1),
        };

        // Solo agregamos opciones si el tipo lo requiere
        if (p.tipo === 'OpcionUnica' || p.tipo === 'OpcionMultiple') {
          preguntaBase.opciones = p.opciones.map((o, oIndex) => ({
            etiqueta: o.etiqueta,
            valor: o.valor,
            puntos: parseInt(o.puntos) || 0,
            orden: o.orden || (oIndex + 1),
          }));
        } else {
          preguntaBase.opciones = [];
        }

        return preguntaBase;
      }),
    };

    // Quitamos IDs temporales y de edición si es modo crear
    if (!isEditMode) {
      delete surveyToSave.id_encuesta;
    }

    console.log('═══════════════════════════════════════');
    console.log('📤 DATOS A ENVIAR A LA API:');
    console.log('═══════════════════════════════════════');
    console.log(JSON.stringify(surveyToSave, null, 2));
    console.log('═══════════════════════════════════════');

    try {
      if (isEditMode) {
        // TODO: La API no parece tener un PUT /encuestas/{id} para editar
        console.warn('Modo Edición: La API no parece soportar la actualización de encuestas.');
        setError('Modo Edición aún no implementado por la API.');
      } else {
        await createSurvey(surveyToSave);
        // Si tuvo éxito, volvemos a la lista
        navigate('/admin/surveys');
      }

    } catch (err) {
      console.error('Error completo:', err);
      console.error('Respuesta del servidor:', err.response?.data);
      console.error('Status:', err.response?.status);
      
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || JSON.stringify(err.response?.data)
        || err.message 
        || 'No se pudo guardar';
      
      setError(`Error del servidor (${err.response?.status || 'desconocido'}): ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Mostrar loading mientras cargan los datos
  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600">Cargando constructor de encuesta...</p>
        </div>
      </div>
    );
  }

  // --- 4. El Cuerpo (JSX del Formulario) ---
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Modal de Ayuda */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-indigo-600">📚 Guía de Tipos de Preguntas</h3>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h4 className="font-semibold text-lg">Opción Única (Radio Button)</h4>
                  <p className="text-gray-600 text-sm">El encuestado selecciona UNA sola opción de todas las disponibles.</p>
                  <p className="text-gray-500 text-xs mt-1">
                    <strong>Ejemplo:</strong> "¿Te lavas las manos?" → Sí o No (solo una respuesta)
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    ✅ Cada opción tiene su etiqueta, valor y puntos
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h4 className="font-semibold text-lg">Opción Múltiple (Checkboxes)</h4>
                  <p className="text-gray-600 text-sm">El encuestado puede marcar VARIAS opciones.</p>
                  <p className="text-gray-500 text-xs mt-1">
                    <strong>Ejemplo:</strong> "¿Cuándo te lavas las manos?" → Antes de comer, Después del baño, etc.
                  </p>
                  <p className="text-xs text-green-700 mt-1 bg-green-50 p-2 rounded">
                    <strong>⚠️ IMPORTANTE:</strong> Las opciones NO marcadas simplemente no se envían. 
                    No es necesario crear opciones con "No" para cada caso. 
                    Solo se registran las opciones que el encuestado SÍ marca.
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>Valor:</strong> Identificador único de cada opción (ej: "antes_comer", "despues_bano")
                  </p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4 py-2">
                  <h4 className="font-semibold text-lg">Texto Corto</h4>
                  <p className="text-gray-600 text-sm">Campo de texto para respuestas breves (una línea).</p>
                  <p className="text-gray-500 text-xs mt-1">
                    <strong>Ejemplo:</strong> Nombre del encuestador, Número de boleta
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4 py-2">
                  <h4 className="font-semibold text-lg">Texto Largo</h4>
                  <p className="text-gray-600 text-sm">Campo de texto amplio para respuestas extensas (varias líneas).</p>
                  <p className="text-gray-500 text-xs mt-1">
                    <strong>Ejemplo:</strong> Observaciones, Comentarios adicionales
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <h4 className="font-semibold text-lg">Numérico</h4>
                  <p className="text-gray-600 text-sm">Campo para ingresar solo números.</p>
                  <p className="text-gray-500 text-xs mt-1">
                    <strong>Ejemplo:</strong> Edad, Número de boleta
                  </p>
                </div>

                <div className="border-l-4 border-pink-500 pl-4 py-2">
                  <h4 className="font-semibold text-lg">Catálogo (Selección de Lista)</h4>
                  <p className="text-gray-600 text-sm">Selección de opciones predefinidas del sistema.</p>
                  <p className="text-gray-500 text-xs mt-1">
                    <strong>Opciones disponibles:</strong> Sexo (Masculino/Femenino), Departamento, Municipio, Comunidad
                  </p>
                  <p className="text-xs text-pink-700 mt-1">
                    ✅ Las opciones se cargan automáticamente de la base de datos
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  📋 Categorías de Preguntas:
                </p>
                <p className="text-xs text-yellow-700">
                  <strong>Sin Categoría (Datos Generales):</strong> Para preguntas de identificación del encuestado 
                  (nombre, edad, sexo, fecha de entrevista, etc.)
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  <strong>Con Categoría:</strong> Para preguntas temáticas (Higiene Básica, Agua y Enfermedades, etc.)
                </p>
              </div>

              <div className="mt-4 bg-blue-50 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Usa el botón "⚡ Sí/No" para crear rápidamente una pregunta con opciones Sí/No predefinidas con puntajes.
                </p>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditMode ? '✏️ Editar Encuesta' : '📝 Crear Nueva Encuesta'}
          </h1>
          <p className="text-gray-600 mt-2">
            Complete la información general y agregue las preguntas que conformarán la encuesta.
          </p>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
        >
          ❓ Ayuda
        </button>
      </div>
      
      {/* === Formulario de Datos Generales === */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-indigo-600 border-b pb-2">
          📋 Datos Generales
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 font-medium">⚠️ {error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <Input
            label="Título de la Encuesta *"
            id="titulo"
            name="titulo"
            value={survey.titulo}
            onChange={handleSurveyChange}
            placeholder="Ej: Encuesta de Higiene Básica"
            required
          />
          
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={survey.descripcion}
              onChange={handleSurveyChange}
              rows="3"
              placeholder="Descripción breve de la encuesta..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="id_grupo_focal" className="block text-sm font-medium text-gray-700 mb-1">
                Grupo Focal *
              </label>
              <select
                id="id_grupo_focal"
                name="id_grupo_focal"
                value={survey.id_grupo_focal}
                onChange={handleSurveyChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
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
              label="Versión *"
              id="version"
              name="version"
              value={survey.version}
              onChange={handleSurveyChange}
              placeholder="Ej: 1.0"
              required
            />
          </div>
        </div>
      </div>

      {/* === Constructor de Preguntas === */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <div>
            <h2 className="text-xl font-semibold text-indigo-600">
              ❓ Preguntas de la Encuesta
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {survey.preguntas.length} pregunta{survey.preguntas.length !== 1 ? 's' : ''} agregada{survey.preguntas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddQuickYesNoQuestion}
              className="!py-2 !px-3 text-sm"
              title="Añadir pregunta Sí/No rápida"
            >
              ⚡ Sí/No
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAddQuestion}
              className="!py-2 !px-4"
            >
              + Añadir Pregunta
            </Button>
          </div>
        </div>

        {survey.preguntas.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">📝 Aún no hay preguntas</p>
            <p className="text-gray-400 text-sm mt-2">Haz clic en "Añadir Pregunta" para comenzar</p>
          </div>
        )}

        {/* --- Lista Dinámica de Preguntas --- */}
        <div className="space-y-6">
          {survey.preguntas.map((pregunta, pIndex) => (
            <div 
              key={pregunta.tempId} 
              className="border-2 border-gray-200 rounded-lg p-5 relative bg-gradient-to-br from-white to-gray-50 hover:border-indigo-300 transition-all"
            >
              
              {/* Botón de Eliminar Pregunta */}
              <Button 
                type="button"
                variant="danger"
                onClick={() => handleDeleteQuestion(pregunta.tempId)}
                className="absolute -top-3 -right-3 !p-2 !rounded-full h-9 w-9 shadow-lg hover:scale-110 transition-transform"
                title="Eliminar pregunta"
              >
                ✕
              </Button>

              <div className="mb-4">
                <span className="inline-block bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Pregunta {pIndex + 1}
                </span>
              </div>
              
              <Input
                label="Texto de la Pregunta *"
                id={`p-texto-${pregunta.tempId}`}
                name="texto"
                value={pregunta.texto}
                onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                placeholder="Ej: ¿Te lavas las manos?"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`p-cat-${pregunta.tempId}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    id={`p-cat-${pregunta.tempId}`}
                    name="id_categoria_pregunta"
                    value={pregunta.id_categoria_pregunta}
                    onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">⚠️ Seleccione categoría...</option>
                    <option value="0" className="font-semibold bg-yellow-50">
                      📋 Sin Categoría (Datos Generales)
                    </option>
                    <option disabled>───────────────────</option>
                    {catalogs.categorias.map(c => (
                      <option key={c.id_categoria_pregunta} value={c.id_categoria_pregunta}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  {pregunta.id_categoria_pregunta === '0' && (
                    <p className="text-xs text-yellow-700 mt-1 bg-yellow-50 p-2 rounded">
                      💡 Esta pregunta es para identificación del encuestado (nombre, edad, sexo, etc.)
                    </p>
                  )}
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
                    <option value="OpcionUnica">Opción Única (Sí/No, Sexo, etc.)</option>
                    <option value="OpcionMultiple">Opción Múltiple (Checkboxes)</option>
                    <option value="Texto">Texto Corto (Nombre, etc.)</option>
                    <option value="TextoLargo">Texto Largo (Observaciones)</option>
                    <option value="Numerica">Numérico (Edad, etc.)</option>
                  </select>
                </div>
              </div>

              {/* --- Selector de Fuente de Datos (solo para OpcionUnica y OpcionMultiple) --- */}
              {(pregunta.tipo === 'OpcionUnica' || pregunta.tipo === 'OpcionMultiple') && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <label htmlFor={`p-fuente-${pregunta.tempId}`} className="block text-sm font-semibold text-gray-700 mb-2">
                    📊 ¿De dónde provienen las opciones de respuesta?
                  </label>
                  <select
                    id={`p-fuente-${pregunta.tempId}`}
                    name="fuenteDatos"
                    value={pregunta.fuenteDatos || 'manual'}
                    onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                    className="w-full p-2 border border-blue-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="manual">✍️ Manual (Crear opciones personalizadas)</option>
                    <option value="sexo">� Catálogo: Sexo (Masculino/Femenino)</option>
                    <option value="departamento">🗺️ Catálogo: Departamento</option>
                    <option value="municipio">🏘️ Catálogo: Municipio</option>
                    <option value="comunidad">🏡 Catálogo: Comunidad</option>
                  </select>
                  
                  {pregunta.fuenteDatos !== 'manual' && (
                    <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        ✅ Las opciones se han cargado automáticamente desde la base de datos
                      </p>
                      <p className="text-xs text-gray-600">
                        {pregunta.opciones.length} opciones disponibles
                      </p>
                    </div>
                  )}
                  
                  {pregunta.fuenteDatos === 'manual' && (
                    <p className="mt-2 text-xs text-gray-600">
                      💡 Podrás agregar opciones personalizadas más abajo
                    </p>
                  )}
                </div>
              )}

              {/* --- Constructor de Opciones (Anidado) --- */}
              {(pregunta.tipo === 'OpcionUnica' || pregunta.tipo === 'OpcionMultiple') && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-md">Opciones de Respuesta</h4>
                    {pregunta.tipo === 'OpcionMultiple' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        ℹ️ El encuestado puede marcar varias opciones
                      </span>
                    )}
                  </div>
                  
                  {pregunta.tipo === 'OpcionMultiple' && pregunta.fuenteDatos === 'manual' && (
                    <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Opción Múltiple:</strong> El encuestado marcará las opciones que apliquen. 
                        Las opciones NO marcadas simplemente no se enviarán (no necesitas poner "No").
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        <strong>Ejemplo:</strong> "¿Cuándo te lavas las manos?" → El encuestado marca solo las que hace.
                      </p>
                    </div>
                  )}
                  
                  {pregunta.opciones.length === 0 && pregunta.fuenteDatos === 'manual' && (
                    <p className="text-sm text-gray-500 mb-2">No hay opciones. Añade al menos una.</p>
                  )}
                  
                  {/* Mostrar opciones de catálogos como solo lectura */}
                  {pregunta.fuenteDatos !== 'manual' && pregunta.opciones.length > 0 && (
                    <div className="mb-3 p-4 bg-gray-50 rounded border border-gray-300">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        📋 Opciones cargadas desde catálogo ({pregunta.opciones.length} total):
                      </p>
                      <div className="max-h-48 overflow-y-auto">
                        <ul className="grid grid-cols-2 gap-2">
                          {pregunta.opciones.slice(0, 10).map(opcion => (
                            <li key={opcion.tempId} className="text-xs text-gray-600 flex items-center">
                              <span className="mr-1">•</span> {opcion.etiqueta}
                            </li>
                          ))}
                          {pregunta.opciones.length > 10 && (
                            <li className="text-xs text-gray-400 italic col-span-2">
                              ... y {pregunta.opciones.length - 10} más
                            </li>
                          )}
                        </ul>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        ℹ️ Estas opciones se generaron automáticamente. No es necesario editarlas.
                      </p>
                    </div>
                  )}
                  
                  {/* Opciones manuales editables */}
                  {pregunta.fuenteDatos === 'manual' && (
                    <>
                      <div className="space-y-3">
                        {pregunta.opciones.map((opcion) => (
                      <div key={opcion.tempId} className="flex items-center space-x-2 p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex-1">
                          <Input
                            placeholder={pregunta.tipo === 'Opcion Múltiple' 
                              ? "Etiqueta (ej: Antes de comer)" 
                              : "Etiqueta (ej: Sí)"}
                            name="etiqueta"
                            value={opcion.etiqueta}
                            onChange={(e) => handleOptionChange(pregunta.tempId, opcion.tempId, e)}
                            className="!mb-0"
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder={pregunta.tipo === 'OpcionMultiple' 
                              ? "Valor (ej: antes_comer)" 
                              : "Valor (ej: si)"}
                            name="valor"
                            value={opcion.valor}
                            onChange={(e) => handleOptionChange(pregunta.tempId, opcion.tempId, e)}
                            className="!mb-0"
                          />
                        </div>
                        <div className="w-28">
                          <Input
                            type="number"
                            placeholder="Puntos"
                            name="puntos"
                            value={opcion.puntos}
                            onChange={(e) => handleOptionChange(pregunta.tempId, opcion.tempId, e)}
                            className="!mb-0"
                            title="Puntos que se otorgan si se selecciona esta opción"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => handleDeleteOption(pregunta.tempId, opcion.tempId)}
                          className="!p-2 h-10 w-10 flex-shrink-0"
                          title="Eliminar opción"
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
                  </>
                  )}
                </div>
              )}

              {/* --- Vista previa para otros tipos de pregunta --- */}
              {pregunta.tipo === 'Texto' && (
                <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Vista previa:</p>
                  <input 
                    type="text" 
                    placeholder="El encuestado escribirá texto corto aquí..."
                    className="w-full p-2 border border-gray-300 rounded"
                    disabled
                  />
                </div>
              )}

              {pregunta.tipo === 'Texto Largo' && (
                <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Vista previa:</p>
                  <textarea 
                    placeholder="El encuestado escribirá texto largo aquí..."
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded"
                    disabled
                  />
                </div>
              )}

              {pregunta.tipo === 'Numérica' && (
                <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Vista previa:</p>
                  <input 
                    type="number" 
                    placeholder="El encuestado ingresará un número..."
                    className="w-full p-2 border border-gray-300 rounded"
                    disabled
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* === Botones de Acción Finales === */}
      <div className="mt-8 flex justify-between items-center bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="text-sm text-gray-600">
          <p className="font-semibold">📊 Resumen de la encuesta:</p>
          <p className="mt-1">
            • {survey.preguntas.length} pregunta{survey.preguntas.length !== 1 ? 's' : ''} creada{survey.preguntas.length !== 1 ? 's' : ''}
          </p>
          <p>
            • {survey.preguntas.filter(p => p.tipo === 'OpcionUnica' || p.tipo === 'OpcionMultiple').reduce((acc, p) => acc + p.opciones.length, 0)} opciones totales
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="secondary" 
            onClick={() => navigate('/admin/surveys')}
            disabled={isSaving}
            className="!px-6"
          >
            ← Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={isSaving}
            className="!px-6"
          >
            {isSaving ? '⏳ Guardando...' : (isEditMode ? '💾 Actualizar Encuesta' : '💾 Guardar Encuesta')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SurveyForm;