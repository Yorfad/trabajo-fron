import React from 'react';

/**
 * Componente de Semáforo Visual
 * Muestra un indicador de color basado en el nivel de conocimiento
 */
const TrafficLight = ({ color, promedio, label, size = 'md' }) => {
  // Configuración de tamaños
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  // Configuración de colores
  const colors = {
    Verde: {
      active: 'bg-green-500',
      inactive: 'bg-gray-300',
      text: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200'
    },
    Amarillo: {
      active: 'bg-yellow-400',
      inactive: 'bg-gray-300',
      text: 'text-yellow-700',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200'
    },
    Naranja: {
      active: 'bg-orange-500',
      inactive: 'bg-gray-300',
      text: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200'
    },
    Rojo: {
      active: 'bg-red-500',
      inactive: 'bg-gray-300',
      text: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200'
    }
  };

  const currentColor = colors[color] || colors.Rojo;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-4">
      {/* Semáforo visual */}
      <div className={`flex flex-col gap-2 p-3 bg-gray-800 rounded-lg border-2 ${currentColor.border}`}>
        {/* Luz Verde */}
        <div
          className={`${sizeClass} rounded-full ${
            color === 'Verde' ? currentColor.active + ' shadow-lg shadow-green-500/50' : 'bg-gray-600'
          }`}
        />
        {/* Luz Amarilla */}
        <div
          className={`${sizeClass} rounded-full ${
            color === 'Amarillo' ? currentColor.active + ' shadow-lg shadow-yellow-500/50' : 'bg-gray-600'
          }`}
        />
        {/* Luz Naranja */}
        <div
          className={`${sizeClass} rounded-full ${
            color === 'Naranja' ? currentColor.active + ' shadow-lg shadow-orange-500/50' : 'bg-gray-600'
          }`}
        />
        {/* Luz Roja */}
        <div
          className={`${sizeClass} rounded-full ${
            color === 'Rojo' ? currentColor.active + ' shadow-lg shadow-red-500/50' : 'bg-gray-600'
          }`}
        />
      </div>

      {/* Información */}
      {(label || promedio !== undefined) && (
        <div className={`flex flex-col p-4 rounded-lg border-2 ${currentColor.bg} ${currentColor.border}`}>
          {label && (
            <span className="font-semibold text-gray-700 text-sm mb-1">
              {label}
            </span>
          )}
          {promedio !== undefined && (
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${currentColor.text}`}>
                {promedio}
              </span>
              <span className="text-gray-500 text-sm">/ 10</span>
            </div>
          )}
          <div className={`mt-2 text-xs font-medium ${currentColor.text}`}>
            {color === 'Verde' && '✓ Excelente conocimiento'}
            {color === 'Amarillo' && '⚠ Buen conocimiento'}
            {color === 'Naranja' && '⚠ Conocimiento regular'}
            {color === 'Rojo' && '✗ Necesita mejoras urgentes'}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Componente de Semáforo Compacto (solo el círculo de color)
 */
export const TrafficLightBadge = ({ color, size = 'md' }) => {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const colors = {
    Verde: 'bg-green-500',
    Amarillo: 'bg-yellow-400',
    Naranja: 'bg-orange-500',
    Rojo: 'bg-red-500'
  };

  const sizeClass = sizes[size] || sizes.md;
  const colorClass = colors[color] || colors.Rojo;

  return (
    <div className={`${sizeClass} ${colorClass} rounded-full shadow-md`} title={color} />
  );
};

/**
 * Función helper para determinar el color del semáforo basado en el promedio
 * @param {number} promedio - Promedio en escala 0-10
 * @returns {string} - Color del semáforo (Verde, Amarillo, Naranja, Rojo)
 */
export const getTrafficLightColor = (promedio) => {
  if (promedio >= 8) return 'Verde';
  if (promedio >= 6) return 'Amarillo';
  if (promedio >= 4) return 'Naranja';
  return 'Rojo';
};

export default TrafficLight;
