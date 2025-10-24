import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, FileText, Filter, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'https://cab-project-spwl.onrender.com/api';

export default function DataAnalytics() {
  const [data, setData] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filters, setFilters] = useState({
    comunidad: '',
    categoria: '',
    fechaInicio: '',
    fechaFin: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEncuestas: 0,
    totalComunidades: 0,
    totalCategorias: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [data, filters]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [comunidadesRes, categoriasRes, surveysRes] = await Promise.all([
        fetch(`${API_BASE_URL}/comunidades`),
        fetch(`${API_BASE_URL}/categorias-preguntas`),
        fetch(`${API_BASE_URL}/encuestas`) // Ajusta según tu API
      ]);

      if (!comunidadesRes.ok || !categoriasRes.ok) {
        throw new Error('Error al cargar los datos');
      }

      const comunidadesData = await comunidadesRes.json();
      const categoriasData = await categoriasRes.json();

      setComunidades(comunidadesData);
      
      const categoriasUnicas = [...new Set(categoriasData.map(item => item.categoria))];
      setCategorias(categoriasUnicas);

      if (surveysRes.ok) {
        const surveysData = await surveysRes.json();
        setData(surveysData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('No se pudieron cargar los datos. Por favor, intenta nuevamente.');
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
      filtered = filtered.filter(d => 
        d.comunidad?.toLowerCase() === filters.comunidad.toLowerCase()
      );
    }
    if (filters.categoria) {
      filtered = filtered.filter(d => 
        d.categoria?.toLowerCase() === filters.categoria.toLowerCase()
      );
    }
    if (filters.fechaInicio) {
      filtered = filtered.filter(d => 
        d.fecha && d.fecha >= filters.fechaInicio
      );
    }
    if (filters.fechaFin) {
      filtered = filtered.filter(d => 
        d.fecha && d.fecha <= filters.fechaFin
      );
    }

    return filtered;
  };

  const getChartData = () => {
    const filtered = getFilteredData();
    const comunidadCount = {};
    
    filtered.forEach(item => {
      const comunidad = item.comunidad || 'Sin comunidad';
      comunidadCount[comunidad] = (comunidadCount[comunidad] || 0) + 1;
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
      const categoria = item.categoria || 'Sin categoría';
      categoryCount[categoria] = (categoryCount[categoria] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Error</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={loadInitialData}
            className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Analítica de Datos</h1>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando datos...</p>
          </div>
        ) : (
          <>
            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfica de Barras */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Encuestas por Comunidad</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="encuestas" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfica de Pastel */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Categoría</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabla de Datos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle de Encuestas</h3>
              <div className="overflow-x-auto">
                {getFilteredData().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay datos disponibles con los filtros seleccionados
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comunidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pregunta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredData().map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.comunidad}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.pregunta}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {item.categoria}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.fecha ? new Date(item.fecha).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}