import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, FileText, Filter, AlertCircle, RefreshCw } from 'lucide-react';

// Importar la instancia de API configurada
import API from '../../api/axiosInstance';
import { getDepartamentos, getMunicipios } from '../../api/catalogos';

export default function DataViewer() {
  // Estado para navegación
  const [selectedEncuesta, setSelectedEncuesta] = useState(null);
  const [selectedBoleta, setSelectedBoleta] = useState(null);

  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [allMunicipios, setAllMunicipios] = useState([]);
  const [allComunidades, setAllComunidades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [gruposFocales, setGruposFocales] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [filters, setFilters] = useState({
    encuesta: '',
    grupoFocal: '',
    departamento: '',
    municipio: '',
    comunidad: '',
    categoria: '',
    pregunta: '',
    fechaInicio: '',
    fechaFin: ''
  });
  const [stats, setStats] = useState({
    totalRespuestas: 0,
    totalComunidades: 0,
    totalCategorias: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [data]);

  useEffect(() => {
    if (allData.length > 0) {
      const uniquePreguntas = [...new Set(allData.map(item => item.pregunta).filter(Boolean))];
      setPreguntas(uniquePreguntas);
    }
  }, [allData]);

  useEffect(() => {
    if (selectedEncuesta) {
      applyFilters();
    }
  }, [filters, allData, encuestas, selectedEncuesta]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📄 Iniciando carga de datos reales...');

      const [departamentosRes, municipiosRes, comunidadesRes, categoriasRes, gruposFocalesRes, encuestasRes, respuestasRes] = await Promise.all([
        getDepartamentos(),
        getMunicipios(),
        API.get('/comunidades'),
        API.get('/categorias-preguntas'),
        API.get('/grupos-focales'),
        API.get('/encuestas'),
        API.get('/respuestas')
      ]);

      const departamentosData = departamentosRes.data;
      setDepartamentos(departamentosData);
      console.log('✅ Departamentos cargados:', departamentosData.length);

      const municipiosData = municipiosRes.data;
      setAllMunicipios(municipiosData);
      console.log('✅ Municipios cargados:', municipiosData.length);

      const comunidadesData = comunidadesRes.data;
      setAllComunidades(comunidadesData);
      console.log('✅ Comunidades cargadas:', comunidadesData.length);

      const categoriasData = categoriasRes.data;
      // Las categorías vienen con estructura: {id_categoria_pregunta, nombre}
      setCategorias(categoriasData || []);
      console.log('✅ Categorías cargadas:', categoriasData?.length || 0);

      const gruposFocalesData = gruposFocalesRes.data;
      setGruposFocales(gruposFocalesData || []);
      console.log('✅ Grupos focales cargados:', gruposFocalesData?.length || 0);

      const encuestasData = encuestasRes.data;
      setEncuestas(encuestasData || []);
      console.log('✅ Encuestas disponibles:', encuestasData?.length || 0);
      console.log('📊 Lista de encuestas:', encuestasData);

      const respuestasReales = respuestasRes.data || [];
      console.log('✅ Respuestas reales cargadas:', respuestasReales.length);

      if (respuestasReales.length > 0) {
        const primeraRespuesta = respuestasReales[0];
        const camposDisponibles = Object.keys(primeraRespuesta);

        console.log('📊 ===== ANÁLISIS DE CAMPOS DEL BACKEND =====');
        console.log('📊 Total de campos recibidos:', camposDisponibles.length);
        console.log('📊 Lista de campos:', camposDisponibles.join(', '));
        console.log('📊 Primer objeto completo:');
        camposDisponibles.forEach(campo => {
          console.log(`   - ${campo}:`, primeraRespuesta[campo]);
        });

        // Verificar campos de texto específicamente
        console.log('\n🔍 ===== VERIFICACIÓN DE CAMPOS DE TEXTO =====');
        console.log('🔍 ¿Existe campo "valor_texto"?', camposDisponibles.includes('valor_texto'));
        console.log('🔍 ¿Existe campo "valorTexto"?', camposDisponibles.includes('valorTexto'));
        console.log('🔍 ¿Existe campo "texto"?', camposDisponibles.includes('texto'));
        console.log('🔍 ¿Existe campo "respuesta_texto"?', camposDisponibles.includes('respuesta_texto'));

        // Buscar preguntas de tipo "Texto"
        console.log('\n📝 ===== BUSCANDO PREGUNTAS DE TIPO TEXTO =====');
        const preguntasTexto = respuestasReales.filter(r => r.preguntaTipo === 'Texto');
        console.log('📝 Total de respuestas a preguntas de tipo "Texto":', preguntasTexto.length);

        if (preguntasTexto.length > 0) {
          console.log('📝 Ejemplos de preguntas tipo Texto:');
          preguntasTexto.slice(0, 5).forEach((p, idx) => {
            console.log(`   ${idx + 1}. Pregunta ID: ${p.preguntaId}, Pregunta: "${p.pregunta}"`);
            console.log(`      - valor_texto: "${p.valor_texto}"`);
            console.log(`      - respuesta: "${p.respuesta}"`);
          });
        }

        // Buscar específicamente pregunta 11
        console.log('\n🔍 ===== BUSCANDO PREGUNTA ID 11 =====');
        const pregunta11 = respuestasReales.filter(r => r.preguntaId === 11);
        console.log('🔍 Respuestas encontradas para pregunta 11:', pregunta11.length);
        if (pregunta11.length > 0) {
          pregunta11.forEach((p, idx) => {
            console.log(`   Respuesta ${idx + 1}:`);
            console.log(`      - Pregunta: "${p.pregunta}"`);
            console.log(`      - Tipo: ${p.preguntaTipo}`);
            console.log(`      - valor_texto: "${p.valor_texto}"`);
            console.log(`      - respuesta: "${p.respuesta}"`);
            console.log(`      - Boleta: ${p.boleta_num}`);
          });
        }

        // Verificar específicamente respuestas con valor_texto
        const respuestasConTexto = respuestasReales.filter(r => r.valor_texto && r.valor_texto !== '' && r.valor_texto !== null);
        console.log('\n📝 Total respuestas con valor_texto NO NULO:', respuestasConTexto.length);

        if (respuestasConTexto.length === 0) {
          console.warn('\n⚠️ ===== PROBLEMA IDENTIFICADO =====');
          console.warn('⚠️ TODAS las respuestas tienen valor_texto = null');
          console.warn('⚠️ Aunque el backend GUARDA correctamente el texto en la BD');
          console.warn('⚠️ El backend NO lo está DEVOLVIENDO en GET /respuestas');
          console.warn('⚠️ SOLUCIÓN: Revisar la consulta SQL del endpoint GET /respuestas');
        } else {
          console.log('✅ Se encontraron respuestas con texto:', respuestasConTexto.length);
          console.log('✅ Ejemplos:', respuestasConTexto.slice(0, 3));
        }

        // Verificar campos de la persona encuestada
        console.log('\n👤 ===== VERIFICACIÓN DE CAMPOS DE PERSONA ENCUESTADA =====');
        console.log('👤 ¿Existe campo "nombre_encuestada"?', camposDisponibles.includes('nombre_encuestada'));
        console.log('👤 ¿Existe campo "edad_encuestada"?', camposDisponibles.includes('edad_encuestada'));
        console.log('👤 ¿Existe campo "sexo_encuestador"?', camposDisponibles.includes('sexo_encuestador'));

        if (camposDisponibles.includes('nombre_encuestada')) {
          console.log('👤 Valor de nombre_encuestada:', primeraRespuesta.nombre_encuestada);
        }
        if (camposDisponibles.includes('edad_encuestada')) {
          console.log('👤 Valor de edad_encuestada:', primeraRespuesta.edad_encuestada);
        }
        if (camposDisponibles.includes('sexo_encuestador')) {
          console.log('👤 Valor de sexo_encuestador:', primeraRespuesta.sexo_encuestador);
        }

        // Verificar si alguna respuesta tiene estos campos
        const respuestasConDatosEncuestada = respuestasReales.filter(r =>
          r.nombre_encuestada || r.edad_encuestada || r.sexo_encuestador
        );
        console.log('👤 Total respuestas con datos de encuestada:', respuestasConDatosEncuestada.length);
        if (respuestasConDatosEncuestada.length > 0) {
          console.log('👤 Ejemplo de respuesta con datos:', {
            nombre_encuestada: respuestasConDatosEncuestada[0].nombre_encuestada,
            edad_encuestada: respuestasConDatosEncuestada[0].edad_encuestada,
            sexo_encuestador: respuestasConDatosEncuestada[0].sexo_encuestador,
            boleta_num: respuestasConDatosEncuestada[0].boleta_num
          });
        } else {
          console.warn('⚠️ NO se encontraron respuestas con datos de persona encuestada');
          console.warn('⚠️ El backend NO está devolviendo estos campos en GET /respuestas');
          console.warn('⚠️ SOLUCIÓN: Verificar que el backend incluya estos campos en la consulta SQL');
        }
      }

      setAllData(respuestasReales);
      setData(respuestasReales);
      setLoading(false);

    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      let errorMessage = 'No se pudieron cargar los datos.';
      if (err.response) {
        errorMessage = `Error ${err.response.status}: ${err.response.data?.message || 'Error del servidor'}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };


  const handleDepartamentoChange = (value) => {
    setFilters(prev => ({
      ...prev,
      departamento: value,
      municipio: '',
      comunidad: ''
    }));

    if (value) {
      const municipiosFiltrados = allMunicipios.filter(
        m => m.id_departamento === parseInt(value)
      );
      setMunicipios(municipiosFiltrados);
    } else {
      setMunicipios([]);
    }
    setComunidades([]);
  };

  const handleMunicipioChange = (value) => {
    setFilters(prev => ({
      ...prev,
      municipio: value,
      comunidad: ''
    }));

    if (value) {
      const comunidadesFiltradas = allComunidades.filter(
        c => c.id_municipio === parseInt(value)
      );
      setComunidades(comunidadesFiltradas);
    } else {
      setComunidades([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...allData];

    console.log('🔍 Aplicando filtros a', filtered.length, 'respuestas');
    console.log('🔧 Filtros actuales:', filters);

    if (filters.encuesta) {
      const encuestaId = parseInt(filters.encuesta);
      filtered = filtered.filter(d => {
        const match = d.encuestaId === encuestaId;
        if (!match) {
          console.log(`  ❌ Excluyendo respuesta de encuesta ${d.encuestaId}, buscando ${encuestaId}`);
        }
        return match;
      });
      console.log('  - Filtro encuesta:', filters.encuesta, '→', filtered.length, 'resultados');
    }

    if (filters.grupoFocal) {
      // Primero, obtener las encuestas de este grupo focal
      const encuestasDelGrupo = encuestas
        .filter(e => e.id_grupo_focal === parseInt(filters.grupoFocal))
        .map(e => e.id_encuesta);

      filtered = filtered.filter(d => encuestasDelGrupo.includes(d.encuestaId));
      console.log('  - Filtro grupo focal:', filters.grupoFocal, '→', filtered.length, 'resultados');
    }

    if (filters.departamento) {
      // Filtrar por departamento a través de las comunidades
      const comunidadesDelDepto = allComunidades
        .filter(c => {
          const municipio = allMunicipios.find(m => m.id_municipio === c.id_municipio);
          return municipio && municipio.id_departamento === parseInt(filters.departamento);
        })
        .map(c => c.id_comunidad);

      filtered = filtered.filter(d => comunidadesDelDepto.includes(d.comunidadId));
      console.log('  - Filtro departamento:', filters.departamento, '→', filtered.length, 'resultados');
    }

    if (filters.municipio) {
      // Filtrar por municipio a través de las comunidades
      const comunidadesDelMunicipio = allComunidades
        .filter(c => c.id_municipio === parseInt(filters.municipio))
        .map(c => c.id_comunidad);

      filtered = filtered.filter(d => comunidadesDelMunicipio.includes(d.comunidadId));
      console.log('  - Filtro municipio:', filters.municipio, '→', filtered.length, 'resultados');
    }

    if (filters.comunidad) {
      filtered = filtered.filter(d => d.comunidadId === parseInt(filters.comunidad));
      console.log('  - Filtro comunidad:', filters.comunidad, '→', filtered.length, 'resultados');
    }

    if (filters.categoria) {
      filtered = filtered.filter(d => d.categoria === parseInt(filters.categoria));
      console.log('  - Filtro categoría:', filters.categoria, '→', filtered.length, 'resultados');
    }

    if (filters.pregunta) {
      filtered = filtered.filter(d => d.pregunta === filters.pregunta);
      console.log('  - Filtro pregunta:', filters.pregunta, '→', filtered.length, 'resultados');
    }

    if (filters.fechaInicio) {
      filtered = filtered.filter(d => d.fecha && d.fecha >= filters.fechaInicio);
    }

    if (filters.fechaFin) {
      filtered = filtered.filter(d => d.fecha && d.fecha <= filters.fechaFin);
    }

    console.log('✅ Datos filtrados:', filtered.length);
    setData(filtered);
  };

  const calculateStats = () => {
    const categoriasSet = new Set(data.map(d => d.categoria).filter(Boolean));
    const comunidadesSet = new Set(data.map(d => d.comunidad).filter(Boolean));

    setStats({
      totalRespuestas: data.length,
      totalComunidades: comunidades.length,
      totalCategorias: categoriasSet.size
    });
  };

  const getAnswerDistribution = () => {
    const answerCount = {};

    data.forEach(item => {
      // Determinar la respuesta considerando todos los casos
      let respuesta = 'Sin respuesta';

      // Prioridad: valor_texto (para respuestas de tipo texto)
      if (item.valor_texto && String(item.valor_texto).trim() !== '' && item.valor_texto !== 'null') {
        respuesta = item.valor_texto;
      }
      // Luego respuesta (para opciones seleccionadas)
      else if (item.respuesta && String(item.respuesta).trim() !== '' && item.respuesta !== 'null') {
        respuesta = item.respuesta;
      }
      // Si es numérico
      else if (item.valor_numerico !== null && item.valor_numerico !== undefined) {
        respuesta = item.valor_numerico === 1 ? 'Sí' : (item.valor_numerico === 0 ? 'No' : String(item.valor_numerico));
      }

      answerCount[respuesta] = (answerCount[respuesta] || 0) + 1;
    });

    return Object.entries(answerCount).map(([name, value]) => ({
      name,
      respuestas: value
    }));
  };

  const getCategoryData = () => {
    const categoryCount = {};

    data.forEach(item => {
      const categoriaNombre = item.categoriaNombre || `Categoría ${item.categoria}`;
      categoryCount[categoriaNombre] = (categoryCount[categoriaNombre] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getComunidadData = () => {
    const comunidadCount = {};

    data.forEach(item => {
      const comunidadNombre = item.comunidadNombre || 'Sin comunidad';
      comunidadCount[comunidadNombre] = (comunidadCount[comunidadNombre] || 0) + 1;
    });

    return Object.entries(comunidadCount).map(([name, value]) => ({
      name,
      respuestas: value
    }));
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const chartAnswerData = getAnswerDistribution();
  const chartCategoriaData = getCategoryData();
  const chartComunidadData = getComunidadData();

  // Función para obtener estadísticas de cada encuesta
  const getEncuestaStats = (encuestaId) => {
    const respuestasEncuesta = allData.filter(r => r.encuestaId === encuestaId);
    const boletas = new Set(respuestasEncuesta.map(r => r.boleta_num).filter(Boolean));
    const usuarios = new Set(respuestasEncuesta.map(r => r.usuarioId).filter(Boolean));

    return {
      totalRespuestas: respuestasEncuesta.length,
      totalBoletas: boletas.size,
      totalEncuestadores: usuarios.size
    };
  };

  // Función para obtener detalles completos de una boleta específica
  const getBoletaDetails = (boletaNum) => {
    const respuestasBoleta = allData.filter(r => r.boleta_num === boletaNum && r.encuestaId === selectedEncuesta);

    if (respuestasBoleta.length === 0) return null;

    // Obtener información general de la boleta (de cualquier respuesta)
    const primeraRespuesta = respuestasBoleta[0];

    return {
      boleta_num: boletaNum,
      encuestador: primeraRespuesta.usuarioNombre || 'Desconocido',
      nombre_encuestada: primeraRespuesta.nombre_encuestada || 'No especificado',
      edad_encuestada: primeraRespuesta.edad_encuestada || '-',
      sexo_encuestador: primeraRespuesta.sexo_encuestador || '-',
      comunidad: primeraRespuesta.comunidadNombre || 'Sin comunidad',
      departamento: primeraRespuesta.departamentoNombre || '-',
      municipio: primeraRespuesta.municipioNombre || '-',
      fecha: primeraRespuesta.fecha,
      respuestas: respuestasBoleta
    };
  };

  // Renderizar vista de detalle de una boleta individual
  const renderBoletaDetail = () => {
    const boletaDetails = getBoletaDetails(selectedBoleta);
    if (!boletaDetails) return null;

    const encuesta = encuestas.find(e => e.id_encuesta === selectedEncuesta);
    const grupoFocal = gruposFocales.find(gf => gf.id_grupo_focal === encuesta?.id_grupo_focal);

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header con botón de regresar */}
          <div className="mb-6">
            <button
              onClick={() => setSelectedBoleta(null)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a boletas
            </button>
          </div>

          {/* Información de la boleta */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Boleta #{boletaDetails.boleta_num}
                </h1>
                <p className="text-gray-600 mb-6">
                  Encuesta: {encuesta?.titulo || `Encuesta ${selectedEncuesta}`}
                </p>

                {/* Información de la persona encuestada */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Persona Encuestada</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm font-medium text-blue-700">Nombre:</span>
                      <p className="text-base font-semibold text-blue-900">{boletaDetails.nombre_encuestada}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-700">Edad:</span>
                      <p className="text-base font-semibold text-blue-900">{boletaDetails.edad_encuestada} años</p>
                    </div>
                  </div>
                </div>

                {/* Información del encuestador y ubicación */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Encuestador:</span>
                    <p className="text-base font-semibold text-gray-900">{boletaDetails.encuestador}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Sexo del Encuestador:</span>
                    <p className="text-base font-semibold text-gray-900">
                      {boletaDetails.sexo_encuestador === 'F' ? 'Femenino' : boletaDetails.sexo_encuestador === 'M' ? 'Masculino' : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Fecha:</span>
                    <p className="text-base font-semibold text-gray-900">
                      {boletaDetails.fecha ? (() => {
                        const [year, month, day] = boletaDetails.fecha.split('-');
                        return `${day}/${month}/${year}`;
                      })() : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Departamento:</span>
                    <p className="text-base font-semibold text-gray-900">{boletaDetails.departamento}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Municipio:</span>
                    <p className="text-base font-semibold text-gray-900">{boletaDetails.municipio}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Comunidad:</span>
                    <p className="text-base font-semibold text-gray-900">{boletaDetails.comunidad}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Grupo Focal:</span>
                    <p className="text-base font-semibold text-gray-900">{grupoFocal?.nombre || 'General'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Respuestas de la boleta agrupadas por categoría */}
          <div className="space-y-6">
            {(() => {
              // Agrupar respuestas por categoría
              const respuestasPorCategoria = {};
              boletaDetails.respuestas.forEach(respuesta => {
                const categoriaNombre = respuesta.categoriaNombre || 'Sin categoría';
                if (!respuestasPorCategoria[categoriaNombre]) {
                  respuestasPorCategoria[categoriaNombre] = [];
                }
                respuestasPorCategoria[categoriaNombre].push(respuesta);
              });

              return Object.entries(respuestasPorCategoria).map(([categoria, respuestas], catIdx) => (
                <div key={catIdx} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Header de categoría */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <h3 className="text-xl font-bold text-white">
                      {categoria}
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {respuestas.length} {respuestas.length === 1 ? 'pregunta' : 'preguntas'}
                    </p>
                  </div>

                  {/* Preguntas de la categoría */}
                  <div className="p-6 space-y-4">
                    {respuestas.map((respuesta, idx) => (
                      <div key={idx} className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded-r-lg hover:bg-gray-100 transition">
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-900 flex-1">
                            {idx + 1}. {respuesta.pregunta}
                          </p>
                          <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                            respuesta.preguntaTipo === 'Texto' ? 'bg-purple-100 text-purple-800' :
                            respuesta.preguntaTipo === 'OpcionUnica' ? 'bg-green-100 text-green-800' :
                            respuesta.preguntaTipo === 'OpcionMultiple' ? 'bg-orange-100 text-orange-800' :
                            respuesta.preguntaTipo === 'Numerico' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {respuesta.preguntaTipo === 'OpcionUnica' ? 'Opción Única' :
                             respuesta.preguntaTipo === 'OpcionMultiple' ? 'Opción Múltiple' :
                             respuesta.preguntaTipo === 'Numerico' ? 'Numérico' :
                             respuesta.preguntaTipo || 'Otro'}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <span className="text-xs text-gray-500 uppercase font-medium">Respuesta:</span>
                          <p className="text-base text-gray-800 mt-1 font-medium">
                            {(() => {
                              // Prioridad: valor_texto (para respuestas de tipo texto)
                              if (respuesta.valor_texto && String(respuesta.valor_texto).trim() !== '' && respuesta.valor_texto !== 'null') {
                                return respuesta.valor_texto;
                              }
                              // Luego respuesta (para opciones seleccionadas)
                              if (respuesta.respuesta && String(respuesta.respuesta).trim() !== '' && respuesta.respuesta !== 'null') {
                                return respuesta.respuesta;
                              }
                              // Si es numérico
                              if (respuesta.valor_numerico !== null && respuesta.valor_numerico !== undefined) {
                                return respuesta.valor_numerico === 1 ? 'Sí' : (respuesta.valor_numerico === 0 ? 'No' : respuesta.valor_numerico);
                              }
                              return '-';
                            })()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar vista de detalle de una encuesta
  const renderEncuestaDetail = () => {
    const encuesta = encuestas.find(e => e.id_encuesta === selectedEncuesta);
    if (!encuesta) return null;

    const respuestasEncuesta = allData.filter(r => r.encuestaId === selectedEncuesta);
    const grupoFocal = gruposFocales.find(gf => gf.id_grupo_focal === encuesta.id_grupo_focal);

    // Obtener información de boletas
    const boletasMap = {};
    respuestasEncuesta.forEach(r => {
      if (r.boleta_num) {
        if (!boletasMap[r.boleta_num]) {
          boletasMap[r.boleta_num] = {
            boleta_num: r.boleta_num,
            encuestador: r.usuarioNombre || 'Desconocido',
            nombre_encuestada: r.nombre_encuestada || 'No especificado',
            comunidad: r.comunidadNombre || 'Sin comunidad',
            municipio: r.municipioNombre || '-',
            departamento: r.departamentoNombre || '-',
            fecha: r.fecha,
            totalRespuestas: 0
          };
        }
        boletasMap[r.boleta_num].totalRespuestas++;
      }
    });

    const boletas = Object.values(boletasMap);

    // Estadísticas
    const categoriasSet = new Set(respuestasEncuesta.map(r => r.categoria).filter(Boolean));
    const encuestadoresSet = new Set(respuestasEncuesta.map(r => r.usuarioId).filter(Boolean));

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header con botón de regresar */}
          <div className="mb-6">
            <button
              onClick={() => setSelectedEncuesta(null)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a lista de encuestas
            </button>
          </div>

          {/* Información de la encuesta */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {encuesta.titulo || `Encuesta ${encuesta.id_encuesta}`}
                </h1>
                {encuesta.descripcion && (
                  <p className="text-gray-600 mb-4">{encuesta.descripcion}</p>
                )}
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                    {grupoFocal?.nombre || 'General'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Creada el {encuesta.fecha_creacion ? new Date(encuesta.fecha_creacion).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Boletas Completadas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{boletas.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Respuestas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{respuestasEncuesta.length}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Encuestadores</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{encuestadoresSet.size}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categorías</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{categoriasSet.size}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Filter className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Lista de boletas/personas que contestaron */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Boletas Completadas ({boletas.length})
            </h3>
            {boletas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boleta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Persona Encuestada</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Encuestador</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Respuestas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {boletas.map((boleta, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedBoleta(boleta.boleta_num)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{boleta.boleta_num}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-700">
                          {boleta.nombre_encuestada}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {boleta.encuestador}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex flex-col">
                            <span className="font-medium">{boleta.comunidad}</span>
                            <span className="text-xs text-gray-500">{boleta.municipio}, {boleta.departamento}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {boleta.totalRespuestas} respuestas
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {boleta.fecha ? (() => {
                            // Formatear fecha sin conversión de zona horaria
                            const [year, month, day] = boleta.fecha.split('-');
                            return `${day}/${month}/${year}`;
                          })() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBoleta(boleta.boleta_num);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay boletas completadas para esta encuesta</p>
              </div>
            )}
          </div>

          {/* Gráficas de respuestas */}
          {respuestasEncuesta.length > 0 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Distribución de Respuestas
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartAnswerData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="respuestas" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Distribución por Categoría
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartCategoriaData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartCategoriaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla de detalle de respuestas */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle de Respuestas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boleta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comunidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pregunta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Respuesta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {respuestasEncuesta.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{item.boleta_num || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.comunidadNombre || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.pregunta}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {(() => {
                              // Prioridad: valor_texto (para respuestas de tipo texto)
                              if (item.valor_texto && String(item.valor_texto).trim() !== '' && item.valor_texto !== 'null') {
                                return item.valor_texto;
                              }
                              // Luego respuesta (para opciones seleccionadas)
                              if (item.respuesta && String(item.respuesta).trim() !== '' && item.respuesta !== 'null') {
                                return item.respuesta;
                              }
                              // Si es numérico
                              if (item.valor_numerico !== null && item.valor_numerico !== undefined) {
                                return item.valor_numerico === 1 ? 'Sí' : (item.valor_numerico === 0 ? 'No' : item.valor_numerico);
                              }
                              return '-';
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {item.categoriaNombre || `Categoría ${item.categoria}`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Renderizar lista de encuestas
  const renderEncuestasList = () => {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Mis Encuestas</h1>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Cargando encuestas...</p>
            </div>
          ) : encuestas.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay encuestas disponibles</h3>
              <p className="text-gray-500">Aún no se han creado encuestas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {encuestas.map((encuesta) => {
                const stats = getEncuestaStats(encuesta.id_encuesta);
                const grupoFocal = gruposFocales.find(gf => gf.id_grupo_focal === encuesta.id_grupo_focal);

                return (
                  <div
                    key={encuesta.id_encuesta}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                    onClick={() => setSelectedEncuesta(encuesta.id_encuesta)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex-1">
                          {encuesta.titulo || `Encuesta ${encuesta.id_encuesta}`}
                        </h3>
                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {grupoFocal?.nombre || 'General'}
                        </span>
                      </div>

                      {encuesta.descripcion && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {encuesta.descripcion}
                        </p>
                      )}

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Boletas completadas:</span>
                          <span className="font-semibold text-gray-900">{stats.totalBoletas}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total respuestas:</span>
                          <span className="font-semibold text-gray-900">{stats.totalRespuestas}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Encuestadores:</span>
                          <span className="font-semibold text-gray-900">{stats.totalEncuestadores}</span>
                        </div>
                      </div>

                      <button
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Ver detalles
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Error al cargar datos</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Renderizar vista condicional
  if (selectedBoleta) {
    return renderBoletaDetail();
  }

  if (selectedEncuesta) {
    return renderEncuestaDetail();
  }

  return renderEncuestasList();
}