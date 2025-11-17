import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { getSurveyById } from '../../api/surveys';
import { submitSurveyResponse } from '../../api/responses';
import { getComunidades, getCatalogData } from '../../api/catalogos';
import { useAuth } from '../../context/AuthContext';

export default function SurveyFillForm() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { userName } = useAuth(); // ⬅️ NUEVO - Obtener nombre del usuario logueado

  const [survey, setSurvey] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [catalogOptions, setCatalogOptions] = useState({}); // Opciones de catálogos dinámicos
  const [visibleQuestions, setVisibleQuestions] = useState(new Set()); // IDs de preguntas visibles por condicionales
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Datos del encabezado
  const [headerData, setHeaderData] = useState({
    boleta_num: '',
    id_comunidad: '',
    nombre_encuestada: '',
    edad_encuestada: '',
    sexo_encuestador: 'M',
    fecha_entrevista: new Date().toISOString().split('T')[0], // Fecha actual
    vuelta: 1, // Número de vuelta/ronda
  });

  // Respuestas de las preguntas
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    loadData();
  }, [surveyId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [surveyRes, communitiesRes] = await Promise.all([
        getSurveyById(surveyId),
        getComunidades(),
      ]);

      setSurvey(surveyRes.data);
      setCommunities(communitiesRes.data);

      // Cargar opciones de catálogos dinámicos
      const catalogosData = {};
      const catalogoPromises = surveyRes.data.preguntas
        .filter((p) => p.tipo === 'Catalogo' && p.catalogo_tabla && p.catalogo_valor && p.catalogo_etiqueta)
        .map(async (pregunta) => {
          try {
            const res = await getCatalogData(pregunta.catalogo_tabla, pregunta.catalogo_valor, pregunta.catalogo_etiqueta);
            catalogosData[pregunta.id_pregunta] = res.data.opciones || [];
          } catch (err) {
            console.error(`Error cargando catálogo para pregunta ${pregunta.id_pregunta}:`, err);
            catalogosData[pregunta.id_pregunta] = [];
          }
        });

      await Promise.all(catalogoPromises);
      setCatalogOptions(catalogosData);

      // Inicializar respuestas vacías para cada pregunta
      const initialAnswers = {};
      surveyRes.data.preguntas.forEach((pregunta) => {
        initialAnswers[pregunta.id_pregunta] = {
          id_pregunta: pregunta.id_pregunta,
          tipo: pregunta.tipo,
          valor: null,
          id_opcion: null,
          opciones_multiple: [], // Array para OpcionMultiple
          valor_numerico: null,
          valor_texto: null,
        };
      });
      setAnswers(initialAnswers);

      setLoading(false);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('No se pudo cargar la encuesta');
      setLoading(false);
    }
  };

  const handleHeaderChange = (field, value) => {
    setHeaderData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAnswerChange = (preguntaId, value, tipo, checked = null) => {
    // Manejar lógica condicional
    if (tipo === 'OpcionUnica' || tipo === 'SiNo') {
      const opcionId = parseInt(value);
      const pregunta = survey?.preguntas?.find(p => p.id_pregunta === preguntaId);
      const opcionSeleccionada = pregunta?.opciones?.find(o => o.id_opcion === opcionId);

      if (opcionSeleccionada?.condicional && opcionSeleccionada?.condicional_pregunta_id) {
        // Mostrar pregunta condicional
        setVisibleQuestions(prev => new Set([...prev, opcionSeleccionada.condicional_pregunta_id]));
      } else {
        // Ocultar preguntas condicionales de otras opciones de esta pregunta
        const otrasPreguntasCondicionales = pregunta?.opciones
          ?.filter(o => o.id_opcion !== opcionId && o.condicional && o.condicional_pregunta_id)
          ?.map(o => o.condicional_pregunta_id) || [];

        setVisibleQuestions(prev => {
          const newSet = new Set(prev);
          otrasPreguntasCondicionales.forEach(id => newSet.delete(id));
          return newSet;
        });
      }
    }

    setAnswers((prev) => {
      const current = prev[preguntaId] || {};

      if (tipo === 'OpcionMultiple') {
        // Manejar array de opciones seleccionadas
        const opcionId = parseInt(value);
        let nuevasOpciones = [...(current.opciones_multiple || [])];

        if (checked) {
          // Agregar opción si no existe
          if (!nuevasOpciones.includes(opcionId)) {
            nuevasOpciones.push(opcionId);
          }
        } else {
          // Quitar opción
          nuevasOpciones = nuevasOpciones.filter(id => id !== opcionId);
        }

        return {
          ...prev,
          [preguntaId]: {
            ...current,
            id_pregunta: preguntaId,
            tipo: tipo,
            opciones_multiple: nuevasOpciones,
          },
        };
      }

      // Para otros tipos de pregunta
      return {
        ...prev,
        [preguntaId]: {
          id_pregunta: preguntaId,
          tipo: tipo,
          ...(tipo === 'Numerica'
            ? { valor_numerico: parseFloat(value) || 0 }
            : tipo === 'SiNo'
            ? { valor_texto: value, puntos: value === 'Si' ? 1 : 0 }
            : tipo === 'OpcionUnica'
            ? { id_opcion: parseInt(value) }
            : tipo === 'Texto' || tipo === 'Fecha' || tipo === 'Catalogo'
            ? { valor_texto: value }
            : { valor: value }),
        },
      };
    });
  };

  const validateForm = () => {
    // Validar encabezado
    if (!headerData.boleta_num || headerData.boleta_num.trim() === '') {
      setError('El código de boleta es requerido');
      return false;
    }

    if (!headerData.id_comunidad) {
      setError('Debe seleccionar una comunidad');
      return false;
    }

    if (!headerData.nombre_encuestada || headerData.nombre_encuestada.trim() === '') {
      setError('El nombre de la encuestada es requerido');
      return false;
    }

    if (!headerData.edad_encuestada || headerData.edad_encuestada <= 0) {
      setError('La edad de la encuestada es requerida y debe ser mayor a 0');
      return false;
    }

    // Validar que todas las preguntas requeridas tengan respuesta
    const preguntasRequeridas = survey.preguntas.filter((p) => p.requerida);
    for (const pregunta of preguntasRequeridas) {
      const respuesta = answers[pregunta.id_pregunta];
      if (!respuesta) {
        setError(`La pregunta "${pregunta.texto}" es requerida`);
        return false;
      }

      // Validar según tipo
      if (pregunta.tipo === 'OpcionMultiple') {
        if (!respuesta.opciones_multiple || respuesta.opciones_multiple.length === 0) {
          setError(`Debe seleccionar al menos una opción en: "${pregunta.texto}"`);
          return false;
        }
      } else if (pregunta.tipo === 'OpcionUnica') {
        if (!respuesta.id_opcion) {
          setError(`La pregunta "${pregunta.texto}" es requerida`);
          return false;
        }
      } else if (pregunta.tipo === 'Numerica') {
        if (respuesta.valor_numerico === null || respuesta.valor_numerico === undefined) {
          setError(`La pregunta "${pregunta.texto}" es requerida`);
          return false;
        }
      } else {
        if (!respuesta.valor_texto && !respuesta.valor) {
          setError(`La pregunta "${pregunta.texto}" es requerida`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Convertir respuestas a array
      const respuestasArray = [];

      Object.values(answers).forEach((ans) => {
        if (!ans.id_pregunta) return; // Skip si no tiene pregunta

        // Obtener datos de la pregunta para los puntos
        const pregunta = survey.preguntas.find(p => p.id_pregunta === ans.id_pregunta);

        if (ans.tipo === 'OpcionMultiple' && ans.opciones_multiple && ans.opciones_multiple.length > 0) {
          // Para OpcionMultiple: crear una fila por cada opción seleccionada
          ans.opciones_multiple.forEach((opcionId) => {
            // Buscar puntos de la opción
            const opcion = pregunta?.opciones?.find(o => o.id_opcion === opcionId);
            respuestasArray.push({
              id_pregunta: ans.id_pregunta,
              id_opcion: opcionId,
              puntos: opcion?.puntos || 1, // Usar puntos de la opción, default 1
            });
          });
        } else {
          // Para otros tipos: una sola fila
          const opcion = pregunta?.opciones?.find(o => o.id_opcion === ans.id_opcion);
          respuestasArray.push({
            id_pregunta: ans.id_pregunta,
            ...(ans.id_opcion && { id_opcion: ans.id_opcion }),
            ...(ans.valor_numerico !== null && ans.valor_numerico !== undefined && { valor_numerico: ans.valor_numerico }),
            ...(ans.valor_texto && { valor_texto: ans.valor_texto }),
            puntos: opcion?.puntos || ans.puntos || 0,
          });
        }
      });

      const data = {
        boleta_num: parseInt(headerData.boleta_num),
        id_encuesta: parseInt(surveyId),
        id_comunidad: parseInt(headerData.id_comunidad),
        nombre_encuestada: headerData.nombre_encuestada,
        edad_encuestada: parseInt(headerData.edad_encuestada),
        sexo_encuestador: headerData.sexo_encuestador,
        fecha_entrevista: headerData.fecha_entrevista,
        vuelta: parseInt(headerData.vuelta),
        respuestas: respuestasArray,
      };

      console.log('Enviando respuestas:', data);

      await submitSurveyResponse(data);

      setSuccess(true);
      setTimeout(() => {
        navigate('/surveyor/list');
      }, 2000);
    } catch (err) {
      console.error('Error enviando respuestas:', err);
      setError(
        err.response?.data?.msg || 'Error al enviar las respuestas. Verifica el código de boleta.'
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando encuesta...</p>
        </div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <h3 className="mt-2 font-semibold text-red-800">Error</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button
            onClick={() => navigate('/surveyor/list')}
            className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Encuestas
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <h3 className="mt-4 text-xl font-semibold text-green-800">¡Respuestas Enviadas!</h3>
          <p className="mt-2 text-sm text-green-700">
            Las respuestas se han guardado correctamente.
          </p>
          <p className="mt-1 text-xs text-green-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/surveyor/list')}
              className="mb-2 flex items-center gap-2 text-gray-600 transition hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Mis Encuestas
            </button>
            <h1 className="text-3xl font-bold text-gray-800">{survey?.titulo}</h1>
            <p className="mt-1 text-gray-600">{survey?.descripcion}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Datos del Encabezado */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              Datos de la Encuesta
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Código de Boleta */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Código de Boleta <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={headerData.boleta_num}
                  onChange={(e) => handleHeaderChange('boleta_num', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 2000001"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Código único de esta boleta
                </p>
              </div>

              {/* Comunidad */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Comunidad <span className="text-red-500">*</span>
                </label>
                <select
                  value={headerData.id_comunidad}
                  onChange={(e) => handleHeaderChange('id_comunidad', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {communities.map((com) => (
                    <option key={com.id_comunidad} value={com.id_comunidad}>
                      {com.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre Encuestada */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nombre de la Encuestada <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={headerData.nombre_encuestada}
                  onChange={(e) => handleHeaderChange('nombre_encuestada', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre completo"
                  required
                />
              </div>

              {/* Edad */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Edad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={headerData.edad_encuestada}
                  onChange={(e) => handleHeaderChange('edad_encuestada', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Edad en años"
                  required
                />
              </div>

              {/* Sexo del Encuestador */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Sexo del Encuestador <span className="text-red-500">*</span>
                </label>
                <select
                  value={headerData.sexo_encuestador}
                  onChange={(e) => handleHeaderChange('sexo_encuestador', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>

              {/* Nombre del Encuestador (automático) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Encuestador
                </label>
                <input
                  type="text"
                  value={userName || 'No disponible'}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-600"
                  readOnly
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  📝 Se guarda automáticamente del usuario logueado
                </p>
              </div>

              {/* Fecha de Entrevista */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Fecha de Entrevista <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={headerData.fecha_entrevista}
                  onChange={(e) => handleHeaderChange('fecha_entrevista', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Número de Vuelta/Ronda */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Vuelta/Ronda <span className="text-red-500">*</span>
                </label>
                <select
                  value={headerData.vuelta}
                  onChange={(e) => handleHeaderChange('vuelta', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="1">1ra Vuelta (Primera visita)</option>
                  <option value="2">2da Vuelta</option>
                  <option value="3">3ra Vuelta</option>
                  <option value="4">4ta Vuelta</option>
                  <option value="5">5ta Vuelta</option>
                  <option value="6">6ta Vuelta</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Seleccione el número de visita a esta comunidad
                </p>
              </div>
            </div>
          </div>

          {/* Preguntas */}
          <div className="space-y-6">
            {survey?.preguntas
              ?.filter((pregunta) => {
                // Verificar si esta pregunta es condicional (aparece en alguna opción)
                const esCondicional = survey.preguntas.some(p =>
                  p.opciones?.some(o => o.condicional && o.condicional_pregunta_id === pregunta.id_pregunta)
                );

                // Mostrar si NO es condicional O si está en el set de visibles
                return !esCondicional || visibleQuestions.has(pregunta.id_pregunta);
              })
              ?.map((pregunta, index) => (
              <div key={pregunta.id_pregunta} className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-4 font-semibold text-gray-800">
                  {index + 1}. {pregunta.texto}
                  {pregunta.requerida && <span className="text-red-500"> *</span>}
                </h3>

                {/* Tipo: Sí/No */}
                {pregunta.tipo === 'SiNo' && (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.id_pregunta}`}
                        value="Si"
                        onChange={(e) => handleAnswerChange(pregunta.id_pregunta, e.target.value, 'SiNo')}
                        className="h-4 w-4"
                        required={pregunta.requerida}
                      />
                      <span>Sí</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.id_pregunta}`}
                        value="No"
                        onChange={(e) => handleAnswerChange(pregunta.id_pregunta, e.target.value, 'SiNo')}
                        className="h-4 w-4"
                        required={pregunta.requerida}
                      />
                      <span>No</span>
                    </label>
                  </div>
                )}

                {/* Tipo: Numérica */}
                {pregunta.tipo === 'Numerica' && (
                  <input
                    type="number"
                    step="0.01"
                    onChange={(e) =>
                      handleAnswerChange(pregunta.id_pregunta, e.target.value, 'Numerica')
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    required={pregunta.requerida}
                  />
                )}

                {/* Tipo: Texto */}
                {pregunta.tipo === 'Texto' && (
                  <textarea
                    rows="3"
                    onChange={(e) => handleAnswerChange(pregunta.id_pregunta, e.target.value, 'Texto')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    required={pregunta.requerida}
                  />
                )}

                {/* Tipo: Opción Única */}
                {pregunta.tipo === 'OpcionUnica' && pregunta.opciones && (
                  <div className="space-y-2">
                    {pregunta.opciones.map((opcion) => (
                      <label key={opcion.id_opcion} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`pregunta-${pregunta.id_pregunta}`}
                          value={opcion.id_opcion}
                          onChange={(e) =>
                            handleAnswerChange(pregunta.id_pregunta, e.target.value, 'OpcionUnica')
                          }
                          className="h-4 w-4"
                          required={pregunta.requerida}
                        />
                        <span>{opcion.etiqueta}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Tipo: Opción Múltiple */}
                {pregunta.tipo === 'OpcionMultiple' && pregunta.opciones && (
                  <div className="space-y-2">
                    {pregunta.opciones.map((opcion) => (
                      <label key={opcion.id_opcion} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={opcion.id_opcion}
                          checked={answers[pregunta.id_pregunta]?.opciones_multiple?.includes(opcion.id_opcion) || false}
                          onChange={(e) =>
                            handleAnswerChange(pregunta.id_pregunta, e.target.value, 'OpcionMultiple', e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{opcion.etiqueta}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Tipo: Fecha */}
                {pregunta.tipo === 'Fecha' && (
                  <input
                    type="date"
                    onChange={(e) => handleAnswerChange(pregunta.id_pregunta, e.target.value, 'Fecha')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    required={pregunta.requerida}
                  />
                )}

                {/* Tipo: Catálogo */}
                {pregunta.tipo === 'Catalogo' && catalogOptions[pregunta.id_pregunta] && (
                  <select
                    onChange={(e) => handleAnswerChange(pregunta.id_pregunta, e.target.value, 'Catalogo')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    required={pregunta.requerida}
                  >
                    <option value="">-- Seleccionar --</option>
                    {catalogOptions[pregunta.id_pregunta].map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>
                        {opcion.etiqueta}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* Botones */}
          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/surveyor/list')}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition hover:bg-gray-50"
              disabled={submitting}
            >
              <ArrowLeft className="h-5 w-5" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {submitting ? 'Enviando...' : 'Enviar Respuestas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
