import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { getSurveyById } from '../../api/surveys';
import { submitSurveyResponse, getResponsesCount } from '../../api/responses';
import { getDepartamentos, getMunicipiosByDepartamento, getComunidadesByMunicipio, getCatalogData } from '../../api/catalogos';
import { useAuth } from '../../context/AuthContext';

// Helper para renderizar texto con formato markdown (negrita)
const RenderMarkdown = ({ text }) => {
  if (!text) return null;
  // Convertir **texto** a <strong>texto</strong>
  const html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export default function SurveyFillForm() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { userName } = useAuth(); // ⬅️ NUEVO - Obtener nombre del usuario logueado

  const [survey, setSurvey] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
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
    id_departamento: '',
    id_municipio: '',
    id_comunidad: '',
    nombre_encuestada: '',
    edad_encuestada: '',
    sexo_encuestador: 'M',
    fecha_entrevista: new Date().toISOString().split('T')[0], // Fecha actual
    vuelta: 1, // Número de vuelta/ronda (auto-calculado)
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
      const [surveyRes, departamentosRes] = await Promise.all([
        getSurveyById(surveyId),
        getDepartamentos(),
      ]);

      setSurvey(surveyRes.data);
      setDepartamentos(departamentosRes.data);

      // DEBUG: Ver todas las opciones con condicionales
      console.log('🔍 DEBUG - Opciones con condicionales:');
      surveyRes.data.preguntas.forEach((p, idx) => {
        if (p.opciones) {
          p.opciones.forEach(o => {
            if (o.condicional || o.condicional_pregunta_id) {
              console.log(`  Pregunta ${idx + 1} (ID: ${p.id_pregunta}), Opción "${o.etiqueta}":`, {
                id_opcion: o.id_opcion,
                condicional: o.condicional,
                condicional_pregunta_id: o.condicional_pregunta_id,
                tipo_condicional_pregunta_id: typeof o.condicional_pregunta_id
              });
            }
          });
        }
      });

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

  // Maneja el cambio de departamento - carga municipios
  const handleDepartamentoChange = async (id_departamento) => {
    setHeaderData((prev) => ({
      ...prev,
      id_departamento,
      id_municipio: '',
      id_comunidad: '',
      vuelta: 1,
    }));
    setMunicipios([]);
    setCommunities([]);

    if (id_departamento) {
      try {
        const res = await getMunicipiosByDepartamento(id_departamento);
        setMunicipios(res.data);
      } catch (err) {
        console.error('Error cargando municipios:', err);
        setError('No se pudieron cargar los municipios');
      }
    }
  };

  // Maneja el cambio de municipio - carga comunidades
  const handleMunicipioChange = async (id_municipio) => {
    setHeaderData((prev) => ({
      ...prev,
      id_municipio,
      id_comunidad: '',
      vuelta: 1,
    }));
    setCommunities([]);

    if (id_municipio) {
      try {
        const res = await getComunidadesByMunicipio(id_municipio);
        setCommunities(res.data);
      } catch (err) {
        console.error('Error cargando comunidades:', err);
        setError('No se pudieron cargar las comunidades');
      }
    }
  };

  // Estado para manejar la vuelta máxima existente
  const [vueltaMax, setVueltaMax] = useState(0);

  // Maneja el cambio de comunidad - obtiene la vuelta máxima existente
  const handleComunidadChange = async (id_comunidad) => {
    if (id_comunidad) {
      try {
        // Obtener el conteo de respuestas para esta comunidad y encuesta
        const res = await getResponsesCount(id_comunidad, surveyId);
        const maxVuelta = res.data.next_vuelta - 1; // next_vuelta - 1 = última vuelta guardada
        setVueltaMax(maxVuelta);

        // Establecer la vuelta por defecto como la siguiente disponible
        setHeaderData((prev) => ({
          ...prev,
          id_comunidad,
          vuelta: res.data.next_vuelta,
        }));
      } catch (err) {
        console.error('Error obteniendo información de vueltas:', err);
        // Si falla, permitir desde vuelta 1
        setVueltaMax(0);
        setHeaderData((prev) => ({
          ...prev,
          id_comunidad,
          vuelta: 1,
        }));
      }
    } else {
      setHeaderData((prev) => ({
        ...prev,
        id_comunidad: '',
        vuelta: 1,
      }));
      setVueltaMax(0);
    }
  };

  const handleAnswerChange = (preguntaId, value, tipo, checked = null) => {
    console.log('🎯 handleAnswerChange llamado:', { preguntaId, value, tipo });

    // Manejar lógica condicional
    if (tipo === 'OpcionUnica' || tipo === 'SiNo') {
      const opcionId = parseInt(value);
      // Convertir preguntaId a número para comparar
      const preguntaIdNum = parseInt(preguntaId);

      // DEBUG: Ver estructura completa
      console.log('🔍 DEBUG - Estructura de survey:', {
        hayPreguntas: !!survey?.preguntas,
        cantidadPreguntas: survey?.preguntas?.length,
        tiposPreguntaIds: survey?.preguntas?.map(p => ({
          id: p.id_pregunta,
          tipo: typeof p.id_pregunta
        })),
        preguntaBuscada: preguntaIdNum,
        tipoPreguntaBuscada: typeof preguntaIdNum
      });

      // Buscar pregunta de forma más flexible (comparando como strings también)
      const pregunta = survey?.preguntas?.find(p => {
        return String(p.id_pregunta) === String(preguntaIdNum) || p.id_pregunta === preguntaIdNum;
      });

      const opcionSeleccionada = pregunta?.opciones?.find(o => {
        return String(o.id_opcion) === String(opcionId) || parseInt(o.id_opcion) === opcionId;
      });

      console.log('🔎 Búsqueda de opción:', {
        preguntaIdNum,
        opcionId,
        preguntaEncontrada: !!pregunta,
        preguntaEncontradaId: pregunta?.id_pregunta,
        cantidadOpciones: pregunta?.opciones?.length,
        opcionEncontrada: !!opcionSeleccionada,
        opcionSeleccionada: opcionSeleccionada ? {
          etiqueta: opcionSeleccionada.etiqueta,
          condicional: opcionSeleccionada.condicional,
          condicional_pregunta_id: opcionSeleccionada.condicional_pregunta_id,
          tipo_condicional: typeof opcionSeleccionada.condicional_pregunta_id
        } : null
      });

      // Convertir condicional a booleano (puede venir como 0/1 desde SQL Server)
      const esCondicional = Boolean(opcionSeleccionada?.condicional);
      const preguntaCondicionalId = opcionSeleccionada?.condicional_pregunta_id;

      // Validar que condicional_pregunta_id no sea null ni undefined
      if (esCondicional && preguntaCondicionalId != null) {
        // Mostrar pregunta condicional
        console.log('✅ MOSTRANDO pregunta condicional ID:', preguntaCondicionalId);
        setVisibleQuestions(prev => {
          const newSet = new Set([...prev, preguntaCondicionalId]);
          console.log('  Preguntas visibles ahora:', Array.from(newSet));
          return newSet;
        });
      } else {
        if (esCondicional && preguntaCondicionalId == null) {
          console.warn('⚠️ Opción marcada como condicional pero sin pregunta condicional asignada');
        }

        // Ocultar preguntas condicionales de otras opciones de esta pregunta
        const otrasPreguntasCondicionales = pregunta?.opciones
          ?.filter(o => {
            const esOtraCondicional = Boolean(o.condicional);
            const otraOpcionId = parseInt(o.id_opcion);
            return otraOpcionId !== opcionId && esOtraCondicional && o.condicional_pregunta_id != null;
          })
          ?.map(o => o.condicional_pregunta_id) || [];

        console.log('❌ OCULTANDO preguntas condicionales:', otrasPreguntasCondicionales);

        setVisibleQuestions(prev => {
          const newSet = new Set(prev);
          otrasPreguntasCondicionales.forEach(id => newSet.delete(id));
          console.log('  Preguntas visibles ahora:', Array.from(newSet));
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

        // Encontrar la pregunta y la opción seleccionada
        const preguntaIdNum = parseInt(preguntaId);
        const pregunta = survey?.preguntas.find(p => p.id_pregunta === preguntaIdNum);
        const opcionSeleccionada = pregunta?.opciones.find(opt => parseInt(opt.id_opcion) === opcionId);

        // Convertir excluyente a booleano
        const esExcluyente = Boolean(opcionSeleccionada?.excluyente);

        if (checked) {
          // Si la opción es excluyente, limpiar todas las demás
          if (esExcluyente) {
            nuevasOpciones = [opcionId];
          } else {
            // Verificar si ya hay una opción excluyente seleccionada
            const idExcluyente = nuevasOpciones.find(id => {
              const opt = pregunta?.opciones.find(o => o.id_opcion === id);
              return Boolean(opt?.excluyente);
            });

            // Si ya hay una excluyente, primero quitarla
            if (idExcluyente) {
              nuevasOpciones = nuevasOpciones.filter(id => id !== idExcluyente);
            }

            // Agregar la nueva opción si no existe
            if (!nuevasOpciones.includes(opcionId)) {
              nuevasOpciones.push(opcionId);
            }
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
            // Marcar si es una respuesta excluyente (No Aplica)
            es_no_aplica: esExcluyente && checked,
          },
        };
      }

      // Para otros tipos de pregunta
      // Encontrar la pregunta y opción para manejar excluyentes
      const preguntaIdNum = parseInt(preguntaId);
      const pregunta = survey?.preguntas.find(p => p.id_pregunta === preguntaIdNum);
      let esNoAplica = false;

      if (tipo === 'OpcionUnica') {
        const opcionSeleccionada = pregunta?.opciones.find(opt => parseInt(opt.id_opcion) === parseInt(value));
        esNoAplica = Boolean(opcionSeleccionada?.excluyente);
      }

      // Para tipo SiNo, necesitamos guardar el id_opcion como OpcionUnica
      let datosRespuesta = {};

      if (tipo === 'Numerica') {
        datosRespuesta = { valor_numerico: parseFloat(value) || 0 };
      } else if (tipo === 'SiNo') {
        // Ahora SiNo funciona igual que OpcionUnica (usa id_opcion)
        const opcionSeleccionada = pregunta?.opciones.find(opt => parseInt(opt.id_opcion) === parseInt(value));
        console.log('💾 Guardando respuesta SiNo:', {
          preguntaId,
          value,
          id_opcion: parseInt(value),
          opcionSeleccionada: opcionSeleccionada?.etiqueta
        });
        datosRespuesta = {
          id_opcion: parseInt(value),
          es_no_aplica: Boolean(opcionSeleccionada?.excluyente)
        };
      } else if (tipo === 'OpcionUnica') {
        datosRespuesta = { id_opcion: parseInt(value), es_no_aplica: esNoAplica };
      } else if (tipo === 'Texto' || tipo === 'Fecha' || tipo === 'Catalogo') {
        datosRespuesta = { valor_texto: value };
      } else {
        datosRespuesta = { valor: value };
      }

      return {
        ...prev,
        [preguntaId]: {
          id_pregunta: preguntaId,
          tipo: tipo,
          ...datosRespuesta,
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
    console.log('🔍 Validando preguntas requeridas:', preguntasRequeridas.length);

    for (const pregunta of preguntasRequeridas) {
      // Verificar si esta pregunta es condicional (aparece en alguna opción)
      const esCondicional = survey.preguntas.some(p =>
        p.opciones?.some(o => {
          const esCondicionalBool = Boolean(o.condicional);
          return esCondicionalBool && o.condicional_pregunta_id === pregunta.id_pregunta;
        })
      );

      // Si es condicional y NO está visible, skip la validación
      if (esCondicional && !visibleQuestions.has(pregunta.id_pregunta)) {
        console.log(`⏭️ Skip validación - Pregunta condicional oculta: "${pregunta.texto}"`);
        continue; // No validar preguntas condicionales ocultas
      }

      const respuesta = answers[pregunta.id_pregunta];
      console.log(`📝 Validando pregunta ${pregunta.id_pregunta} (${pregunta.tipo}):`, respuesta);

      if (!respuesta) {
        setError(`La pregunta "${pregunta.texto}" es requerida`);
        return false;
      }

      // Validar según tipo
      if (pregunta.tipo === 'OpcionMultiple') {
        // OpcionMultiple puede quedar sin respuesta (se considera como 0 puntos)
        // No es necesario validar, permitir continuar
      } else if (pregunta.tipo === 'SiNo') {
        // SiNo funciona igual que OpcionUnica (usa id_opcion)
        if (!respuesta.id_opcion) {
          console.error('❌ Pregunta SiNo sin id_opcion:', { pregunta: pregunta.texto, respuesta });
          setError(`La pregunta "${pregunta.texto}" es requerida`);
          return false;
        }
        console.log('✅ Pregunta SiNo válida:', pregunta.texto, 'id_opcion:', respuesta.id_opcion);
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

        // Verificar si la pregunta es condicional y está oculta
        const esCondicional = survey.preguntas.some(p =>
          p.opciones?.some(o => {
            const esCondicionalBool = Boolean(o.condicional);
            return esCondicionalBool && o.condicional_pregunta_id === ans.id_pregunta;
          })
        );

        // Si es condicional y NO está visible, no enviar esta respuesta
        if (esCondicional && !visibleQuestions.has(ans.id_pregunta)) {
          return; // Skip preguntas condicionales ocultas
        }

        if (ans.tipo === 'OpcionMultiple') {
          // Para OpcionMultiple: crear una fila por cada opción seleccionada
          if (ans.opciones_multiple && ans.opciones_multiple.length > 0) {
            ans.opciones_multiple.forEach((opcionId) => {
              // Buscar puntos de la opción
              const opcion = pregunta?.opciones?.find(o => o.id_opcion === opcionId);
              respuestasArray.push({
                id_pregunta: ans.id_pregunta,
                id_opcion: opcionId,
                puntos: opcion?.puntos || 1, // Usar puntos de la opción, default 1
                es_no_aplica: ans.es_no_aplica || false, // Marcar si es No Aplica
              });
            });
          } else {
            // Si no hay opciones seleccionadas, enviar respuesta con puntos = 0
            respuestasArray.push({
              id_pregunta: ans.id_pregunta,
              puntos: 0, // Sin selección = 0 puntos
              es_no_aplica: false,
            });
          }
        } else {
          // Para otros tipos: una sola fila
          const opcion = pregunta?.opciones?.find(o => o.id_opcion === ans.id_opcion);
          respuestasArray.push({
            id_pregunta: ans.id_pregunta,
            ...(ans.id_opcion && { id_opcion: ans.id_opcion }),
            ...(ans.valor_numerico !== null && ans.valor_numerico !== undefined && { valor_numerico: ans.valor_numerico }),
            ...(ans.valor_texto && { valor_texto: ans.valor_texto }),
            puntos: opcion?.puntos || ans.puntos || 0,
            es_no_aplica: ans.es_no_aplica || false, // Marcar si es No Aplica
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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/surveyor/list')}
            className="mb-3 flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-800 sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Encuestas
          </button>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">{survey?.titulo}</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">{survey?.descripcion}</p>
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
          <div className="mb-4 rounded-lg bg-white p-4 shadow-md sm:mb-6 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-800 sm:mb-4 sm:text-xl">
              Datos de la Encuesta
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
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

              {/* Departamento */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Departamento <span className="text-red-500">*</span>
                </label>
                <select
                  value={headerData.id_departamento}
                  onChange={(e) => handleDepartamentoChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar departamento...</option>
                  {departamentos.map((dep) => (
                    <option key={dep.id_departamento} value={dep.id_departamento}>
                      {dep.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Municipio */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Municipio <span className="text-red-500">*</span>
                </label>
                <select
                  value={headerData.id_municipio}
                  onChange={(e) => handleMunicipioChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!headerData.id_departamento}
                >
                  <option value="">
                    {headerData.id_departamento ? 'Seleccionar municipio...' : 'Primero seleccione departamento'}
                  </option>
                  {municipios.map((mun) => (
                    <option key={mun.id_municipio} value={mun.id_municipio}>
                      {mun.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comunidad */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Comunidad <span className="text-red-500">*</span>
                </label>
                <select
                  value={headerData.id_comunidad}
                  onChange={(e) => handleComunidadChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!headerData.id_municipio}
                >
                  <option value="">
                    {headerData.id_municipio ? 'Seleccionar comunidad...' : 'Primero seleccione municipio'}
                  </option>
                  {communities.map((com) => (
                    <option key={com.id_comunidad} value={com.id_comunidad}>
                      {com.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vuelta/Ronda */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Número de Vuelta <span className="text-red-500">*</span>
                </label>
                <select
                  value={headerData.vuelta}
                  onChange={(e) => handleHeaderChange('vuelta', parseInt(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!headerData.id_comunidad}
                >
                  <option value="">
                    {headerData.id_comunidad ? 'Seleccionar vuelta...' : 'Primero seleccione comunidad'}
                  </option>
                  {/* Generar opciones desde la vuelta mínima permitida hasta 10 */}
                  {headerData.id_comunidad && Array.from({ length: 11 - Math.max(1, vueltaMax) }, (_, i) => {
                    const vueltaNum = Math.max(1, vueltaMax) + i;
                    return (
                      <option key={vueltaNum} value={vueltaNum}>
                        Vuelta {vueltaNum} {vueltaNum === vueltaMax + 1 ? '(Siguiente)' : vueltaNum <= vueltaMax ? '(Ya existe)' : ''}
                      </option>
                    );
                  })}
                </select>
                {vueltaMax > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Última vuelta guardada: {vueltaMax}. Solo puede seleccionar desde la vuelta {vueltaMax} en adelante.
                  </p>
                )}
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

              {/* Número de Vuelta/Ronda (Auto-calculado) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Vuelta/Ronda (Auto-calculado)
                </label>
                <input
                  type="text"
                  value={headerData.vuelta ? `Vuelta ${headerData.vuelta}` : 'Seleccione una comunidad'}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-600"
                  readOnly
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  ⚡ Se calcula automáticamente según las respuestas previas en esta comunidad
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
                  p.opciones?.some(o => {
                    // Convertir condicional a booleano (puede venir como 0/1 desde SQL Server)
                    const esCondicionalBool = Boolean(o.condicional);
                    const match = esCondicionalBool && o.condicional_pregunta_id === pregunta.id_pregunta;

                    if (match) {
                      console.log(`🔗 Pregunta ${pregunta.id_pregunta} es CONDICIONAL de opción "${o.etiqueta}" (ID: ${o.id_opcion})`);
                    }

                    return match;
                  })
                );

                const estaVisible = visibleQuestions.has(pregunta.id_pregunta);
                const mostrar = !esCondicional || estaVisible;

                if (esCondicional) {
                  console.log(`👁️ Pregunta ${pregunta.id_pregunta} "${pregunta.texto.substring(0, 40)}...":`, {
                    esCondicional,
                    estaVisible,
                    mostrar,
                    visibleQuestions: Array.from(visibleQuestions)
                  });
                }

                // Mostrar si NO es condicional O si está en el set de visibles
                return mostrar;
              })
              ?.map((pregunta, index) => (
              <div key={pregunta.id_pregunta} className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-4 font-semibold text-gray-800">
                  {index + 1}. <RenderMarkdown text={pregunta.texto} />
                  {pregunta.requerida && <span className="text-red-500"> *</span>}
                </h3>

                {/* Tipo: Sí/No */}
                {pregunta.tipo === 'SiNo' && pregunta.opciones && (
                  <div className="flex gap-4">
                    {pregunta.opciones.map((opcion) => (
                      <label key={opcion.id_opcion} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`pregunta-${pregunta.id_pregunta}`}
                          value={opcion.id_opcion}
                          onChange={(e) => handleAnswerChange(pregunta.id_pregunta, e.target.value, 'SiNo')}
                          className="h-4 w-4"
                          required={pregunta.requerida}
                        />
                        <span>{opcion.etiqueta}</span>
                      </label>
                    ))}
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
                        <span><RenderMarkdown text={opcion.etiqueta} /></span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Tipo: Opción Múltiple */}
                {pregunta.tipo === 'OpcionMultiple' && pregunta.opciones && (
                  <div className="space-y-2">
                    {pregunta.opciones.map((opcion) => {
                      const inputId = `q-${pregunta.id_pregunta}-op-${opcion.id_opcion}`;
                      // Convertir AMBOS a números para comparar
                      const opcionIdNum = parseInt(opcion.id_opcion);
                      const opcionesSeleccionadas = answers[pregunta.id_pregunta]?.opciones_multiple || [];
                      const isChecked = opcionesSeleccionadas.includes(opcionIdNum);

                      // Verificar si hay una opción excluyente seleccionada
                      const hayExcluyenteSeleccionada = opcionesSeleccionadas.some(idSel => {
                        const opSel = pregunta.opciones.find(o => parseInt(o.id_opcion) === idSel);
                        return Boolean(opSel?.excluyente);
                      });

                      // Deshabilitar esta opción si:
                      // - Hay una excluyente seleccionada Y esta opción NO es la excluyente seleccionada
                      // - O si esta opción NO es excluyente pero hay una excluyente seleccionada
                      const esExcluyente = Boolean(opcion.excluyente);
                      const isDisabled = hayExcluyenteSeleccionada && !isChecked && !esExcluyente;

                      return (
                        <div
                          key={opcion.id_opcion}
                          className={`flex items-center gap-2 p-2 border rounded ${isDisabled ? 'opacity-50 bg-gray-50' : ''}`}
                        >
                          <input
                            id={inputId}
                            type="checkbox"
                            name={`q_${pregunta.id_pregunta}[]`}
                            value={opcion.id_opcion}
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={(e) => {
                              handleAnswerChange(pregunta.id_pregunta, e.target.value, 'OpcionMultiple', e.target.checked);
                            }}
                            style={{
                              width: '20px',
                              height: '20px',
                              accentColor: 'blue'
                            }}
                          />
                          <label
                            htmlFor={inputId}
                            className={`select-none flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <RenderMarkdown text={opcion.etiqueta} />
                            {opcion.excluyente && <span className="ml-2 text-xs text-orange-600 font-semibold">(Excluyente)</span>}
                          </label>
                          {/* Indicador visual del estado */}
                          <span className={`text-xs px-2 py-1 rounded ${isChecked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {isChecked ? '✓ Marcado' : '○ No marcado'}
                          </span>
                        </div>
                      );
                    })}
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
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:flex-none sm:px-6 sm:py-3 sm:text-base"
              disabled={submitting}
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 sm:px-6 sm:py-3 sm:text-base"
            >
              <Save className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">{submitting ? 'Enviando...' : 'Enviar Respuestas'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
