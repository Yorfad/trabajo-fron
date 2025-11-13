// /src/components/ui/Input.jsx
import React from "react";

const Input = ({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  name,
  required,
  readOnly,
  min,
  max,
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        required={required}
        readOnly={readOnly}
        min={min}
        max={max}
        className={`w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
      />
    </div>
  );
};

export default Input;
