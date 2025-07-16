import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-64 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 mb-4 ${sizeClasses[size]}`}></div>
      {message && (
        <p className="text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
};

export default Loading;