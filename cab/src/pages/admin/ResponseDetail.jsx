import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, MapPin, FileText, Download } from 'lucide-react';
import { TrafficLightBadge } from '../../components/ui/TrafficLight';
import { getResponseDetail } from '../../api/analytics';
import { generateResponseDetailPDF } from '../../utils/pdfGenerator';

export default function ResponseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResponseDetail();
  }, [id]);

  const loadResponseDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getResponseDetail(id);
      setData(res.data);
    } catch (err) {
      console.error('Error al cargar detalle de respuesta:', err);
      setError(err.response?.data?.msg || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (data) {
      generateResponseDetailPDF(data);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-blue-600 hover:underline"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { respuesta, categorias } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header con botones volver y descargar */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </button>
        </div>

        {/* Información General */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Detalle de Respuesta - Boleta #{respuesta.boleta_num}
          </h1>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <FileText className="mt-1 h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Encuesta</div>
                <div className="font-semibold text-gray-900">
                  {respuesta.encuesta}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Comunidad</div>
                <div className="font-semibold text-gray-900">
                  {respuesta.comunidad}, {respuesta.municipio},{' '}
                  {respuesta.departamento}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="mt-1 h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Encuestada</div>
                <div className="font-semibold text-gray-900">
                  {respuesta.nombre_encuestada || 'N/A'}
                  {respuesta.edad_encuestada &&
                    ` (${respuesta.edad_encuestada} años)`}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="mt-1 h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Encuestador</div>
                <div className="font-semibold text-gray-900">
                  {respuesta.nombre_encuestador || respuesta.usuario}
                  {respuesta.sexo_encuestador &&
                    ` (${respuesta.sexo_encuestador})`}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Fecha de aplicación</div>
                <div className="font-semibold text-gray-900">
                  {new Date(respuesta.aplicada_en).toLocaleString('es-GT')}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="mt-1 h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Vuelta</div>
                <div className="font-semibold text-gray-900">
                  Vuelta {respuesta.vuelta}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Respuestas por Categoría */}
        <div className="space-y-6">
          {Object.entries(categorias).map(([categoria, preguntas]) => (
            <div key={categoria} className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                {categoria}
              </h2>
              <div className="space-y-4">
                {preguntas.map((preg) => (
                  <div
                    key={preg.id_pregunta}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {preg.pregunta}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Tipo: {preg.tipo}
                        </div>
                      </div>
                      <TrafficLightBadge color={preg.color_semaforo} />
                    </div>

                    <div className="mt-3 rounded bg-gray-50 p-3">
                      <div className="text-sm text-gray-600">Respuesta:</div>
                      <div className="mt-1 text-lg font-semibold text-gray-900">
                        {preg.valor_texto || preg.valor_numerico || 'N/A'}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          Puntaje: <strong>{preg.puntaje_0a10}</strong>/10
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
