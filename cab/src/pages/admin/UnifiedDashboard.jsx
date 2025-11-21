import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  RefreshCw,
  Filter,
  Download,
  Eye,
} from 'lucide-react';
import { TrafficLightBadge } from '../../components/ui/TrafficLight';
import { getFilteredAnalytics } from '../../api/analytics';
import { getComunidades } from '../../api/catalogos';
import { getSurveys } from '../../api/surveys';
import { generateFilteredAnalyticsPDF } from '../../utils/pdfGenerator';
import API from '../../api/axiosInstance';
import { calcularPromedioRespuesta, obtenerColorSemaforo } from '../../utils/calculateAverage';

export default function UnifiedDashboard() {
  const navigate = useNavigate();

  // Estados de estadísticas generales
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalUsuarios: 0,
    encuestasActivas: 0,
    totalRespuestas: 0,
    comunidades: 0,
  });

  // Estados de filtros
  const [comunidades, setComunidades] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [selectedComunidad, setSelectedComunidad] = useState('');
  const [selectedVuelta, setSelectedVuelta] = useState('');
  const [selectedEncuesta, setSelectedEncuesta] = useState('');

  // Estados de datos filtrados
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const [error, setError] = useState(null);

  // Cargar estadísticas generales
  useEffect(() => {
    loadGeneralStats();
    loadCatalogos();
  }, []);

  const loadGeneralStats = async () => {
    setLoading(true);
    try {
      const [usersRes, surveysRes, responsesRes, communitiesRes] = await Promise.all([
        API.get('/usuarios'),
        getSurveys(),
        API.get('/respuestas'),
        API.get('/comunidades'),
      ]);

      const activeSurveys = surveysRes.data.filter((s) => s.estado === 'Activa');

      setStatsData({
        totalUsuarios: usersRes.data.length,
        encuestasActivas: activeSurveys.length,
        totalRespuestas: responsesRes.data.length,
        comunidades: communitiesRes.data.length,
      });
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogos = async () => {
    try {
      const [comunidadesRes, encuestasRes] = await Promise.all([
        getComunidades(),
        getSurveys(),
      ]);
      setComunidades(comunidadesRes.data);
      setEncuestas(encuestasRes.data.filter((e) => e.estado === 'Activa'));
    } catch (err) {
      console.error('Error cargando catálogos:', err);
      setError('Error al cargar catálogos');
    }
  };

  /**
   * Recalcula todos los promedios usando la lógica correcta en el frontend
   * Proceso: Agrupar por pregunta → Sumar puntos → Promediar totales
   */
  const recalcularPromediosCompletos = (data) => {
    if (!data) return data;

    console.log('🔄 Recalculando promedios en frontend...');

    // 1. RECALCULAR RESPUESTAS INDIVIDUALES
    if (data.respuestas && Array.isArray(data.respuestas)) {
      data.respuestas = data.respuestas.map(respuesta => {
        if (!respuesta.detalles || respuesta.detalles.length === 0) {
          return respuesta;
        }

        const promedio = calcularPromedioRespuesta(respuesta.detalles);
        const colorSemaforo = obtenerColorSemaforo(promedio);

        return {
          ...respuesta,
          promedio_respuesta: promedio.toFixed(2),
          color_semaforo: colorSemaforo
        };
      });
    }

    // 2. RECALCULAR SEMÁFORO POR CATEGORÍAS
    if (data.semaforo_categorias && Array.isArray(data.semaforo_categorias)) {
      data.semaforo_categorias = data.semaforo_categorias.map(categoria => {
        // Obtener todas las respuestas de esta categoría
        const detallesCategoria = [];

        if (data.respuestas && Array.isArray(data.respuestas)) {
          data.respuestas.forEach(respuesta => {
            if (respuesta.detalles && Array.isArray(respuesta.detalles)) {
              const detallesCat = respuesta.detalles.filter(d =>
                d.categoria_nombre === categoria.categoria ||
                d.categoria === categoria.categoria
              );
              detallesCategoria.push(...detallesCat);
            }
          });
        }

        const promedio = calcularPromedioRespuesta(detallesCategoria);
        const colorSemaforo = obtenerColorSemaforo(promedio);

        return {
          ...categoria,
          promedio: promedio.toFixed(2),
          color_semaforo: colorSemaforo
        };
      });
    }

    // 3. RECALCULAR SEMÁFORO POR PREGUNTAS
    if (data.semaforo_preguntas && Array.isArray(data.semaforo_preguntas)) {
      data.semaforo_preguntas = data.semaforo_preguntas.map(pregunta => {
        // Calcular el puntaje por usuario para esta pregunta
        const puntajesPorUsuario = [];

        if (data.respuestas && Array.isArray(data.respuestas)) {
          data.respuestas.forEach(respuesta => {
            if (respuesta.detalles && Array.isArray(respuesta.detalles)) {
              // Filtrar detalles de esta pregunta para este usuario
              const detallesPreg = respuesta.detalles.filter(d =>
                d.id_pregunta === pregunta.id_pregunta
              );

              // Sumar los puntajes de esta pregunta (para OpcionMultiple)
              if (detallesPreg.length > 0) {
                const puntajeUsuario = detallesPreg.reduce((sum, d) =>
                  sum + parseFloat(d.puntaje_0a10 || 0), 0
                );
                puntajesPorUsuario.push(puntajeUsuario);
              }
            }
          });
        }

        // Calcular el promedio de los puntajes de todos los usuarios
        const promedio = puntajesPorUsuario.length > 0
          ? puntajesPorUsuario.reduce((sum, p) => sum + p, 0) / puntajesPorUsuario.length
          : 0;

        const colorSemaforo = obtenerColorSemaforo(promedio);

        return {
          ...pregunta,
          promedio: promedio.toFixed(2),
          color_semaforo: colorSemaforo
        };
      });
    }

    console.log('✅ Promedios recalculados correctamente');
    return data;
  };

  const handleApplyFilters = async () => {
    if (!selectedComunidad || !selectedVuelta || !selectedEncuesta) {
      setError('Debe seleccionar comunidad, vuelta y encuesta');
      setAnalyticsData(null);
      return;
    }

    setLoadingFiltered(true);
    setError(null);

    try {
      const res = await getFilteredAnalytics(
        selectedComunidad,
        selectedVuelta,
        selectedEncuesta
      );

      // 🔥 RECALCULAR TODOS LOS PROMEDIOS EN EL FRONTEND
      const datosRecalculados = recalcularPromediosCompletos(res.data);
      setAnalyticsData(datosRecalculados);
    } catch (err) {
      console.error('Error al obtener análisis:', err);
      setError(err.response?.data?.msg || 'Error al cargar datos');
      setAnalyticsData(null);
    } finally {
      setLoadingFiltered(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedComunidad('');
    setSelectedVuelta('');
    setSelectedEncuesta('');
    setAnalyticsData(null);
    setError(null);
  };

  const handleViewResponse = (id) => {
    navigate(`/admin/analytics/response/${id}`);
  };

  const handleDownloadPDF = () => {
    if (analyticsData) {
      generateFilteredAnalyticsPDF(analyticsData);
    }
  };

  // Preparar datos para gráficos
  const getEncuestaDistribution = () => {
    if (!analyticsData?.respuestas) return [];

    const count = {};
    analyticsData.respuestas.forEach((resp) => {
      const nombre = analyticsData.filtros.encuesta;
      count[nombre] = (count[nombre] || 0) + 1;
    });

    return Object.entries(count).map(([name, value]) => ({
      name,
      respuestas: value,
    }));
  };

  const getComunidadData = () => {
    if (!analyticsData?.respuestas) return [];

    const count = {};
    analyticsData.respuestas.forEach(() => {
      const nombre = analyticsData.filtros.comunidad;
      count[nombre] = (count[nombre] || 0) + 1;
    });

    return Object.entries(count).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const stats = [
    {
      label: 'Total Usuarios',
      value: loading ? '...' : statsData.totalUsuarios,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Encuestas Activas',
      value: loading ? '...' : statsData.encuestasActivas,
      icon: FileText,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Respuestas',
      value: loading ? '...' : statsData.totalRespuestas,
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Comunidades',
      value: loading ? '...' : statsData.comunidades,
      icon: BarChart3,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Dashboard CAB</h1>
          <button
            onClick={loadGeneralStats}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 sm:text-base"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Estadísticas Generales */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="rounded-lg bg-white p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.color}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filtros */}
        <div className="mb-4 rounded-lg bg-white p-4 shadow sm:mb-6 sm:p-6">
          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <Filter className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold sm:text-lg">Análisis Filtrado</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
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
                <option value="">-- Seleccionar --</option>
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
                disabled={loadingFiltered}
                className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loadingFiltered ? 'Cargando...' : 'Aplicar'}
              </button>
            </div>

            {/* Botón Limpiar */}
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {/* Resultados Filtrados */}
        {analyticsData && (
          <>
            {/* Info de filtros + botón PDF */}
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Resultados para:
                  </h3>
                  <p className="text-sm text-blue-700">
                    {analyticsData.filtros.comunidad} | Vuelta{' '}
                    {analyticsData.filtros.vuelta} | {analyticsData.filtros.encuesta}
                  </p>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </button>
              </div>
            </div>

            {/* Gráficos de Distribución */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Gráfico de Barras - Distribución por Encuesta */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Respuestas por Encuesta
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getEncuestaDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="respuestas" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico de Pastel - Distribución por Comunidad */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Respuestas por Comunidad
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getComunidadData()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {getComunidadData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
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
            <div className="mb-4 rounded-lg bg-white p-4 shadow sm:mb-6 sm:p-6">
              <h2 className="mb-3 text-lg font-bold text-gray-900 sm:mb-4 sm:text-xl">
                Semáforo por Pregunta
              </h2>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
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
              </div>
            </div>

            {/* Tabla de Respuestas Individuales */}
            <div className="rounded-lg bg-white p-4 shadow sm:p-6">
              <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                  Respuestas Individuales
                </h2>
                <div className="text-sm text-gray-500">
                  Total: {analyticsData.respuestas.length}
                </div>
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
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
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
