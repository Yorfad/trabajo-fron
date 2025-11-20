// src/pages/admin/SurveyForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSurveyById, createSurvey } from '../../api/surveys';
import { getGruposFocales, getCategoriasPreguntas, createCategoriaPregunta } from '../../api/catalogos';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input'; // Usaremos tu Input

// Helper para convertir markdown a HTML
const parseMarkdown = (text) => {
  if (!text) return text;
  // Convertir **texto** a <strong>texto</strong>
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
};

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
};

// Estado inicial para una opción nueva
const newOptionInitialState = {
  tempId: Date.now(),
  etiqueta: '', // El texto que ve el usuario (ej: "Casi siempre")
  valor: '', // El valor que se guarda (ej: "casi_siempre")
  puntos: 1, // Puntaje por defecto
  orden: 1,
  // Campos para preguntas condicionales
  condicional: false,
  condicional_pregunta_id: null,
  // Campo para opciones excluyentes (bloquean otras respuestas)
  excluyente: false,
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
  console.log('🚀 SurveyForm component loaded - Version 2.0');

  const [survey, setSurvey] = useState(newSurveyInitialState);
  const [catalogs, setCatalogs] = useState({ grupos: [], categorias: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  // Estado para el modal de crear categoría
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ nombre: '', descripcion: '' });
  const [creatingCategory, setCreatingCategory] = useState(false);
  // Estado para el modal de pegado masivo de opciones
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [currentQuestionForPaste, setCurrentQuestionForPaste] = useState(null);

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
                // Asegurar valores por defecto para campos que pueden no existir
                condicional: o.condicional || false,
                excluyente: o.excluyente || false,
                puntos: o.puntos !== undefined ? o.puntos : 1,
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
    const { name, value, type, checked } = e.target;
    // Para checkboxes, usar 'checked', para otros usar 'value'
    const fieldValue = type === 'checkbox' ? checked : value;

    console.log('🔄 handleOptionChange llamado:', {
      questionTempId,
      optionTempId,
      name,
      type,
      value,
      checked,
      fieldValue
    });

    setSurvey((prev) => {
      const updatedSurvey = {
        ...prev,
        preguntas: prev.preguntas.map((p) => {
          if (p.tempId !== questionTempId) return p;
          return {
            ...p,
            opciones: p.opciones.map((o) => {
              if (o.tempId !== optionTempId) return o;
              // Si el campo es 'etiqueta', auto-llenar el 'valor' también
              if (name === 'etiqueta' && typeof fieldValue === 'string') {
                // Truncar el valor a 50 caracteres (límite de la BD)
                const valorLimitado = fieldValue.substring(0, 50);
                console.log('✏️ Actualizando etiqueta y valor:', { etiqueta: fieldValue, valor: valorLimitado });
                return { ...o, etiqueta: fieldValue, valor: valorLimitado };
              }
              console.log(`✏️ Actualizando ${name}:`, fieldValue);
              return { ...o, [name]: fieldValue };
            }),
          };
        }),
      };
      console.log('✅ Estado actualizado');
      return updatedSurvey;
    });
  };

  // --- Funciones para Crear Categoría ---
  const handleCreateCategory = async () => {
    if (!newCategory.nombre || newCategory.nombre.trim() === '') {
      alert('El nombre de la categoría es requerido');
      return;
    }

    setCreatingCategory(true);
    try {
      const response = await createCategoriaPregunta(newCategory);
      // Añadir la nueva categoría al catálogo
      setCatalogs(prev => ({
        ...prev,
        categorias: [...prev.categorias, response.data]
      }));
      // Limpiar el formulario y cerrar el modal
      setNewCategory({ nombre: '', descripcion: '' });
      setShowCategoryModal(false);
      alert('Categoría creada exitosamente');
    } catch (err) {
      console.error('Error al crear categoría:', err);
      alert(`Error al crear categoría: ${err.response?.data?.msg || 'Error desconocido'}`);
    } finally {
      setCreatingCategory(false);
    }
  };

  // --- Funciones para Pegado Masivo de Opciones ---
  const handleOpenPasteModal = (questionTempId) => {
    setCurrentQuestionForPaste(questionTempId);
    setPasteText('');
    setShowPasteModal(true);
  };

  const handlePasteOptions = () => {
    if (!pasteText.trim()) {
      alert('Por favor, pegue al menos una línea de texto');
      return;
    }

    // Dividir el texto pegado por saltos de línea
    const lines = pasteText.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
      alert('No se encontraron líneas válidas');
      return;
    }

    // Crear nuevas opciones a partir de las líneas
    const nuevasOpciones = lines.map((linea, index) => ({
      tempId: Date.now() + index,
      etiqueta: linea.trim(),
      valor: linea.trim().substring(0, 50), // Limitar a 50 caracteres
      puntos: 1,
      orden: index + 1,
      condicional: false,
      condicional_pregunta_id: null,
      excluyente: false,
    }));

    // Añadir las opciones a la pregunta
    setSurvey((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p) => {
        if (p.tempId !== currentQuestionForPaste) return p;
        return {
          ...p,
          opciones: [...p.opciones, ...nuevasOpciones],
        };
      }),
    }));

    // Cerrar el modal y limpiar
    setShowPasteModal(false);
    setPasteText('');
    setCurrentQuestionForPaste(null);
    alert(`Se crearon ${nuevasOpciones.length} opciones exitosamente`);
  };

  // --- 3. Lógica de Guardado ---
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    console.log('📋 Survey completo antes de guardar:', survey);

    // Limpiamos los 'tempId' antes de enviar a la API
    const surveyToSave = {
      ...survey,
      preguntas: survey.preguntas.map((p, pIndex) => ({
        // (Quitamos los IDs temporales)
        id_categoria_pregunta: parseInt(p.id_categoria_pregunta),
        texto: p.texto,
        tipo: p.tipo,
        orden: pIndex + 1, // Usar siempre el índice para evitar duplicados
        opciones: p.opciones.map((o, oIndex) => {
          // Generar valor único si está vacío
          let valorUnico = o.valor || o.etiqueta.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
          // Asegurar que sea único agregando índice si es necesario
          if (!valorUnico) {
            valorUnico = `opcion_${oIndex + 1}`;
          }

          // Mapear tempId de pregunta condicional a su orden
          let condicionalOrden = null;
          if (o.condicional && o.condicional_pregunta_id) {
            const preguntaIndex = survey.preguntas.findIndex(
              (pg) => pg.tempId === o.condicional_pregunta_id
            );
            if (preguntaIndex !== -1) {
              condicionalOrden = preguntaIndex + 1; // El orden empieza en 1
            }
          }

          return {
            etiqueta: o.etiqueta,
            valor: valorUnico,
            puntos: parseInt(o.puntos),
            orden: oIndex + 1,
            condicional: o.condicional ? 1 : 0,
            condicional_pregunta_orden: condicionalOrden, // Enviamos el ORDEN en lugar del ID
            excluyente: o.excluyente ? 1 : 0, // Marca si esta opción es excluyente
          };
        }),
      })),
    };

    console.log('📤 Datos a enviar:', JSON.stringify(surveyToSave, null, 2));

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
        <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">v2.0</span>
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
          maxLength={120}
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
          maxLength={500}
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
            maxLength={10}
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

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Texto de la Pregunta <span className="text-red-500">*</span>
                </label>
                <input
                  id={`p-texto-${pregunta.tempId}`}
                  name="texto"
                  value={pregunta.texto}
                  onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                  required
                  maxLength={300}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="¿Cuándo se lava las manos?"
                />
                <p className="mt-1 text-xs text-gray-500">
                  💡 Tip: Usa <code className="bg-gray-100 px-1 rounded">**negrita**</code> para resaltar texto importante
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor={`p-cat-${pregunta.tempId}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Categoría
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      + Nueva
                    </button>
                  </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-md font-semibold">Opciones de Respuesta</h4>
                    <button
                      type="button"
                      onClick={() => handleOpenPasteModal(pregunta.tempId)}
                      className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
                      title="Pegar múltiples opciones desde Excel"
                    >
                      📋 Pegar desde Excel
                    </button>
                  </div>
                  <div className="space-y-3">
                    {pregunta.opciones.map((opcion, oIndex) => (
                      <div
                        key={opcion.tempId}
                        className="rounded bg-gray-50 p-3"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <input
                              placeholder="Etiqueta (ej: Antes de comer)"
                              name="etiqueta"
                              value={opcion.etiqueta}
                              onChange={(e) => handleOptionChange(pregunta.tempId, opcion.tempId, e)}
                              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                              maxLength={200}
                            />
                            <p className="mt-0.5 text-xs text-gray-400">
                              Usa **negrita** si necesitas
                            </p>
                          </div>
                          <Input
                            placeholder="Valor (ej: si)"
                            name="valor"
                            value={opcion.valor}
                            onChange={(e) => handleOptionChange(pregunta.tempId, opcion.tempId, e)}
                            className="!mb-0"
                            maxLength={50}
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

                        {/* Configuración condicional y excluyente */}
                        <div className="mt-2 space-y-2 border-t border-gray-200 pt-2">
                          <div className="flex items-center gap-2">
                            <input
                              id={`condicional-${opcion.tempId}`}
                              type="checkbox"
                              name="condicional"
                              checked={opcion.condicional || false}
                              onChange={(e) => {
                                console.log('🖱️ CLICK en checkbox condicional!', e.target.checked);
                                handleOptionChange(pregunta.tempId, opcion.tempId, e);
                              }}
                              onClick={() => console.log('👆 onClick disparado')}
                              className="h-4 w-4 cursor-pointer"
                            />
                            <label htmlFor={`condicional-${opcion.tempId}`} className="text-sm font-medium cursor-pointer">
                              🔗 Pregunta condicional
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

                          <div className="flex items-center gap-2">
                            <input
                              id={`excluyente-${opcion.tempId}`}
                              type="checkbox"
                              name="excluyente"
                              checked={opcion.excluyente || false}
                              onChange={(e) => {
                                console.log('🖱️ CLICK en checkbox excluyente!', e.target.checked);
                                handleOptionChange(pregunta.tempId, opcion.tempId, e);
                              }}
                              onClick={() => console.log('👆 onClick excluyente disparado')}
                              className="h-4 w-4 cursor-pointer"
                            />
                            <label htmlFor={`excluyente-${opcion.tempId}`} className="text-sm font-medium cursor-pointer">
                              🚫 Opción excluyente (No Aplica)
                            </label>
                            <span className="text-xs text-gray-500">
                              (Si se marca, desmarca las demás opciones)
                            </span>
                          </div>
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-red-600">
                          🔴 Rojo hasta:
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          placeholder="3.34 (default)"
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
                          placeholder="6.67 (default)"
                          name="rango_naranja_max"
                          value={pregunta.rango_naranja_max || ''}
                          onChange={(e) => handleQuestionChange(pregunta.tempId, e)}
                          className="!mb-0"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      🟢 Verde: Valores superiores al Naranja
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

      {/* Modal para Crear Categoría */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">Crear Nueva Categoría</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre de la Categoría <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategory.nombre}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ej: Agua y Saneamiento"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={newCategory.descripcion}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows="3"
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Describe brevemente esta categoría..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategory({ nombre: '', descripcion: '' });
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                disabled={creatingCategory}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={creatingCategory || !newCategory.nombre.trim()}
              >
                {creatingCategory ? 'Creando...' : 'Crear Categoría'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Pegar Opciones desde Excel */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">📋 Pegar Opciones desde Excel</h3>

            <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <strong>💡 Instrucciones:</strong>
              <ul className="ml-4 mt-2 list-disc">
                <li>Copia las opciones desde Excel (una por línea)</li>
                <li>Pégalas en el área de texto a continuación</li>
                <li>Cada línea se convertirá en una opción automáticamente</li>
                <li>Puedes usar <strong>**negrita**</strong> para resaltar texto</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Opciones (una por línea)
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows="12"
                  className="w-full rounded-md border border-gray-300 p-3 font-mono text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Antes de comer&#10;Antes de cocinar&#10;Antes de dar de comer&#10;Después de usar la letrina&#10;Después de cambiar pañales&#10;Después de hacer la limpieza&#10;Después de tocar dinero&#10;Cuando las tiene sucias"
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500">
                  {pasteText.split('\n').filter(l => l.trim()).length} opciones detectadas
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteText('');
                  setCurrentQuestionForPaste(null);
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePasteOptions}
                className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                disabled={!pasteText.trim()}
              >
                ✓ Crear {pasteText.split('\n').filter(l => l.trim()).length} Opciones
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SurveyForm;
