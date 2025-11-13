import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, FileText, RefreshCw, AlertCircle, MapPin } from 'lucide-react';
import TrafficLight, { TrafficLightBadge, getTrafficLightColor } from '../../components/ui/TrafficLight';
import {
  getAllCommunitiesStats,
  getAnalyticsByCommunity,
  getTrafficLightData,
} from '../../api/analytics';

export default function DataAnalytics() {
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityAnalytics, setCommunityAnalytics] = useState(null);
  const [trafficLightData, setTrafficLightData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    if (selectedCommunity) {
      loadCommunityAnalytics();
    }
  }, [selectedCommunity]);

  const loadCommunities = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAllCommunitiesStats();
      const communitiesData = response.data.comunidades;

      setCommunities(communitiesData);

      // Seleccionar la primera comunidad con datos por defecto
      const firstWithData = communitiesData.find((c) => c.total_respuestas > 0);
      if (firstWithData) {
        setSelectedCommunity(firstWithData.id_comunidad);
      } else if (communitiesData.length > 0) {
        setSelectedCommunity(communitiesData[0].id_comunidad);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error cargando comunidades:', err);
      setError('No se pudieron cargar las comunidades');
      setLoading(false);
    }
  };

  const loadCommunityAnalytics = async () => {
    if (!selectedCommunity) return;

    setLoading(true);
    setError(null);

    try {
      const [analyticsRes, trafficLightRes] = await Promise.all([
        getAnalyticsByCommunity(selectedCommunity),
        getTrafficLightData(selectedCommunity),
      ]);

      setCommunityAnalytics(analyticsRes.data);
      setTrafficLightData(trafficLightRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error cargando análisis:', err);
      setError('No se pudo cargar el análisis de la comunidad');
      setLoading(false);
    }
  };

  const COLORS = {
    Verde: '#10B981',
    Amarillo: '#F59E0B',
    Naranja: '#F97316',
    Rojo: '#EF4444',
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Error al cargar datos</h3>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={loadCommunities}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Análisis de Conocimientos</h1>
            <p className="mt-1 text-gray-600">Dashboard con semáforo de conocimientos por comunidad</p>
          </div>
          <button
            onClick={loadCommunities}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Selector de Comunidad */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Seleccionar Comunidad</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {communities.map((community) => (
              <button
                key={community.id_comunidad}
                onClick={() => setSelectedCommunity(community.id_comunidad)}
                className={`rounded-lg border-2 p-4 text-left transition ${
                  selectedCommunity === community.id_comunidad
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{community.comunidad}</h3>
                    <p className="text-sm text-gray-600">
                      {community.municipio}, {community.departamento}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {community.total_respuestas} respuestas
                    </p>
                  </div>
                  {community.promedio_general && (
                    <TrafficLightBadge color={community.color_semaforo} size="lg" />
                  )}
                </div>
                {community.promedio_general && (
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-800">
                      {community.promedio_general}
                    </span>
                    <span className="text-sm text-gray-500">/ 10</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg bg-white py-12 text-center shadow-md">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando datos...</p>
          </div>
        ) : trafficLightData && communityAnalytics ? (
          <>
            {/* Semáforo General */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-6 text-2xl font-semibold text-gray-800">
                Estado General - {trafficLightData.general.comunidad}
              </h2>

              <div className="flex flex-col items-center justify-center gap-8 lg:flex-row">
                <TrafficLight
                  color={trafficLightData.general.color_semaforo}
                  promedio={trafficLightData.general.promedio}
                  label="Promedio General"
                  size="lg"
                />

                <div className="text-center lg:text-left">
                  <p className="text-lg text-gray-700">{trafficLightData.general.descripcion}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Respuestas</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {communityAnalytics.estadisticas.total_respuestas}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Promedio Mínimo</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {communityAnalytics.estadisticas.promedio_minimo}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Promedio Máximo</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {communityAnalytics.estadisticas.promedio_maximo}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Encuestas Activas</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {communityAnalytics.estadisticas.total_encuestas}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficas */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Distribución por Nivel */}
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Distribución por Nivel de Conocimiento
                </h3>
                {communityAnalytics.distribucion.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={communityAnalytics.distribucion}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ categoria, porcentaje }) => `${categoria}: ${porcentaje}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {communityAnalytics.distribucion.map((entry, index) => {
                          const colorMap = {
                            Excelente: COLORS.Verde,
                            Bueno: COLORS.Amarillo,
                            Regular: COLORS.Naranja,
                            'Necesita Mejora': COLORS.Rojo,
                          };
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={colorMap[entry.categoria] || COLORS.Rojo}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-gray-500">
                    No hay datos disponibles
                  </div>
                )}
              </div>

              {/* Promedios por Categoría */}
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Promedios por Categoría
                </h3>
                {communityAnalytics.promedios_por_categoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={communityAnalytics.promedios_por_categoria}
                      layout="horizontal"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 10]} />
                      <YAxis dataKey="categoria" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="promedio_categoria"
                        name="Promedio"
                        fill="#3B82F6"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-gray-500">
                    No hay datos disponibles
                  </div>
                )}
              </div>
            </div>

            {/* Semáforo por Categoría */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-6 text-lg font-semibold text-gray-800">
                Semáforo por Categoría de Conocimiento
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {trafficLightData.por_categoria
                  .sort((a, b) => parseFloat(a.promedio) - parseFloat(b.promedio))
                  .map((cat, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border-2 p-4 ${
                        cat.color_semaforo === 'Verde'
                          ? 'border-green-200 bg-green-50'
                          : cat.color_semaforo === 'Amarillo'
                          ? 'border-yellow-200 bg-yellow-50'
                          : cat.color_semaforo === 'Naranja'
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-800">{cat.categoria}</h4>
                        <TrafficLightBadge color={cat.color_semaforo} size="lg" />
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-800">{cat.promedio}</span>
                        <span className="text-sm text-gray-500">/ 10</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${
                            cat.color_semaforo === 'Verde'
                              ? 'bg-green-500'
                              : cat.color_semaforo === 'Amarillo'
                              ? 'bg-yellow-400'
                              : cat.color_semaforo === 'Naranja'
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${(parseFloat(cat.promedio) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>

              {/* Leyenda del Semáforo */}
              <div className="mt-6 rounded-lg bg-gray-100 p-4">
                <h4 className="mb-3 font-semibold text-gray-700">Leyenda del Semáforo</h4>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-700">8-10: Excelente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-yellow-400" />
                    <span className="text-sm text-gray-700">6-8: Bueno</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-orange-500" />
                    <span className="text-sm text-gray-700">4-6: Regular</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-red-500" />
                    <span className="text-sm text-gray-700">0-4: Necesita Mejora</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg bg-white p-12 text-center shadow-md">
            <FileText className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-700">
              No hay datos disponibles
            </h3>
            <p className="mt-2 text-gray-500">
              Selecciona una comunidad con respuestas para ver el análisis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
