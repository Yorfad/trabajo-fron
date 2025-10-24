import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, FileText, Filter, AlertCircle, RefreshCw } from 'lucide-react';

const API_BASE_URL = 'https://cab-project-spwl.onrender.com/api';

export default function DataAnalytics() {
  const [data, setData] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [preguntas, setPreguntas] = useState([]); // <-- NUEVO ESTADO
  const [filters, setFilters] = useState({
    comunidad: '',
    categoria: '',
    pregunta: '', // <-- NUEVO FILTRO
    fechaInicio: '',
    fechaFin: ''
  });
  const [stats, setStats] = useState({
    totalEncuestas: 0,
    totalComunidades: 0,
    totalCategorias: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generar datos de ejemplo si no hay endpoint de encuestas
  const generateMockData = (comunidadesData, categoriasData) => {
    const mockData = [];
    const respuestas = ['Excelente', 'Bueno', 'Regular', 'Malo'];
    const preguntas = ['¿Calidad del servicio?', '¿Frecuencia de uso?', '¿Recomendaría?'];
    
    for (let i = 1; i <= 20; i++) {
      const comunidad = comunidadesData[Math.floor(Math.random() * comunidadesData.length)];
      const categoria = categoriasData[Math.floor(Math.random() * categoriasData.length)];
      
      mockData.push({
        id: i,
        comunidad: comunidad.nombre || comunidad,
        pregunta: preguntas[Math.floor(Math.random() * preguntas.length)],
        respuesta: respuestas[Math.floor(Math.random() * respuestas.length)],
        categoria: categoria,
        fecha: new Date(2024, 9, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0]
      });
    }
    
    return mockData;
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [data, filters]);

  // <-- NUEVO USEEFFECT para popular las preguntas -->
  useEffect(() => {
    if (data.length > 0) {
      const uniquePreguntas = [...new Set(data.map(item => item.pregunta).filter(Boolean))];
      setPreguntas(uniquePreguntas);
    }
  }, [data]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Cargar datos en paralelo
      const [comunidadesRes, categoriasRes] = await Promise.all([
        fetch(`${API_BASE_URL}/comunidades`),
        fetch(`${API_BASE_URL}/categorias-preguntas`)
      ]);

      if (!comunidadesRes.ok || !categoriasRes.ok) {
        throw new Error('Error al cargar los datos desde la API');
      }

      const comunidadesData = await comunidadesRes.json();
      const categoriasData = await categoriasRes.json();

      console.log('Datos de categorías recibidos:', categoriasData);

      // Procesar comunidades
      setComunidades(comunidadesData);

      // Extraer categorías únicas
      let categoriasUnicas = [];
      
      if (Array.isArray(categoriasData)) {
        if (categoriasData.length > 0 && categoriasData[0].categoria) {
          categoriasUnicas = [...new Set(categoriasData.map(item => item.categoria))];
        }
        else if (typeof categoriasData[0] === 'string') {
          categoriasUnicas = [...new Set(categoriasData)];
        }
        else if (categoriasData[0].nombre) {
          categoriasUnicas = [...new Set(categoriasData.map(item => item.nombre))];
        }
      }
      
      console.log('Categorías procesadas:', categoriasUnicas);
      setCategorias(categoriasUnicas);

      // Intentar cargar encuestas
      try {
        const surveysRes = await fetch(`${API_BASE_URL}/encuestas`);
        if (surveysRes.ok) {
          const surveysData = await surveysRes.json();
          setData(surveysData);
        } else {
          console.warn('Endpoint /encuestas no disponible, usando datos de ejemplo');
          const mockData = generateMockData(comunidadesData, categoriasUnicas);
          setData(mockData);
        }
        
      } catch {
        console.warn('Error cargando encuestas, usando datos de ejemplo');
        const mockData = generateMockData(comunidadesData, categoriasUnicas);
        setData(mockData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('No se pudieron cargar los datos. Verifica tu conexión.');
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const filtered = getFilteredData();
    const comunidadesSet = new Set(filtered.map(d => d.comunidad));
    const categoriasSet = new Set(filtered.map(d => d.categoria));

    setStats({
      totalEncuestas: filtered.length,
      totalComunidades: comunidadesSet.size,
      totalCategorias: categoriasSet.size
    });
  };

  const getFilteredData = () => {
    let filtered = [...data];

    if (filters.comunidad) {
      filtered = filtered.filter(d => {
        const comunidadNombre = typeof d.comunidad === 'object' ? d.comunidad.nombre : d.comunidad;
        return comunidadNombre === filters.comunidad;
      });
    }
    if (filters.categoria) {
      filtered = filtered.filter(d => d.categoria === filters.categoria);
    }
    // <-- NUEVO FILTRO DE PREGUNTA -->
    if (filters.pregunta) {
      filtered = filtered.filter(d => d.pregunta === filters.pregunta);
    }
    if (filters.fechaInicio) {
      filtered = filtered.filter(d => d.fecha >= filters.fechaInicio);
    }
    if (filters.fechaFin) {
      filtered = filtered.filter(d => d.fecha <= filters.fechaFin);
    }

    return filtered;
  };

  const getChartData = () => {
    const filtered = getFilteredData();
    const comunidadCount = {};
    
    filtered.forEach(item => {
      const comunidadNombre = typeof item.comunidad === 'object' ? item.comunidad.nombre : item.comunidad;
      comunidadCount[comunidadNombre] = (comunidadCount[comunidadNombre] || 0) + 1;
    });

    return Object.entries(comunidadCount).map(([name, value]) => ({
      name,
      encuestas: value
    }));
  };

  const getCategoryData = () => {
    const filtered = getFilteredData();
    const categoryCount = {};
    
    filtered.forEach(item => {
      categoryCount[item.categoria] = (categoryCount[item.categoria] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  // <-- NUEVA FUNCIÓN PARA DATOS DE RESPUESTAS -->
  const getAnswerData = () => {
    // getFilteredData ya habrá filtrado por la pregunta seleccionada
    const filtered = getFilteredData(); 
    const answerCount = {};
    
    filtered.forEach(item => {
      const respuesta = item.respuesta || 'Sin respuesta';
      answerCount[respuesta] = (answerCount[respuesta] || 0) + 1;
    });

    // Formato para BarChart
    const barData = Object.entries(answerCount).map(([name, value]) => ({
      name,
      encuestas: value 
    }));
    
    // Formato para PieChart
    const pieData = Object.entries(answerCount).map(([name, value]) => ({
      name,
      value 
    }));
    
    return { barData, pieData };
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Preparar datos para las gráficas antes del return
  const chartComunidadData = getChartData();
  const chartCategoriaData = getCategoryData();
  
  let chartAnswerBarData = [];
  let chartAnswerPieData = [];
  
  if (filters.pregunta) {
    const { barData, pieData } = getAnswerData();
    chartAnswerBarData = barData;
    chartAnswerPieData = pieData;
  }

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

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>
          </div>
          
          {/* <-- GRID CAMBIADO A 5 COLUMNAS --> */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <option key={idx} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* <-- NUEVO FILTRO DE PREGUNTA --> */}
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
                    {p}
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
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* ... (sin cambios en las tarjetas de estadísticas) ... */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Encuestas</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEncuestas}</p>
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

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfica de Barras (Condicional) */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {filters.pregunta ? `Respuestas: ${filters.pregunta}` : 'Encuestas por Comunidad'}
                </h3>
                {(filters.pregunta ? chartAnswerBarData.length : chartComunidadData.length) > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={filters.pregunta ? chartAnswerBarData : chartComunidadData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="encuestas" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>

              {/* Gráfica de Pastel (Condicional) */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {filters.pregunta ? 'Distribución de Respuestas' : 'Distribución por Categoría'}
                </h3>
                {(filters.pregunta ? chartAnswerPieData.length : chartCategoriaData.length) > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={filters.pregunta ? chartAnswerPieData : chartCategoriaData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(filters.pregunta ? chartAnswerPieData : chartCategoriaData).map((entry, index) => (
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

            {/* Tabla de Datos */}
            {/* ... (sin cambios en la tabla) ... */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle de Encuestas</h3>
              <div className="overflow-x-auto">
                {getFilteredData().length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comunidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pregunta</th>
                        {/* Añadí respuesta para que sea visible */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Respuesta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredData().map((item) => {
                        const comunidadNombre = typeof item.comunidad === 'object' ? item.comunidad.nombre : item.comunidad;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comunidadNombre}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.pregunta}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.respuesta}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {item.categoria}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.fecha ? new Date(item.fecha).toLocaleDateString() : '-'}
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