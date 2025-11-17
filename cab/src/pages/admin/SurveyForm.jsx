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
  // Campos para tipo Catalogo
  catalogo_tabla: '',
  catalogo_valor: '',
  catalogo_etiqueta: '',
  // Campos para rangos de semáforo personalizados
  rango_rojo_max: null,
  rango_naranja_max: null,
  rango_amarillo_max: null,
};

// Estado inicial para una opción nueva
const newOptionInitialState = {
  tempId: Date.now(),
  etiqueta: '', // El texto que ve el usuario (ej: "Casi siempre")
  valor: '', // El valor que se guarda (ej: "casi_siempre")
  puntos: 0,
  orden: 1,
  // Campos para preguntas condicionales
  condicional: false,
  condicional_pregunta_id: null,
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
            preguntas: surveyRes.data.preguntas.map((p) => ({
              ...p,
              tempId: p.id_pregunta || Date.now(),
              opciones: p.opciones.map((o) => ({
                ...o,
                tempId: o.id_opcion || Date.now(),
              })),
            })),
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
    setSurvey((prev) => ({ ...prev, [name]: value }));
  };

  // --- Funciones de PREGUNTAS ---
  const handleAddQuestion = () => {
    setSurvey((prev) => ({
      ...prev,
      preguntas: [
        ...prev.preguntas,
        {
          ...newQuestionInitialState,
          tempId: Date.now(), // Nuevo ID temporal
          // Pre-seleccionar la primera categoría
          id_categoria_pregunta: catalogs.categorias[0]?.id_categoria_pregunta || '',
        },
      ],
    }));
  };

  const handleDeleteQuestion = (questionTempId) => {
    setSurvey((prev) => ({
      ...prev,
      preguntas: prev.preguntas.filter((p) => p.tempId !== questionTempId),
    }));
  };

  // Maneja cambios en un campo de una pregunta (ej: texto, tipo, categoría)
  const handleQuestionChange = (questionTempId, e) => {
    const { name, value } = e.target;
    setSurvey((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p) => {
        if (p.tempId !== questionTempId) return p;

        // Si cambia el tipo, reiniciamos las opciones según corresponda
        const tiposConOpciones = ['OpcionUnica', 'OpcionMultiple', 'SiNo'];
        const newOpciones =
          name === 'tipo' && tiposConOpciones.includes(value)
            ? p.opciones.length > 0
              ? p.opciones
              : [] // Mantiene opciones si ya existen
            : name === 'tipo'
              ? []
              : p.opciones; // Borra opciones si no es de opción

        return { ...p, [name]: value, opciones: newOpciones };
      }),
    }));
  };

  // --- Funciones de OPCIONES (Anidadas) ---
  const handleAddOption = (questionTempId) => {
    setSurvey((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p) => {
        if (p.tempId !== questionTempId) return p;
        return {
          ...p,
          opciones: [...p.opciones, { ...newOptionInitialState, tempId: Date.now() }],
        };
      }),
    }));
  };

  const handleDeleteOption = (questionTempId, optionTempId) => {
    setSurvey((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p) => {
        if (p.tempId !== questionTempId) return p;
        return {
          ...p,
          opciones: p.opciones.filter((o) => o.tempId !== optionTempId),
        };
      }),
    }));
  };

  // Maneja cambios en un campo de una opción (ej: etiqueta, valor, puntos)
  const handleOptionChange = (questionTempId, optionTempId, e) => {
    const { name, value } = e.target;
    setSurvey((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p) => {
        if (p.tempId !== questionTempId) return p;
        return {
          ...p,
          opciones: p.opciones.map((o) => {
            if (o.tempId !== optionTempId) return o;
            return { ...o, [name]: value };
          }),
        };
      }),
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
        orden: pIndex + 1, // Usar siempre el índice para evitar duplicados
        opciones: p.opciones.map((o, oIndex) => ({
          etiqueta: o.etiqueta,
          valor: o.valor,
          puntos: parseInt(o.puntos),
          orden: oIndex + 1, // Usar siempre el índice para evitar duplicados
        })),
      })),
    };

    // (Quitamos IDs de encuesta/pregunta/opcion si es modo "Crear")
    if (!isEditMode) {
      delete surveyToSave.id_encuesta;
    }

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
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        {isEditMode ? 'Editar Encuesta' : 'Crear Nueva Encuesta'}
      </h1>

      {/* === Formulario de Datos Generales === */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 border-b pb-2 text-xl font-semibold">Datos Generales</h2>

        {error && <p className="mb-4 text-red-500">{error}</p>}

        <Input
          label="Título de la Encuesta"
          id="titulo"
          name="titulo"
          value={survey.titulo}
          onChange={handleSurveyChange}
          required
        />

        <label htmlFor="descripcion" className="mb-1 block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={survey.descripcion}
          onChange={handleSurveyChange}
          rows="3"
          className="w-full rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500"
        />

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="id_grupo_focal"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Grupo Focal
            </label>
            <select
              id="id_grupo_focal"
              name="id_grupo_focal"
              value={survey.id_grupo_focal}
              onChange={handleSurveyChange}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Seleccione un grupo...</option>
              {catalogs.grupos.map((g) => (
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
      <div className="mt-6 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 border-b pb-2 text-xl font-semibold">Preguntas</h2>

        {survey.preguntas.length === 0 && (
          <p className="text-center text-gray-500">Aún no hay preguntas. ¡Añade una!</p>
        )}

        {/* --- Lista Dinámica de Preguntas --- */}
        <div className="space-y-6">
          {survey.preguntas.map((pregunta, pIndex) => (
            <div key={pregunta.tempId} className="relative rounded-lg border border-gray-200 p-4">
              {/* Botón de Eliminar Pregunta */}
              <Button
                type="button"
                variant="danger"
                onClick={() => handleDeleteQuestion(pregunta.tempId)}
                className="absolute -right-3 -top-3 h-8 w-8 !rounded-full !p-1"
              >
                X
              </Button>

              <h3 className="mb-3 text-lg font-semibold">Pregunta {pIndex + 1}</h3>

              <Input
                label="Texto de la Pregunta"
                id={`p-texto-${pregunta.tempId}`}
                name="texto"
                value={pregunta.texto}
                onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                required
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor={`p-cat-${pregunta.tempId}`}
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Categoría
                  </label>
                  <select
                    id={`p-cat-${pregunta.tempId}`}
                    name="id_categoria_pregunta"
                    value={pregunta.id_categoria_pregunta}
                    onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Seleccione categoría...</option>
                    {catalogs.categorias.map((c) => (
                      <option key={c.id_categoria_pregunta} value={c.id_categoria_pregunta}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor={`p-tipo-${pregunta.tempId}`}
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Tipo de Pregunta
                  </label>
                  <select
                    id={`p-tipo-${pregunta.tempId}`}
                    name="tipo"
                    value={pregunta.tipo}
                    onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="OpcionUnica">Opción Única</option>
                    <option value="OpcionMultiple">Opción Múltiple</option>
                    <option value="Numerica">Numérica</option>
                    <option value="SiNo">Sí/No</option>
                    <option value="Texto">Texto Abierto</option>
                    <option value="Fecha">Fecha</option>
                    <option value="Catalogo">Catálogo (desde tabla)</option>
                  </select>
                </div>
              </div>

              {/* --- Constructor de Opciones (Anidado) --- */}
              {(pregunta.tipo === 'OpcionUnica' || pregunta.tipo === 'OpcionMultiple' || pregunta.tipo === 'SiNo') && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="text-md mb-2 font-semibold">Opciones de Respuesta</h4>
                  <div className="space-y-3">
                    {pregunta.opciones.map((opcion, oIndex) => (
                      <div
                        key={opcion.tempId}
                        className="rounded bg-gray-50 p-3"
                      >
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="Etiqueta (ej: Sí)"
                            name="etiqueta"
                            value={opcion.etiqueta}
                            onChange={(e) => handleOptionChange(pregunta.tempId, opcion.tempId, e)}
                            className="!mb-0"
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
                            className="h-10 w-10 !p-2"
                          >
                            X
                          </Button>
                        </div>

                        {/* Configuración condicional */}
                        <div className="mt-2 flex items-center gap-3 border-t border-gray-200 pt-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="condicional"
                              checked={opcion.condicional || false}
                              onChange={(e) => {
                                const newValue = e.target.checked;
                                handleOptionChange(pregunta.tempId, opcion.tempId, {
                                  target: { name: 'condicional', value: newValue }
                                });
                              }}
                              className="h-4 w-4"
                            />
                            <span className="font-medium">🔗 Pregunta condicional</span>
                          </label>

                          {opcion.condicional && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">Si se selecciona, mostrar pregunta:</span>
                              <select
                                name="condicional_pregunta_id"
                                value={opcion.condicional_pregunta_id || ''}
                                onChange={(e) => handleOptionChange(pregunta.tempId, opcion.tempId, e)}
                                className="rounded border border-gray-300 px-2 py-1 text-sm"
                              >
                                <option value="">-- Seleccionar pregunta --</option>
                                {survey.preguntas
                                  .filter(p => p.tempId !== pregunta.tempId) // Excluir pregunta actual
                                  .map(p => (
                                    <option key={p.tempId} value={p.tempId}>
                                      {p.texto || `Pregunta ${survey.preguntas.indexOf(p) + 1}`}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>
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

              {/* --- Configuración de Catálogo --- */}
              {pregunta.tipo === 'Catalogo' && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="text-md mb-2 font-semibold">Configuración de Catálogo</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Tabla de origen
                      </label>
                      <select
                        name="catalogo_tabla"
                        value={pregunta.catalogo_tabla || ''}
                        onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                        className="w-full rounded-md border border-gray-300 p-2"
                      >
                        <option value="">-- Seleccionar tabla --</option>
                        <option value="comunidades">Comunidades</option>
                        <option value="departamentos">Departamentos</option>
                        <option value="municipios">Municipios</option>
                        <option value="categorias_pregunta">Categorías de Pregunta</option>
                        <option value="grupos_focales">Grupos Focales</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Columna valor (ID)
                        </label>
                        <Input
                          placeholder="ej: id_comunidad"
                          name="catalogo_valor"
                          value={pregunta.catalogo_valor || ''}
                          onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                          className="!mb-0"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Columna etiqueta (texto)
                        </label>
                        <Input
                          placeholder="ej: nombre"
                          name="catalogo_etiqueta"
                          value={pregunta.catalogo_etiqueta || ''}
                          onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                          className="!mb-0"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      📋 Las opciones se cargarán dinámicamente desde la tabla seleccionada
                    </p>
                  </div>
                </div>
              )}

              {/* --- Configuración de Rangos de Semáforo --- */}
              <div className="mt-4 border-t border-gray-200 pt-4">
                <details className="cursor-pointer">
                  <summary className="text-md font-semibold">
                    ⚙️ Rangos de Semáforo Personalizados (Opcional)
                  </summary>
                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-gray-600">
                      Defina rangos personalizados para el análisis de semáforo (0-10).
                      Si no se especifica, se usarán los rangos globales por defecto.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-red-600">
                          🔴 Rojo hasta:
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          placeholder="5.0 (default)"
                          name="rango_rojo_max"
                          value={pregunta.rango_rojo_max || ''}
                          onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                          className="!mb-0"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-orange-600">
                          🟠 Naranja hasta:
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          placeholder="7.0 (default)"
                          name="rango_naranja_max"
                          value={pregunta.rango_naranja_max || ''}
                          onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                          className="!mb-0"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-yellow-600">
                          🟡 Amarillo hasta:
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          placeholder="8.0 (default)"
                          name="rango_amarillo_max"
                          value={pregunta.rango_amarillo_max || ''}
                          onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                          className="!mb-0"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      🟢 Verde: Valores superiores al Amarillo
                    </p>
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="primary" onClick={handleAddQuestion} className="mt-6">
          + Añadir Pregunta
        </Button>
      </div>

      {/* === Botones de Acción Finales === */}
      <div className="mt-8 flex justify-end space-x-3">
        <Button variant="secondary" onClick={() => navigate('/admin/surveys')} disabled={isSaving}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Guardando...' : isEditMode ? 'Actualizar Encuesta' : 'Guardar Encuesta'}
        </Button>
      </div>
    </div>
  );
}

export default SurveyForm;
