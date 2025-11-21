import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, AlertCircle, LogIn } from 'lucide-react';
import { commonStyles } from '../../config/theme';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const role = await login({ username, password });

      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/surveyor/list', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Error de inicio de sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Card principal */}
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-lg">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Sistema CAB
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitoreo Comunitario de Acciones en Balance
          </p>
        </div>

        {/* Formulario */}
        <div className="rounded-2xl bg-white px-8 py-10 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold text-gray-800">
            Iniciar Sesión
          </h2>

          {/* Error message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  Error de autenticación
                </p>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo usuario */}
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-gray-700">
                Usuario
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Campo contraseña */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`${commonStyles.button.base} ${commonStyles.button.primary} ${commonStyles.button.sizes.lg} w-full mt-6 shadow-md hover:shadow-lg`}
            >
              {isLoading ? (
                <>
                  <svg className="mr-2 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Info de prueba */}
          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <p className="mb-2 text-xs font-semibold text-blue-900">
              Credenciales de prueba:
            </p>
            <div className="space-y-1 text-xs text-blue-700">
              <p>
                <span className="font-medium">Administrador:</span> admin / 123
              </p>
              <p>
                <span className="font-medium">Encuestador:</span> surveyor / 123
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500">
          © 2025 Sistema CAB. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;
