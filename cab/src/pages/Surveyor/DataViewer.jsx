
import { useState, useEffect } from 'react';
import { Filter, Download, RefreshCw } from 'lucide-react';

export default function DataViewer() {
  const [surveys, setSurveys] = useState([]);
  const [filteredSurveys, setFilteredSurveys] = useState([]);
  const [filters, setFilters] = useState({
    comunidad: '',
    pregunta: '',
    categoria: ''
  });
  const [loading, setLoading] = useState(false);

  // Datos de ejemplo - reemplazar con llamada a tu API
  const mockData = [
    { id: 1, comunidad: 'Comunidad A', pregunta: '¿Calidad del servicio?', respuesta: 'Excelente', categoria: 'Satisfacción', fecha: '2024-10-20' },
    { id: 2, comunidad: 'Comunidad B', pregunta: '¿Frecuencia de uso?', respuesta: 'Diario', categoria: 'Uso', fecha: '2024-10-21' },
    { id: 3, comunidad: 'Comunidad A', pregunta: '¿Recomendaría el servicio?', respuesta: 'Sí', categoria: 'Satisfacción', fecha: '2024-10-22' },
    { id: 4, comunidad: 'Comunidad C', pregunta: '¿Calidad del servicio?', respuesta: 'Bueno', categoria: 'Satisfacción', fecha: '2024-10-22' },
  ];

  useEffect(() => {
    loadSurveys();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, surveys]);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      // Aquí iría tu llamada a la API
      // const response = await fetch('/api/surveys');
      // const data = await response.json();
      
      // Simulación con datos mock
      setTimeout(() => {
        setSurveys(mockData);
        setFilteredSurveys(mockData);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error cargando encuestas:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...surveys];

    if (filters.comunidad) {
      filtered = filtered.filter(s => s.comunidad === filters.comunidad);
    }
    if (filters.pregunta) {
      filtered = filtered.filter(s => s.pregunta.toLowerCase().includes(filters.pregunta.toLowerCase()));
    }
    if (filters.categoria) {
      filtered = filtered.filter(s => s.categoria === filters.categoria);
    }

    setFilteredSurveys(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ comunidad: '', pregunta: '', categoria: '' });
  };

  const exportData = () => {
    const csvContent = [
      ['ID', 'Comunidad', 'Pregunta', 'Respuesta', 'Categoría', 'Fecha'],
      ...filteredSurveys.map(s => [s.id, s.comunidad, s.pregunta, s.respuesta, s.categoria, s.fecha])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'encuestas_filtradas.csv';
    a.click();
  };

  const comunidades = [...new Set(surveys.map(s => s.comunidad))];
  const categorias = [...new Set(surveys.map(s => s.categoria))];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Filter className="w-8 h-8 text-blue-600" />
              Visor de Encuestas
            </h1>
            <div className="flex gap-2">
              <button
                onClick={loadSurveys}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comunidad
              </label>
              <select
                value={filters.comunidad}
                onChange={(e) => handleFilterChange('comunidad', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las comunidades</option>
                {comunidades.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pregunta
              </label>
              <input
                type="text"
                value={filters.pregunta}
                onChange={(e) => handleFilterChange('pregunta', e.target.value)}
                placeholder="Buscar pregunta..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={filters.categoria}
                onChange={(e) => handleFilterChange('categoria', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Limpiar filtros
          </button>
        </div>

        {/* Resultados */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Resultados ({filteredSurveys.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Cargando encuestas...</p>
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No se encontraron encuestas con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comunidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pregunta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Respuesta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSurveys.map((survey) => (
                    <tr key={survey.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{survey.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{survey.comunidad}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{survey.pregunta}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{survey.respuesta}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {survey.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{survey.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}