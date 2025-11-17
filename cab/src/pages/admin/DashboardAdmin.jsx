import React, { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, TrendingUp, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../../api/axiosInstance';
import { getAllResponses } from '../../api/responses';
import { getSurveys } from '../../api/surveys';

const DashboardAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalUsuarios: 0,
    encuestasActivas: 0,
    totalRespuestas: 0,
    comunidades: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [usersRes, surveysRes, responsesRes, communitiesRes] = await Promise.all([
        API.get('/usuarios'),
        getSurveys(),
        getAllResponses(),
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

  const quickLinks = [
    { to: '/admin/users', label: 'Gestión de Usuarios' },
    { to: '/admin/surveys', label: 'Gestión de Encuestas' },
    { to: '/admin/analytics', label: 'Análisis de Datos' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard de Administrador</h1>
          <button
            onClick={loadStats}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

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

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                to={link.to}
                className="rounded-lg border-2 border-gray-200 p-4 text-center transition hover:border-blue-500 hover:bg-blue-50"
              >
                <span className="text-lg font-medium text-gray-700">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
