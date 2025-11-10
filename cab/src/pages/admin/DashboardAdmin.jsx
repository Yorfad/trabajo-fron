import React from 'react';
import { BarChart3, Users, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardAdmin = () => {
  const stats = [
    { label: 'Total Usuarios', value: '-', icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Encuestas Activas', value: '-', icon: FileText, color: 'bg-green-100 text-green-600' },
    { label: 'Respuestas', value: '-', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
    { label: 'Análisis', value: '-', icon: BarChart3, color: 'bg-orange-100 text-orange-600' },
  ];

  const quickLinks = [
    { to: '/admin/users', label: 'Gestión de Usuarios' },
    { to: '/admin/surveys', label: 'Gestión de Encuestas' },
    { to: '/admin/analytics', label: 'Análisis de Datos' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-800">Dashboard de Administrador</h1>

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
