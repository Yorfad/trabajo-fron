// src/pages/Surveyor/SurveyFillForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSurveyById, createSurveyResponse, generateBoletaNumber } from '../../api/surveys';
import { getComunidades, getDepartamentos, getMunicipios } from '../../api/catalogos';
import { getCurrentUser } from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Swal from 'sweetalert2';

const SurveyFillForm = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [allMunicipios, setAllMunicipios] = useState([]); // Todos los municipios sin filtrar
  const [allComunidades, setAllComunidades] = useState([]); // Todas las comunidades sin filtrar
  const [selectedDepartamento, setSelectedDepartamento] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Obtener fecha local en formato YYYY-MM-DD sin conversión a UTC
  const getFechaLocal = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Datos generales de la respuesta
  const [generalData, setGeneralData] = useState({
    boleta_num: '',
    id_comunidad: '',
    fecha_entrevista: getFechaLocal(),
    nombre_encuestado: '',
    sexo_encuestador: '', // Sexo del encuestador
    nombre_encuestada: '',
    edad_encuestada: '',
    tipo_encuesta: '' // Para el grupo focal específico
  });

  // Respuestas del usuario (key: id_pregunta, value: respuesta)
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    loadSurveyData();
  }, [surveyId]);

  const loadSurveyData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Cargando encuesta con ID:', surveyId);

      // Obtener usuario actual
      const currentUser = getCurrentUser();

      const [surveyRes, departamentosRes, municipiosRes, comunidadesRes, boletaRes] = await Promise.all([
        getSurveyById(surveyId),
        getDepartamentos(),
        getMunicipios(),
        getComunidades(),
        generateBoletaNumber()
      ]);

      console.log('Respuesta de encuesta:', surveyRes);
      console.log('Respuesta de departamentos:', departamentosRes);
      console.log('Respuesta de municipios:', municipiosRes);
      console.log('Respuesta de comunidades:', comunidadesRes);
      console.log('Número de boleta generado:', boletaRes);

      setSurvey(surveyRes.data);
      setDepartamentos(departamentosRes.data || []);
      setAllMunicipios(municipiosRes.data || []);
      setAllComunidades(comunidadesRes.data || []);

      // Pre-llenar datos generales automáticamente
      setGeneralData(prev => ({
        ...prev,
        boleta_num: boletaRes.data.boleta_num,
        nombre_encuestado: currentUser?.nombre || ''
      }));

      // Inicializar respuestas vacías
      const initialAnswers = {};
      if (surveyRes.data && surveyRes.data.preguntas) {
        surveyRes.data.preguntas.forEach(pregunta => {
          initialAnswers[pregunta.id_pregunta] = {
            id_pregunta: pregunta.id_pregunta,
            // Para opción múltiple usamos un array, para otras un valor único
            id_opcion: pregunta.tipo === 'OpcionMultiple' ? [] : null,
            valor_numerico: null,
            valor_texto: null,
            puntos: 0
          };
        });
      }
      setAnswers(initialAnswers);
      console.log('Encuesta cargada exitosamente');

    } catch (err) {
      console.error('Error cargando datos de la encuesta:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);

      let errorMessage = 'No se pudo cargar la encuesta. ';
      if (err.response?.status === 404) {
        errorMessage += 'Encuesta no encontrada.';
      } else if (err.response?.status === 401) {
        errorMessage += 'Sesión expirada. Por favor inicie sesión nuevamente.';
      } else if (err.response?.data?.msg) {
        errorMessage += err.response.data.msg;
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Por favor intente nuevamente.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneralDataChange = (e) => {
    const { name, value } = e.target;
    setGeneralData(prev => ({ ...prev, [name]: value }));
  };

  const handleDepartamentoChange = (e) => {
    const idDepartamento = e.target.value;
    setSelectedDepartamento(idDepartamento);
    setSelectedMunicipio('');
    setGeneralData(prev => ({ ...prev, id_comunidad: '' }));

    if (idDepartamento) {
      // Filtrar municipios del departamento seleccionado
      const municipiosFiltrados = allMunicipios.filter(
        m => m.id_departamento === parseInt(idDepartamento)
      );
      setMunicipios(municipiosFiltrados);
    } else {
      setMunicipios([]);
    }
    setComunidades([]);
  };

  const handleMunicipioChange = (e) => {
    const idMunicipio = e.target.value;
    setSelectedMunicipio(idMunicipio);
    setGeneralData(prev => ({ ...prev, id_comunidad: '' }));

    if (idMunicipio) {
      // Filtrar comunidades del municipio seleccionado
      const comunidadesFiltradas = allComunidades.filter(
        c => c.id_municipio === parseInt(idMunicipio)
      );
      setComunidades(comunidadesFiltradas);
    } else {
      setComunidades([]);
    }
  };

  const handleAnswerChange = (pregunta, value, opcion = null) => {
    setAnswers(prev => {
      const currentAnswer = prev[pregunta.id_pregunta] || {};

      // Para OpcionMultiple, manejamos un array de opciones
      if (pregunta.tipo === 'OpcionMultiple' && opcion) {
        const currentOpciones = Array.isArray(currentAnswer.id_opcion) ? currentAnswer.id_opcion : [];
        const currentOpcionesData = currentAnswer.opcionesData || [];

        // Verificar si la opción ya está seleccionada
        const isSelected = currentOpciones.includes(opcion.id_opcion);

        let newOpciones, newOpcionesData;
        if (isSelected) {
          // Remover la opción
          newOpciones = currentOpciones.filter(id => id !== opcion.id_opcion);
          newOpcionesData = currentOpcionesData.filter(opt => opt.id_opcion !== opcion.id_opcion);
        } else {
          // Agregar la opción
          newOpciones = [...currentOpciones, opcion.id_opcion];
          newOpcionesData = [...currentOpcionesData, opcion];
        }

        // Calcular puntos totales
        const totalPuntos = newOpcionesData.reduce((sum, opt) => sum + (opt.puntos || 0), 0);

        return {
          ...prev,
          [pregunta.id_pregunta]: {
            id_pregunta: pregunta.id_pregunta,
            id_opcion: newOpciones,
            opcionesData: newOpcionesData,
            valor_numerico: null,
            valor_texto: null,
            puntos: totalPuntos
          }
        };
      }

      // Para otros tipos de preguntas (OpcionUnica, Numerica, Texto, etc.)
      return {
        ...prev,
        [pregunta.id_pregunta]: {
          id_pregunta: pregunta.id_pregunta,
          id_opcion: opcion ? opcion.id_opcion : null,
          valor_numerico: (pregunta.tipo === 'Numerica' || pregunta.tipo === 'SiNo') ? parseFloat(value) : null,
          valor_texto: (pregunta.tipo === 'Texto' || pregunta.tipo === 'Fecha') ? value : null,
          puntos: opcion ? (opcion.puntos || 0) : 0
        }
      };
    });
  };

  const validateForm = () => {
    // Validar datos generales
    if (!generalData.boleta_num) {
      setError('El número de boleta es requerido');
      return false;
    }
    if (!generalData.id_comunidad) {
      setError('Debe seleccionar una comunidad');
      return false;
    }
    if (!generalData.sexo_encuestador) {
      setError('Debe seleccionar el sexo del encuestador');
      return false;
    }
    if (!generalData.nombre_encuestada || generalData.nombre_encuestada.trim() === '') {
      setError('El nombre de la mujer encuestada es requerido');
      return false;
    }
    if (!generalData.edad_encuestada) {
      setError('La edad de la encuestada es requerida');
      return false;
    }

    // Validar que todas las preguntas requeridas tengan respuesta
    const unansweredRequired = survey.preguntas.filter(pregunta => {
      if (!pregunta.requerida) return false;
      const answer = answers[pregunta.id_pregunta];
      if (!answer) return true;

      // Verificar que tenga alguna respuesta
      // Para OpcionMultiple, verificar que el array tenga al menos un elemento
      if (Array.isArray(answer.id_opcion)) {
        return answer.id_opcion.length === 0;
      }

      return answer.id_opcion === null && answer.valor_numerico === null && !answer.valor_texto;
    });

    if (unansweredRequired.length > 0) {
      setError(`Faltan ${unansweredRequired.length} pregunta(s) requerida(s) por responder`);
      return false;
    }

    return true;
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: '¿Cancelar Encuesta?',
      text: 'Se perderán todos los datos ingresados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, continuar',
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      navigate('/surveyor/list');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Construir el payload según la estructura de la API
      const detalles = [];

      Object.values(answers).forEach(answer => {
        // Para OpcionMultiple, crear un detalle por cada opción seleccionada
        if (Array.isArray(answer.id_opcion) && answer.id_opcion.length > 0) {
          answer.id_opcion.forEach(idOpcion => {
            // Asegurar que idOpcion sea un número válido
            const idOpcionNumerico = parseInt(idOpcion);
            if (!isNaN(idOpcionNumerico)) {
              detalles.push({
                id_pregunta: parseInt(answer.id_pregunta),
                id_opcion: idOpcionNumerico,
                valor_numerico: null,
                valor_texto: null
              });
            }
          });
        }
        // Para otros tipos de preguntas
        // IMPORTANTE: Verificar valor_numerico con typeof para incluir el 0 (No en Si/No)
        else if (answer.id_opcion !== null || typeof answer.valor_numerico === 'number' || answer.valor_texto) {
          const detalle = {
            id_pregunta: parseInt(answer.id_pregunta),
            id_opcion: null,
            valor_numerico: null,
            valor_texto: null
          };

          // Asignar id_opcion solo si es válido y no es un array
          if (!Array.isArray(answer.id_opcion) && answer.id_opcion != null) {
            const idOpcionNumerico = parseInt(answer.id_opcion);
            if (!isNaN(idOpcionNumerico)) {
              detalle.id_opcion = idOpcionNumerico;
            }
          }

          // Asignar valor_numerico solo si es válido (incluyendo 0 para "No")
          if (typeof answer.valor_numerico === 'number' && !isNaN(answer.valor_numerico)) {
            detalle.valor_numerico = answer.valor_numerico;
          }

          // Asignar valor_texto solo si tiene contenido
          if (answer.valor_texto != null && answer.valor_texto !== '') {
            detalle.valor_texto = String(answer.valor_texto);
          }

          detalles.push(detalle);
        }
      });

      const payload = {
        boleta_num: parseInt(generalData.boleta_num),
        id_encuesta: parseInt(surveyId),
        id_comunidad: parseInt(generalData.id_comunidad),
        fecha_entrevista: generalData.fecha_entrevista,
        nombre_encuestada: generalData.nombre_encuestada || null,
        edad_encuestada: generalData.edad_encuestada ? parseInt(generalData.edad_encuestada) : null,
        sexo_encuestador: generalData.sexo_encuestador || null,
        detalles: detalles
      };

      console.log('🚀 Enviando respuesta:', payload);
      console.log('🔍 Total de detalles:', payload.detalles.length);
      console.log('📋 Fecha de entrevista:', payload.fecha_entrevista);
      console.log('👤 Nombre encuestada:', payload.nombre_encuestada);
      console.log('📅 Edad encuestada:', payload.edad_encuestada);
      console.log('⚥ Sexo encuestador:', payload.sexo_encuestador);
      console.log('📋 Detalles completos:', JSON.stringify(payload.detalles, null, 2));

      const response = await createSurveyResponse(payload);
      console.log('✅ Respuesta del servidor:', response.data);

      // Mostrar mensaje de éxito con SweetAlert2
      await Swal.fire({
        icon: 'success',
        title: 'Encuesta Enviada',
        text: 'La encuesta se ha guardado correctamente',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#4F46E5'
      });

      navigate('/surveyor/list');

    } catch (err) {
      console.error('❌ Error al guardar la encuesta:', err);
      console.error('📄 Error completo:', err.response);
      console.error('📋 Datos de error:', err.response?.data);

      let errorMsg = 'Error desconocido';

      if (err.response?.data) {
        // Intentar extraer el mensaje de error del servidor
        errorMsg = err.response.data.message
          || err.response.data.msg
          || err.response.data.error
          || JSON.stringify(err.response.data);
      } else if (err.message) {
        errorMsg = err.message;
      }

      // Mostrar error con SweetAlert2
      await Swal.fire({
        icon: 'error',
        title: 'Error al Guardar',
        html: `
          <p><strong>Error al guardar la encuesta:</strong></p>
          <p>${errorMsg}</p>
          <p class="text-sm text-gray-600 mt-2">Revisa la consola del navegador (F12) para más detalles</p>
        `,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#DC2626'
      });

      setError(`Error al guardar: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderQuestion = (pregunta, index) => {
    const answer = answers[pregunta.id_pregunta] || {};

    return (
      <div key={pregunta.id_pregunta} className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="mb-3">
          <div className="flex items-start justify-between">
            <label className="block text-sm font-medium text-gray-700 flex-1">
              {index + 1}. {pregunta.texto}
              {pregunta.requerida && <span className="text-red-500 ml-1">*</span>}
            </label>
            <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
              pregunta.tipo === 'Texto' ? 'bg-purple-100 text-purple-800' :
              pregunta.tipo === 'OpcionUnica' ? 'bg-green-100 text-green-800' :
              pregunta.tipo === 'OpcionMultiple' ? 'bg-orange-100 text-orange-800' :
              pregunta.tipo === 'Numerica' ? 'bg-blue-100 text-blue-800' :
              pregunta.tipo === 'SiNo' ? 'bg-teal-100 text-teal-800' :
              pregunta.tipo === 'Fecha' ? 'bg-pink-100 text-pink-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {pregunta.tipo === 'OpcionUnica' ? 'Opción Única' :
               pregunta.tipo === 'OpcionMultiple' ? 'Opción Múltiple' :
               pregunta.tipo === 'Numerica' ? 'Numérico' :
               pregunta.tipo === 'SiNo' ? 'Sí/No' :
               pregunta.tipo || 'Otro'}
            </span>
          </div>
        </div>

        {/* Opción Única o Múltiple */}
        {(pregunta.tipo === 'OpcionUnica' || pregunta.tipo === 'OpcionMultiple') && (
          <div className="space-y-2">
            {pregunta.opciones && pregunta.opciones.map(opcion => {
              // Para OpcionMultiple, verificar si está en el array
              const isChecked = pregunta.tipo === 'OpcionMultiple'
                ? (Array.isArray(answer.id_opcion) && answer.id_opcion.includes(opcion.id_opcion))
                : answer.id_opcion === opcion.id_opcion;

              return (
                <label key={opcion.id_opcion} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type={pregunta.tipo === 'OpcionUnica' ? 'radio' : 'checkbox'}
                    name={`pregunta_${pregunta.id_pregunta}`}
                    value={opcion.id_opcion}
                    checked={isChecked}
                    onChange={() => handleAnswerChange(pregunta, opcion.valor, opcion)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-3 text-gray-700">{opcion.etiqueta}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Si/No */}
        {pregunta.tipo === 'SiNo' && (
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="radio"
                name={`pregunta_${pregunta.id_pregunta}`}
                value="si"
                checked={answer.valor_numerico === 1}
                onChange={() => handleAnswerChange(pregunta, 1, { id_opcion: null, puntos: 10 })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-3 text-gray-700">Sí</span>
            </label>
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="radio"
                name={`pregunta_${pregunta.id_pregunta}`}
                value="no"
                checked={answer.valor_numerico === 0}
                onChange={() => handleAnswerChange(pregunta, 0, { id_opcion: null, puntos: 0 })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-3 text-gray-700">No</span>
            </label>
          </div>
        )}

        {/* Numérica */}
        {pregunta.tipo === 'Numerica' && (
          <Input
            type="number"
            value={answer.valor_numerico || ''}
            onChange={(e) => handleAnswerChange(pregunta, e.target.value)}
            placeholder="Ingrese un valor numérico"
          />
        )}

        {/* Texto */}
        {pregunta.tipo === 'Texto' && (
          <textarea
            value={answer.valor_texto || ''}
            onChange={(e) => handleAnswerChange(pregunta, e.target.value)}
            placeholder="Ingrese su respuesta"
            rows="3"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        )}

        {/* Fecha */}
        {pregunta.tipo === 'Fecha' && (
          <Input
            type="date"
            value={answer.valor_texto || ''}
            onChange={(e) => handleAnswerChange(pregunta, e.target.value)}
          />
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Cargando encuesta...</div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          No se pudo cargar la encuesta
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{survey.titulo}</h1>
        {survey.descripcion && (
          <p className="text-gray-600 mt-2">{survey.descripcion}</p>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos Generales */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Datos Generales</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Número de Boleta (Automático)"
              name="boleta_num"
              type="number"
              value={generalData.boleta_num}
              onChange={handleGeneralDataChange}
              required
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />

            <Input
              label="Fecha de Entrevista"
              name="fecha_entrevista"
              type="date"
              value={generalData.fecha_entrevista}
              onChange={handleGeneralDataChange}
              required
            />

            <div className="md:col-span-2">
              <label htmlFor="id_departamento" className="block text-sm font-medium text-gray-700 mb-1">
                Departamento <span className="text-red-500">*</span>
              </label>
              <select
                id="id_departamento"
                value={selectedDepartamento}
                onChange={handleDepartamentoChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Seleccione un departamento...</option>
                {departamentos.map(dep => (
                  <option key={dep.id_departamento} value={dep.id_departamento}>
                    {dep.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="id_municipio" className="block text-sm font-medium text-gray-700 mb-1">
                Municipio <span className="text-red-500">*</span>
              </label>
              <select
                id="id_municipio"
                value={selectedMunicipio}
                onChange={handleMunicipioChange}
                required
                disabled={!selectedDepartamento}
                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  !selectedDepartamento ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">
                  {selectedDepartamento
                    ? 'Seleccione un municipio...'
                    : 'Primero seleccione un departamento'}
                </option>
                {municipios.map(mun => (
                  <option key={mun.id_municipio} value={mun.id_municipio}>
                    {mun.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="id_comunidad" className="block text-sm font-medium text-gray-700 mb-1">
                Comunidad <span className="text-red-500">*</span>
              </label>
              <select
                id="id_comunidad"
                name="id_comunidad"
                value={generalData.id_comunidad}
                onChange={handleGeneralDataChange}
                required
                disabled={!selectedMunicipio}
                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  !selectedMunicipio ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">
                  {selectedMunicipio
                    ? 'Seleccione una comunidad...'
                    : 'Primero seleccione un municipio'}
                </option>
                {comunidades.map(com => (
                  <option key={com.id_comunidad} value={com.id_comunidad}>
                    {com.nombre} ({com.area})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Encuestador (Automático)"
              name="nombre_encuestado"
              value={generalData.nombre_encuestado}
              onChange={handleGeneralDataChange}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />

            <div>
              <label htmlFor="sexo_encuestador" className="block text-sm font-medium text-gray-700 mb-1">
                Sexo del Encuestador <span className="text-red-500">*</span>
              </label>
              <select
                id="sexo_encuestador"
                name="sexo_encuestador"
                value={generalData.sexo_encuestador}
                onChange={handleGeneralDataChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Seleccione el sexo...</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
              </select>
            </div>

            <Input
              label="Nombre de la Mujer Encuestada"
              name="nombre_encuestada"
              value={generalData.nombre_encuestada}
              onChange={handleGeneralDataChange}
              required
            />

            <Input
              label="Edad de la Encuestada"
              name="edad_encuestada"
              type="number"
              value={generalData.edad_encuestada}
              onChange={handleGeneralDataChange}
              required
              min="1"
              max="120"
            />
          </div>
        </div>

        {/* Preguntas agrupadas por categoría */}
        <div className="space-y-6">
          {(() => {
            // Agrupar preguntas por categoría
            const preguntasPorCategoria = {};
            survey.preguntas && survey.preguntas
              .sort((a, b) => a.orden - b.orden)
              .forEach(pregunta => {
                const categoriaNombre = pregunta.categoria_nombre || 'Sin categoría';
                if (!preguntasPorCategoria[categoriaNombre]) {
                  preguntasPorCategoria[categoriaNombre] = [];
                }
                preguntasPorCategoria[categoriaNombre].push(pregunta);
              });

            let globalIndex = 0;

            return Object.entries(preguntasPorCategoria).map(([categoria, preguntas], catIdx) => (
              <div key={catIdx} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header de categoría */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                  <h3 className="text-xl font-bold text-white">
                    {categoria}
                  </h3>
                  <p className="text-indigo-100 text-sm mt-1">
                    {preguntas.length} {preguntas.length === 1 ? 'pregunta' : 'preguntas'}
                  </p>
                </div>

                {/* Preguntas de la categoría */}
                <div className="p-6 space-y-4">
                  {preguntas.map((pregunta) => {
                    const rendered = renderQuestion(pregunta, globalIndex);
                    globalIndex++;
                    return rendered;
                  })}
                </div>
              </div>
            ));
          })()}
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-3 bg-white p-6 rounded-lg shadow-md">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
          >
            {isSaving ? 'Enviando...' : 'Enviar Encuesta'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SurveyFillForm;
