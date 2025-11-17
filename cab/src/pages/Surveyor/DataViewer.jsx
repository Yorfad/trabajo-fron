import { useState, useEffect } from 'react';
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
import { TrendingUp, Users, FileText, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import API from '../../api/axiosInstance';

export default function DataViewer() {
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [filters, setFilters] = useState({
    encuesta: '',
    comunidad: '',
    fechaInicio: '',
    fechaFin: '',
  });
  const [stats, setStats] = useState({
    totalRespuestas: 0,
    totalComunidades: 0,
    totalCategorias: 0,
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
    applyFilters();
  }, [filters, allData]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [comunidadesRes, encuestasRes, respuestasRes] = await Promise.all([
        API.get('/comunidades'),
        API.get('/encuestas'),
        API.get('/respuestas'),
      ]);

      const comunidadesData = comunidadesRes.data;
      setComunidades(comunidadesData);

      const encuestasData = encuestasRes.data;
      setEncuestas(encuestasData);

      const respuestasData = respuestasRes.data;
      setRespuestas(respuestasData);

      // Enriquecer respuestas con información de encuesta y comunidad
      const enrichedData = respuestasData.map((resp) => {
        const encuesta = encuestasData.find((e) => e.id_encuesta === resp.id_encuesta);
        const comunidad = comunidadesData.find((c) => c.id_comunidad === resp.id_comunidad);

        return {
          ...resp,
          encuestaNombre: encuesta?.titulo || `Encuesta ${resp.id_encuesta}`,
          comunidadNombre: comunidad?.comunidad || `Comunidad ${resp.id_comunidad}`,
          departamento: comunidad?.departamento || '',
          municipio: comunidad?.municipio || '',
        };
      });

      setAllData(enrichedData);
      setData(enrichedData);
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


  const applyFilters = () => {
    let filtered = [...allData];

    if (filters.encuesta) {
      filtered = filtered.filter((d) => d.id_encuesta === parseInt(filters.encuesta));
    }

    if (filters.comunidad) {
      filtered = filtered.filter((d) => d.id_comunidad === parseInt(filters.comunidad));
    }

    if (filters.fechaInicio) {
      filtered = filtered.filter((d) => {
        const fecha = d.fecha_aplicada ? d.fecha_aplicada.split('T')[0] : null;
        return fecha && fecha >= filters.fechaInicio;
      });
    }

    if (filters.fechaFin) {
      filtered = filtered.filter((d) => {
        const fecha = d.fecha_aplicada ? d.fecha_aplicada.split('T')[0] : null;
        return fecha && fecha <= filters.fechaFin;
      });
    }

    setData(filtered);
  };

  const calculateStats = () => {
    const comunidadesSet = new Set(data.map((d) => d.id_comunidad).filter(Boolean));
    const encuestasSet = new Set(data.map((d) => d.id_encuesta).filter(Boolean));

    setStats({
      totalRespuestas: data.length,
      totalComunidades: comunidadesSet.size,
      totalCategorias: encuestasSet.size, // Reusing for survey count
    });
  };

  const getEncuestaDistribution = () => {
    const encuestaCount = {};

    data.forEach((item) => {
      const nombre = item.encuestaNombre || 'Sin encuesta';
      encuestaCount[nombre] = (encuestaCount[nombre] || 0) + 1;
    });

    return Object.entries(encuestaCount).map(([name, value]) => ({
      name,
      respuestas: value,
    }));
  };

  const getComunidadData = () => {
    const comunidadCount = {};

    data.forEach((item) => {
      const nombre = item.comunidadNombre || 'Sin comunidad';
      comunidadCount[nombre] = (comunidadCount[nombre] || 0) + 1;
    });

    return Object.entries(comunidadCount).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const chartEncuestaData = getEncuestaDistribution();
  const chartComunidadData = getComunidadData();

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
            onClick={loadData}
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
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Visualización de Datos</h1>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Encuesta</label>
              <select
                value={filters.encuesta}
                onChange={(e) => setFilters((prev) => ({ ...prev, encuesta: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {encuestas.map((e) => (
                  <option key={e.id_encuesta} value={e.id_encuesta}>
                    {e.titulo || e.nombre || `Encuesta ${e.id_encuesta}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Comunidad</label>
              <select
                value={filters.comunidad}
                onChange={(e) => setFilters((prev) => ({ ...prev, comunidad: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {comunidades.map((c) => (
                  <option key={c.id_comunidad} value={c.id_comunidad}>
                    {c.comunidad}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Fecha Inicio</label>
              <input
                type="date"
                value={filters.fechaInicio}
                onChange={(e) => setFilters((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Fecha Fin</label>
              <input
                type="date"
                value={filters.fechaFin}
                onChange={(e) => setFilters((prev) => ({ ...prev, fechaFin: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg bg-white py-12 text-center shadow-md">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando datos...</p>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Respuestas</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalRespuestas}</p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Comunidades</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stats.totalComunidades}
                    </p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Encuestas</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalCategorias}</p>
                  </div>
                  <div className="rounded-full bg-purple-100 p-3">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Respuestas por Encuesta
                </h3>
                {chartEncuestaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartEncuestaData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="respuestas" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Distribución por Comunidad
                </h3>
                {chartComunidadData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartComunidadData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartComunidadData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">Detalle de Respuestas</h3>
              <div className="overflow-x-auto">
                {data.length > 0 ? (
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Boleta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Encuesta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Comunidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Nombre Encuestada
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Edad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Promedio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {data.map((item, idx) => (
                        <tr key={item.id_respuesta || idx} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                            {item.boleta_num}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            {item.encuestaNombre}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            {item.comunidadNombre}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.nombre_encuestada}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            {item.edad_encuestada}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            <span className="font-semibold">{item.promedio_0a10?.toFixed(2) || '-'}</span>
                            <span className="text-xs text-gray-500"> / 10</span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                item.estado === 'Enviada'
                                  ? 'bg-green-100 text-green-800'
                                  : item.estado === 'Anulada'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {item.estado}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {item.fecha_aplicada
                              ? new Date(item.fecha_aplicada).toLocaleDateString()
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-gray-500">
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
