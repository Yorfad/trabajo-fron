// /src/components/ui/Input.jsx
import React from 'react';

// 1. Añade 'name' y 'required' a la lista de props
const Input = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  name,
  required,
  ...props
}) => {
  // Clase para eliminar las flechas de los inputs numéricos
  const numberInputClass = type === 'number'
    ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
    : '';

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        // 2. Pasa las nuevas props 'name' y 'required' al input
        name={name}
        required={required}
        className={`w-full rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500 ${numberInputClass}`}
        {...props}
      />
    </div>
  );
};

export default Input;
