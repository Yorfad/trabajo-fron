import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Download, Eye, FileText, TrendingUp } from 'lucide-react';
import { TrafficLightBadge, getTrafficLightColor } from '../../components/ui/TrafficLight';
import { getFilteredAnalytics } from '../../api/analytics';
import { getComunidades } from '../../api/catalogos';
import { getSurveys } from '../../api/surveys';
import { generateFilteredAnalyticsPDF } from '../../utils/pdfGenerator';

export default function FilteredAnalytics() {
  const navigate = useNavigate();

  // Estados de filtros
  const [comunidades, setComunidades] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [selectedComunidad, setSelectedComunidad] = useState('');
  const [selectedVuelta, setSelectedVuelta] = useState('1');
  const [selectedEncuesta, setSelectedEncuesta] = useState('');

  // Estados de datos
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar catálogos
  useEffect(() => {
    loadCatalogos();
  }, []);

  const loadCatalogos = async () => {
    try {
      const [comunidadesRes, encuestasRes] = await Promise.all([
        getComunidades(),
        getSurveys()
      ]);
      setComunidades(comunidadesRes.data);
      // Filtrar solo encuestas activas
      setEncuestas(encuestasRes.data.filter(e => e.estado === 'Activa'));
    } catch (err) {
      console.error('Error cargando catálogos:', err);
      setError('Error al cargar catálogos');
    }
  };

  const handleApplyFilters = async () => {
    if (!selectedComunidad || !selectedVuelta || !selectedEncuesta) {
      setError('Debe seleccionar comunidad, vuelta y encuesta');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await getFilteredAnalytics(
        selectedComunidad,
        selectedVuelta,
        selectedEncuesta
      );
      setAnalyticsData(res.data);
    } catch (err) {
      console.error('Error al obtener análisis:', err);
      setError(err.response?.data?.msg || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResponse = (id) => {
    navigate(`/admin/analytics/response/${id}`);
  };

  const handleDownloadPDF = () => {
    if (analyticsData) {
      generateFilteredAnalyticsPDF(analyticsData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Análisis Filtrado</h1>
          <p className="mt-2 text-gray-600">
            Filtra por comunidad, vuelta y encuesta para ver resultados detallados
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Comunidad */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Comunidad
              </label>
              <select
                value={selectedComunidad}
                onChange={(e) => setSelectedComunidad(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Seleccionar --</option>
                {comunidades.map((c) => (
                  <option key={c.id_comunidad} value={c.id_comunidad}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Vuelta */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Vuelta
              </label>
              <select
                value={selectedVuelta}
                onChange={(e) => setSelectedVuelta(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="1">Vuelta 1</option>
                <option value="2">Vuelta 2</option>
                <option value="3">Vuelta 3</option>
                <option value="4">Vuelta 4</option>
                <option value="5">Vuelta 5</option>
              </select>
            </div>

            {/* Encuesta */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Encuesta
              </label>
              <select
                value={selectedEncuesta}
                onChange={(e) => setSelectedEncuesta(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Seleccionar --</option>
                {encuestas.map((e) => (
                  <option key={e.id_encuesta} value={e.id_encuesta}>
                    {e.titulo}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Aplicar */}
            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                disabled={loading}
                className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Cargando...' : 'Aplicar Filtros'}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Resultados */}
        {analyticsData && (
          <>
            {/* Información de filtros aplicados */}
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Filtros aplicados:
                  </h3>
                  <p className="text-sm text-blue-700">
                    Comunidad: {analyticsData.filtros.comunidad} | Vuelta:{' '}
                    {analyticsData.filtros.vuelta} | Encuesta:{' '}
                    {analyticsData.filtros.encuesta}
                  </p>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </button>
              </div>
            </div>

            {/* Semáforo por Categoría */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Semáforo por Categoría
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {analyticsData.semaforo_categorias.map((cat, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-700">
                        {cat.categoria}
                      </h3>
                      <TrafficLightBadge color={cat.color_semaforo} />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">
                      {cat.promedio}
                    </div>
                    <div className="text-xs text-gray-500">
                      {cat.total_respuestas} respuestas
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Semáforo por Pregunta */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Semáforo por Pregunta
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Pregunta
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Categoría
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Promedio
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Semáforo
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Respuestas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {analyticsData.semaforo_preguntas.map((preg, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {preg.pregunta}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {preg.categoria}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">
                          {preg.tipo}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold">
                          {preg.promedio}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <TrafficLightBadge color={preg.color_semaforo} />
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">
                          {preg.total_respuestas}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lista de Respuestas */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Respuestas Individuales
                </h2>
                <div className="text-sm text-gray-500">
                  Total: {analyticsData.respuestas.length}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Boleta
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Encuestada
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Edad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Encuestador
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Promedio
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Semáforo
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {analyticsData.respuestas.map((resp) => (
                      <tr key={resp.id_respuesta} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {resp.boleta_num}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {resp.nombre_encuestada || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {resp.edad_encuestada || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {resp.nombre_encuestador}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(resp.aplicada_en).toLocaleDateString('es-GT')}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold">
                          {resp.promedio_respuesta}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <TrafficLightBadge color={resp.color_semaforo} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleViewResponse(resp.id_respuesta)}
                            className="inline-flex items-center gap-1 rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200"
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </button>
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
}
