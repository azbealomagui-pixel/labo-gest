import React from 'react';

const Button = ({ children, onClick, variant = 'primary', type = 'button' }) => {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${variants[variant]} px-4 py-2 rounded-lg font-medium transition-colors`}
    >
      {children}
    </button>
  );
};

export default Button;