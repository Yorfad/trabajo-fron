// /src/components/ui/Button.jsx
import React from 'react';

// Mapeo simple de variantes a clases de CSS (debe adaptarlas a su framework)
const variantClasses = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const Button = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  type = 'button',
  loading = false,
  className = '',
}) => {
  const classes = variantClasses[variant] || variantClasses.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`rounded-md px-4 py-2 font-semibold transition duration-150 ease-in-out ${classes} ${className} ${
        disabled || loading ? 'cursor-not-allowed opacity-50' : ''
      }`}
    >
      {loading ? 'Cargando...' : children}
    </button>
  );
};

export default Button;
