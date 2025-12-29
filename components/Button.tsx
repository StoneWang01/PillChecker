
import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary', className = '', disabled }) => {
  const baseStyles = "flex items-center justify-center gap-2 rounded-2xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 py-6 px-8 text-2xl",
    secondary: "bg-white text-blue-800 border-2 border-blue-600 hover:bg-blue-50 py-4 px-6 text-xl",
    danger: "bg-red-500 text-white hover:bg-red-600 py-4 px-6 text-xl"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
