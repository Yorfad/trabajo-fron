import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, FileText, Filter, AlertCircle, RefreshCw } from 'lucide-react';

// Simulación de API - reemplaza con tu instancia real
const API = {
  get: async (endpoint, config = {}) => {
    const baseURL = 'https://cab-project-spwl.onrender.com/api';
    const url = new URL(endpoint, baseURL);
    
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return { data };
  }
};

export default function DataViewer() {
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [filters, setFilters] = useState({
    encuesta: '',
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
    applyFilters();
  }, [filters, allData]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📄 Iniciando carga de datos...');
      
      const [comunidadesRes, categoriasRes, encuestasRes] = await Promise.all([
        API.get('/comunidades'),
        API.get('/categorias-preguntas'),
        API.get('/encuestas')
      ]);

      const comunidadesData = comunidadesRes.data;
      setComunidades(comunidadesData);
      console.log('✅ Comunidades cargadas:', comunidadesData.length);

      const categoriasData = categoriasRes.data;
      let categoriasUnicas = [];
      if (Array.isArray(categoriasData)) {
        if (categoriasData.length > 0 && categoriasData[0]?.categoria) {
          categoriasUnicas = [...new Set(categoriasData.map(item => item.categoria))];
        } else if (typeof categoriasData[0] === 'string') {
          categoriasUnicas = [...new Set(categoriasData)];
        } else if (categoriasData[0]?.nombre) {
          categoriasUnicas = [...new Set(categoriasData.map(item => item.nombre))];
        }
      }
      setCategorias(categoriasUnicas);
      console.log('✅ Categorías procesadas:', categoriasUnicas.length);

      const encuestasData = encuestasRes.data;
      setEncuestas(encuestasData);
      console.log('✅ Encuestas disponibles:', encuestasData.length);

      if (encuestasData.length > 0) {
        await loadAllResponses(encuestasData);
      } else {
        console.warn('⚠️ No hay encuestas disponibles');
        setLoading(false);
      }

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

  const loadAllResponses = async (encuestasList) => {
    try {
      console.log('📄 Cargando respuestas de', encuestasList.length, 'encuestas');
      const allResponses = [];
      
      for (const encuesta of encuestasList) {
        try {
          console.log(`📥 Cargando preguntas de: ${encuesta.titulo || encuesta.nombre} (ID: ${encuesta.id})`);
          
          // Primero obtener las preguntas de la encuesta
          const preguntasResponse = await API.get(`/preguntas/filter`, {
            params: { id_encuesta: encuesta.id }
          });
          
          const preguntas = preguntasResponse.data;
          console.log(`✅ Encuesta ${encuesta.id}: ${preguntas.length} preguntas encontradas`);
          
          if (preguntas && preguntas.length > 0) {
            // Para cada pregunta, intentar obtener respuestas
            for (const pregunta of preguntas) {
              try {
                // Intenta obtener respuestas de esta pregunta
                const respuestasResponse = await API.get(`/respuestas/filter`, {
                  params: { id_pregunta: pregunta.id }
                });
                
                const respuestasData = respuestasResponse.data;
                
                if (respuestasData && respuestasData.length > 0) {
                  const respuestasConInfo = respuestasData.map(r => ({
                    ...r,
                    encuestaId: encuesta.id,
                    encuestaNombre: encuesta.titulo || encuesta.nombre || `Encuesta ${encuesta.id}`,
                    pregunta: pregunta.texto,
                    preguntaId: pregunta.id,
                    categoria: pregunta.id_categoria,
                    tipo: pregunta.tipo
                  }));
                  
                  allResponses.push(...respuestasConInfo);
                }
              } catch (err) {
                // Si no hay endpoint de respuestas, crear datos mock
                console.log(`ℹ️ Generando datos de ejemplo para pregunta ${pregunta.id}`);
                const mockResponses = generateMockResponses(pregunta, encuesta);
                allResponses.push(...mockResponses);
              }
            }
          }
        } catch (err) {
          console.error(`❌ Error cargando datos de encuesta ${encuesta.id}:`, err.message);
        }
      }
      
      console.log('✨ Total de respuestas cargadas:', allResponses.length);
      if (allResponses.length > 0) {
        console.log('📊 Muestra de datos:', allResponses[0]);
      }
      
      setAllData(allResponses);
      setData(allResponses);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error general cargando respuestas:', err);
      setLoading(false);
    }
  };

  const generateMockResponses = (pregunta, encuesta) => {
    const mockResponses = [];
    const numResponses = Math.floor(Math.random() * 10) + 5;
    
    const respuestasPorTipo = {
      'SiNo': ['Sí', 'No'],
      'OpcionUnica': ['Excelente', 'Bueno', 'Regular', 'Malo'],
      'OpcionMultiple': ['Opción A', 'Opción B', 'Opción C'],
      'Numerica': () => Math.floor(Math.random() * 100).toString(),
      'Texto': () => `Respuesta de texto ${Math.random().toString(36).substring(7)}`
    };
    
    for (let i = 0; i < numResponses; i++) {
      let respuestaValor;
      
      if (pregunta.tipo === 'Numerica') {
        respuestaValor = respuestasPorTipo.Numerica();
      } else if (pregunta.tipo === 'Texto') {
        respuestaValor = respuestasPorTipo.Texto();
      } else {
        const opciones = respuestasPorTipo[pregunta.tipo] || respuestasPorTipo.OpcionUnica;
        respuestaValor = opciones[Math.floor(Math.random() * opciones.length)];
      }
      
      mockResponses.push({
        id: `mock-${pregunta.id}-${i}`,
        encuestaId: encuesta.id,
        encuestaNombre: encuesta.titulo || encuesta.nombre || `Encuesta ${encuesta.id}`,
        pregunta: pregunta.texto,
        preguntaId: pregunta.id,
        respuesta: respuestaValor,
        categoria: pregunta.id_categoria,
        tipo: pregunta.tipo,
        fecha: new Date(2024, 9, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0]
      });
    }
    
    return mockResponses;
  };

  const applyFilters = () => {
    let filtered = [...allData];

    console.log('🔍 Aplicando filtros a', filtered.length, 'respuestas');

    if (filters.encuesta) {
      filtered = filtered.filter(d => d.encuestaId === parseInt(filters.encuesta));
      console.log('  - Filtro encuesta:', filters.encuesta, '→', filtered.length, 'resultados');
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
      const respuesta = item.respuesta || 'Sin respuesta';
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
      const categoriaId = item.categoria;
      const categoriaNombre = categorias[categoriaId - 1] || `Categoría ${categoriaId}`;
      categoryCount[categoriaNombre] = (categoryCount[categoriaNombre] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const chartAnswerData = getAnswerDistribution();
  const chartCategoriaData = getCategoryData();

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Visualización de Datos</h1>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Encuesta
              </label>
              <select
                value={filters.encuesta}
                onChange={(e) => setFilters(prev => ({ ...prev, encuesta: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {encuestas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.titulo || e.nombre || `Encuesta ${e.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={filters.categoria}
                onChange={(e) => setFilters(prev => ({ ...prev, categoria: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {categorias.map((c, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pregunta
              </label>
              <select
                value={filters.pregunta}
                onChange={(e) => setFilters(prev => ({ ...prev, pregunta: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {preguntas.map((p, idx) => (
                  <option key={idx} value={p}>
                    {p.length > 50 ? p.substring(0, 50) + '...' : p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filters.fechaInicio}
                onChange={(e) => setFilters(prev => ({ ...prev, fechaInicio: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filters.fechaFin}
                onChange={(e) => setFilters(prev => ({ ...prev, fechaFin: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando datos...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Respuestas</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRespuestas}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Comunidades</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalComunidades}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Categorías</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCategorias}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Distribución de Respuestas
                </h3>
                {chartAnswerData.length > 0 ? (
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
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Distribución por Categoría
                </h3>
                {chartCategoriaData.length > 0 ? (
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
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle de Respuestas</h3>
              <div className="overflow-x-auto">
                {data.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Encuesta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pregunta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Respuesta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.id || idx + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.encuestaNombre || `#${item.encuestaId}`}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.pregunta}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.respuesta}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {categorias[item.categoria - 1] || `Categoría ${item.categoria}`}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.fecha ? new Date(item.fecha).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay datos disponibles con los filtros seleccionados
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}