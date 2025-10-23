// /src/components/ui/Card.jsx
import React from 'react';

const Card = ({ title, children, className = '' }) => {
    return (
        <div className={`bg-white shadow-lg rounded-lg p-6 ${className}`}>
            {title && (
                <h3 className="text-xl font-semibold border-b pb-3 mb-4 text-gray-800">
                    {title}
                </h3>
            )}
            {children}
        </div>
    );
};

export default Card;