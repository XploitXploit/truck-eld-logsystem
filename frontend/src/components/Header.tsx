import React from 'react';
import { Link } from 'react-router-dom';
import { TruckIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <TruckIcon className="h-8 w-8" />
            <h1 className="text-2xl font-bold">TruckRoute ELD</h1>
          </Link>
          <nav className="flex space-x-4">
            <Link to="/" className="hover:text-blue-200 transition-colors">
              Plan Trip
            </Link>
            <a href="#features" className="hover:text-blue-200 transition-colors">
              Features
            </a>
          </nav>
        </div>
        <p className="text-blue-100 mt-2">
          Professional Route Planning with HOS Compliance & ELD Logging
        </p>
      </div>
    </header>
  );
};

export default Header;