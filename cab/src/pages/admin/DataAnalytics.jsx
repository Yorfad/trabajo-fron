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
    fechaFin: '',
  });
  const [stats, setStats] = useState({
    totalPreguntas: 0,
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
      const uniquePreguntas = [...new Set(allData.map((item) => item.texto).filter(Boolean))];
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
      // Cargar datos en paralelo
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
      } else if (err.request) {
        errorMessage = 'No se pudo conectar con el servidor.';
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  const loadAllQuestions = async (encuestasList) => {
    try {
      const allQuestions = [];

      for (const encuesta of encuestasList) {
        try {
          const response = await API.get(`/preguntas/filter`, {
            params: { id_encuesta: encuesta.id },
          });

          const preguntas = response.data;

          if (preguntas && preguntas.length > 0) {
            const preguntasConEncuesta = preguntas.map((p) => ({
              ...p,
              encuestaId: encuesta.id,
              encuestaNombre: encuesta.titulo || encuesta.nombre || `Encuesta ${encuesta.id}`,
            }));

            allQuestions.push(...preguntasConEncuesta);
          }
        } catch (err) {
          console.error(`❌ Error cargando preguntas de encuesta ${encuesta.id}:`, err.message);
        }
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

    if (filters.encuesta) {
      filtered = filtered.filter((d) => d.encuestaId === parseInt(filters.encuesta));
    }

    if (filters.categoria) {
      filtered = filtered.filter((d) => d.id_categoria === parseInt(filters.categoria));
    }

    if (filters.pregunta) {
      filtered = filtered.filter((d) => d.texto === filters.pregunta);
    }

    setData(filtered);
  };

  const calculateStats = () => {
    const categoriasSet = new Set(data.map((d) => d.id_categoria).filter(Boolean));

    setStats({
      totalPreguntas: data.length,
      totalComunidades: comunidades.length,
      totalCategorias: categoriasSet.size,
    });
  };

  const getChartData = () => {
    const typeCount = {};

    const typeNames = {
      OpcionUnica: 'Opción Única',
      OpcionMultiple: 'Opción Múltiple',
      Numerica: 'Numérica',
      SiNo: 'Sí/No',
      Fecha: 'Fecha',
      Texto: 'Texto',
    };

    data.forEach((item) => {
      const tipo = typeNames[item.tipo] || item.tipo || 'Sin tipo';
      typeCount[tipo] = (typeCount[tipo] || 0) + 1;
    });

    return Object.entries(typeCount).map(([name, value]) => ({
      name,
      preguntas: value,
    }));
  };

  const getCategoryData = () => {
    const categoryCount = {};

    data.forEach((item) => {
      const categoriaId = item.id_categoria;
      const categoriaNombre = categorias[categoriaId - 1] || `Categoría ${categoriaId}`;
      categoryCount[categoriaNombre] = (categoryCount[categoriaNombre] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const getAnswerDistribution = () => {
    // Simulación de distribución de respuestas
    // En producción, esto debería venir de tu API de respuestas
    const answerCount = {
      Excelente: Math.floor(Math.random() * 100) + 50,
      Bueno: Math.floor(Math.random() * 80) + 40,
      Regular: Math.floor(Math.random() * 60) + 30,
      Malo: Math.floor(Math.random() * 40) + 10,
      'Muy Malo': Math.floor(Math.random() * 20) + 5,
    };

    return Object.entries(answerCount).map(([name, value]) => ({
      name,
      respuestas: value,
    }));
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const chartTypeData = getChartData();
  const chartCategoriaData = getCategoryData();
  const chartAnswerData = getAnswerDistribution();

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
          <h1 className="text-3xl font-bold text-gray-800">Analítica de Datos</h1>
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
              <label className="mb-2 block text-sm font-medium text-gray-700">Comunidad</label>
              <select
                value={filters.comunidad}
                onChange={(e) => setFilters((prev) => ({ ...prev, comunidad: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
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
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Preguntas por Tipo</h3>
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
                      <Bar dataKey="respuestas" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">Detalle de Preguntas</h3>
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
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Categoría
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {data.map((item) => {
                        const typeNames = {
                          OpcionUnica: 'Opción Única',
                          OpcionMultiple: 'Opción Múltiple',
                          Numerica: 'Numérica',
                          SiNo: 'Sí/No',
                          Fecha: 'Fecha',
                          Texto: 'Texto',
                        };

                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                              {item.id}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                              {item.encuestaNombre || `#${item.encuestaId}`}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.texto}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                              {typeNames[item.tipo] || item.tipo}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                                {categorias[item.id_categoria - 1] ||
                                  `Categoría ${item.id_categoria}`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
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
