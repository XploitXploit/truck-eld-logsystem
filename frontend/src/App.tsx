import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import TripPlanner from './components/TripPlanner';
import TripResults from './components/TripResults';
import './index.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<TripPlanner />} />
            <Route path="/trip/:tripId" element={<TripResults />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;