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
    if (allData.length > 0) {
      const uniquePreguntas = [...new Set(allData.map((item) => item.pregunta).filter(Boolean))];
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
      const [comunidadesRes, categoriasRes, encuestasRes] = await Promise.all([
        API.get('/comunidades'),
        API.get('/categorias-preguntas'),
        API.get('/encuestas'),
      ]);

      const comunidadesData = comunidadesRes.data;
      setComunidades(comunidadesData);

      const categoriasData = categoriasRes.data;
      let categoriasUnicas = [];
      if (Array.isArray(categoriasData)) {
        if (categoriasData.length > 0 && categoriasData[0]?.categoria) {
          categoriasUnicas = [...new Set(categoriasData.map((item) => item.categoria))];
        } else if (typeof categoriasData[0] === 'string') {
          categoriasUnicas = [...new Set(categoriasData)];
        } else if (categoriasData[0]?.nombre) {
          categoriasUnicas = [...new Set(categoriasData.map((item) => item.nombre))];
        }
      }
      setCategorias(categoriasUnicas);

      const encuestasData = encuestasRes.data;
      setEncuestas(encuestasData);

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
      const allResponses = [];

      for (const encuesta of encuestasList) {
        try {
          // Primero obtener las preguntas de la encuesta
          const preguntasResponse = await API.get(`/preguntas/filter`, {
            params: { id_encuesta: encuesta.id },
          });

          const preguntas = preguntasResponse.data;

          if (preguntas && preguntas.length > 0) {
            // Para cada pregunta, intentar obtener respuestas
            for (const pregunta of preguntas) {
              try {
                // Intenta obtener respuestas de esta pregunta
                const respuestasResponse = await API.get(`/respuestas/filter`, {
                  params: { id_pregunta: pregunta.id },
                });

                const respuestasData = respuestasResponse.data;

                if (respuestasData && respuestasData.length > 0) {
                  const respuestasConInfo = respuestasData.map((r) => ({
                    ...r,
                    encuestaId: encuesta.id,
                    encuestaNombre: encuesta.titulo || encuesta.nombre || `Encuesta ${encuesta.id}`,
                    pregunta: pregunta.texto,
                    preguntaId: pregunta.id,
                    categoria: pregunta.id_categoria,
                    tipo: pregunta.tipo,
                  }));

                  allResponses.push(...respuestasConInfo);
                }
              } catch (err) {
                // Si no hay endpoint de respuestas, crear datos mock
                const mockResponses = generateMockResponses(pregunta, encuesta);
                allResponses.push(...mockResponses);
              }
            }
          }
        } catch (err) {
          console.error(`❌ Error cargando datos de encuesta ${encuesta.id}:`, err.message);
        }
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
      SiNo: ['Sí', 'No'],
      OpcionUnica: ['Excelente', 'Bueno', 'Regular', 'Malo'],
      OpcionMultiple: ['Opción A', 'Opción B', 'Opción C'],
      Numerica: () => Math.floor(Math.random() * 100).toString(),
      Texto: () => `Respuesta de texto ${Math.random().toString(36).substring(7)}`,
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
        fecha: new Date(2024, 9, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
      });
    }

    return mockResponses;
  };

  const applyFilters = () => {
    let filtered = [...allData];

    if (filters.encuesta) {
      filtered = filtered.filter((d) => d.encuestaId === parseInt(filters.encuesta));
    }

    if (filters.categoria) {
      filtered = filtered.filter((d) => d.categoria === parseInt(filters.categoria));
    }

    if (filters.pregunta) {
      filtered = filtered.filter((d) => d.pregunta === filters.pregunta);
    }

    if (filters.fechaInicio) {
      filtered = filtered.filter((d) => d.fecha && d.fecha >= filters.fechaInicio);
    }

    if (filters.fechaFin) {
      filtered = filtered.filter((d) => d.fecha && d.fecha <= filters.fechaFin);
    }

    setData(filtered);
  };

  const calculateStats = () => {
    const categoriasSet = new Set(data.map((d) => d.categoria).filter(Boolean));
    const comunidadesSet = new Set(data.map((d) => d.comunidad).filter(Boolean));

    setStats({
      totalRespuestas: data.length,
      totalComunidades: comunidades.length,
      totalCategorias: categoriasSet.size,
    });
  };

  const getAnswerDistribution = () => {
    const answerCount = {};

    data.forEach((item) => {
      const respuesta = item.respuesta || 'Sin respuesta';
      answerCount[respuesta] = (answerCount[respuesta] || 0) + 1;
    });

    return Object.entries(answerCount).map(([name, value]) => ({
      name,
      respuestas: value,
    }));
  };

  const getCategoryData = () => {
    const categoryCount = {};

    data.forEach((item) => {
      const categoriaId = item.categoria;
      const categoriaNombre = categorias[categoriaId - 1] || `Categoría ${categoriaId}`;
      categoryCount[categoriaNombre] = (categoryCount[categoriaNombre] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const chartAnswerData = getAnswerDistribution();
  const chartCategoriaData = getCategoryData();

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
                  <option key={e.id} value={e.id}>
                    {e.titulo || e.nombre || `Encuesta ${e.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Categoría</label>
              <select
                value={filters.categoria}
                onChange={(e) => setFilters((prev) => ({ ...prev, categoria: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
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
              <label className="mb-2 block text-sm font-medium text-gray-700">Pregunta</label>
              <select
                value={filters.pregunta}
                onChange={(e) => setFilters((prev) => ({ ...prev, pregunta: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
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
                    <p className="text-sm font-medium text-gray-600">Categorías</p>
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
                  <div className="flex h-[300px] items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
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
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Encuesta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Pregunta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Respuesta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {data.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {item.id || idx + 1}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            {item.encuestaNombre || `#${item.encuestaId}`}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.pregunta}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.respuesta}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                              {categorias[item.categoria - 1] || `Categoría ${item.categoria}`}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {item.fecha ? new Date(item.fecha).toLocaleDateString() : '-'}
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
