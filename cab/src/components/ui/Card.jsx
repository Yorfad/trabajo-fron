// /src/components/ui/Card.jsx
import React from 'react';

const Card = ({ title, children, className = '' }) => {
  return (
    <div className={`rounded-lg bg-white p-6 shadow-lg ${className}`}>
      {title && <h3 className="mb-4 border-b pb-3 text-xl font-semibold text-gray-800">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
