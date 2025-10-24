import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, FileText, Filter } from 'lucide-react';

export default function DataAnalytics() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    comunidad: '',
    categoria: '',
    fechaInicio: '',
    fechaFin: ''
  });
  const [stats, setStats] = useState({
    totalEncuestas: 0,
    totalComunidades: 0,
    totalCategorias: 0
  });

  // Datos de ejemplo
  const mockData = [
    { id: 1, comunidad: 'Comunidad A', pregunta: '¿Calidad del servicio?', respuesta: 'Excelente', categoria: 'Satisfacción', fecha: '2024-10-20' },
    { id: 2, comunidad: 'Comunidad B', pregunta: '¿Frecuencia de uso?', respuesta: 'Diario', categoria: 'Uso', fecha: '2024-10-21' },
    { id: 3, comunidad: 'Comunidad A', pregunta: '¿Recomendaría?', respuesta: 'Sí', categoria: 'Satisfacción', fecha: '2024-10-22' },
    { id: 4, comunidad: 'Comunidad C', pregunta: '¿Calidad del servicio?', respuesta: 'Bueno', categoria: 'Satisfacción', fecha: '2024-10-22' },
    { id: 5, comunidad: 'Comunidad B', pregunta: '¿Calidad del servicio?', respuesta: 'Regular', categoria: 'Satisfacción', fecha: '2024-10-23' },
    { id: 6, comunidad: 'Comunidad A', pregunta: '¿Frecuencia de uso?', respuesta: 'Semanal', categoria: 'Uso', fecha: '2024-10-23' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [data, filters]);

  const loadData = () => {
    setData(mockData);
  };

  const calculateStats = () => {
    const filtered = getFilteredData();
    const comunidades = new Set(filtered.map(d => d.comunidad));
    const categorias = new Set(filtered.map(d => d.categoria));

    setStats({
      totalEncuestas: filtered.length,
      totalComunidades: comunidades.size,
      totalCategorias: categorias.size
    });
  };

  const getFilteredData = () => {
    let filtered = [...data];

    if (filters.comunidad) {
      filtered = filtered.filter(d => d.comunidad === filters.comunidad);
    }
    if (filters.categoria) {
      filtered = filtered.filter(d => d.categoria === filters.categoria);
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
      comunidadCount[item.comunidad] = (comunidadCount[item.comunidad] || 0) + 1;
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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const comunidades = [...new Set(data.map(d => d.comunidad))];
  const categorias = [...new Set(data.map(d => d.categoria))];

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
                {comunidades.map(c => (
                  <option key={c} value={c}>{c}</option>
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
                {categorias.map(c => (
                  <option key={c} value={c}>{c}</option>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}