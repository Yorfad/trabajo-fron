import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, FileText, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import API from '../../api/axiosInstance';

export default function DataAnalytics() {
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [filters, setFilters] = useState({
    encuesta: '',
    comunidad: '',
    categoria: '',
    pregunta: '',
    fechaInicio: '',
    fechaFin: ''
  });
  const [stats, setStats] = useState({
    totalPreguntas: 0,
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
      const uniquePreguntas = [...new Set(allData.map(item => item.texto).filter(Boolean))];
      setPreguntas(uniquePreguntas);
    }
  }, [allData]);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters();
  }, [filters, allData]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📄 Iniciando carga de datos...');
      
      // Cargar datos en paralelo
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
        await loadAllQuestions(encuestasData);
      } else {
        console.warn('⚠️ No hay encuestas disponibles');
        setLoading(false);
      }

    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      let errorMessage = 'No se pudieron cargar los datos.';
      if (err.response) {
        errorMessage = `Error ${err.response.status}: ${err.response.data?.message || 'Error del servidor'}`;
        console.error('Response error:', err.response.data);
      } else if (err.request) {
        errorMessage = 'No se pudo conectar con el servidor.';
        console.error('Request error:', err.request);
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  const loadAllQuestions = async (encuestasList) => {
    try {
      console.log('📄 Cargando preguntas de', encuestasList.length, 'encuestas');
      const allQuestions = [];
      
      for (const encuesta of encuestasList) {
        try {
          console.log(`📥 Cargando preguntas de: ${encuesta.titulo || encuesta.nombre} (ID: ${encuesta.id})`);
          const response = await API.get(`/preguntas/filter`, {
            params: { id_encuesta: encuesta.id }
          });
          
          const preguntas = response.data;
          console.log(`✅ Encuesta ${encuesta.id}: ${preguntas.length} preguntas encontradas`);
          
          if (preguntas && preguntas.length > 0) {
            const preguntasConEncuesta = preguntas.map(p => ({
              ...p,
              encuestaId: encuesta.id,
              encuestaNombre: encuesta.titulo || encuesta.nombre || `Encuesta ${encuesta.id}`
            }));
            
            allQuestions.push(...preguntasConEncuesta);
          }
        } catch (err) {
          console.error(`❌ Error cargando preguntas de encuesta ${encuesta.id}:`, err.message);
          if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
          }
        }
      }
      
      console.log('✨ Total de preguntas cargadas:', allQuestions.length);
      if (allQuestions.length > 0) {
        console.log('📊 Muestra de datos:', allQuestions[0]);
      }
      
      setAllData(allQuestions);
      setData(allQuestions);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error general cargando preguntas:', err);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allData];

    console.log('🔍 Aplicando filtros a', filtered.length, 'preguntas');

    if (filters.encuesta) {
      filtered = filtered.filter(d => d.encuestaId === parseInt(filters.encuesta));
      console.log('  - Filtro encuesta:', filters.encuesta, '→', filtered.length, 'resultados');
    }

    if (filters.categoria) {
      filtered = filtered.filter(d => d.id_categoria === parseInt(filters.categoria));
      console.log('  - Filtro categoría:', filters.categoria, '→', filtered.length, 'resultados');
    }

    if (filters.pregunta) {
      filtered = filtered.filter(d => d.texto === filters.pregunta);
      console.log('  - Filtro pregunta:', filters.pregunta, '→', filtered.length, 'resultados');
    }

    console.log('✅ Datos filtrados:', filtered.length);
    setData(filtered);
  };

  const calculateStats = () => {
    const categoriasSet = new Set(data.map(d => d.id_categoria).filter(Boolean));

    setStats({
      totalPreguntas: data.length,
      totalComunidades: comunidades.length,
      totalCategorias: categoriasSet.size
    });
  };

  const getChartData = () => {
    const typeCount = {};
    
    const typeNames = {
      'OpcionUnica': 'Opción Única',
      'OpcionMultiple': 'Opción Múltiple',
      'Numerica': 'Numérica',
      'SiNo': 'Sí/No',
      'Fecha': 'Fecha',
      'Texto': 'Texto'
    };
    
    data.forEach(item => {
      const tipo = typeNames[item.tipo] || item.tipo || 'Sin tipo';
      typeCount[tipo] = (typeCount[tipo] || 0) + 1;
    });

    return Object.entries(typeCount).map(([name, value]) => ({
      name,
      preguntas: value
    }));
  };

  const getCategoryData = () => {
    const categoryCount = {};
    
    data.forEach(item => {
      const categoriaId = item.id_categoria;
      const categoriaNombre = categorias[categoriaId - 1] || `Categoría ${categoriaId}`;
      categoryCount[categoriaNombre] = (categoryCount[categoriaNombre] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const chartTypeData = getChartData();
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
          <h1 className="text-3xl font-bold text-gray-800">Analítica de Datos</h1>
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
                Comunidad
              </label>
              <select
                value={filters.comunidad}
                onChange={(e) => setFilters(prev => ({ ...prev, comunidad: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {comunidades.map((c, idx) => (
                  <option key={idx} value={c.nombre || c}>
                    {c.nombre || c}
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
                    <p className="text-sm font-medium text-gray-600">Total Preguntas</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPreguntas}</p>
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
                  Preguntas por Tipo
                </h3>
                {chartTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="preguntas" fill="#3B82F6" />
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle de Preguntas</h3>
              <div className="overflow-x-auto">
                {data.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Encuesta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pregunta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((item) => {
                        const typeNames = {
                          'OpcionUnica': 'Opción Única',
                          'OpcionMultiple': 'Opción Múltiple',
                          'Numerica': 'Numérica',
                          'SiNo': 'Sí/No',
                          'Fecha': 'Fecha',
                          'Texto': 'Texto'
                        };
                        
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {item.encuestaNombre || `#${item.encuestaId}`}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.texto}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {typeNames[item.tipo] || item.tipo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {categorias[item.id_categoria - 1] || `Categoría ${item.id_categoria}`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
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