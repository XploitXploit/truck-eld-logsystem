import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TruckIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { tripAPI } from '../services/api';
import type { TripFormData } from '../types';

const TripPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TripFormData>({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_hours: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'current_cycle_hours' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await tripAPI.planTrip(formData);
      navigate(`/trip/${response.trip_id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to plan trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Professional Route Planning with ELD Compliance
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Plan your trip with automatic HOS compliance checking and ELD log generation
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <TruckIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">HOS Compliant</h3>
            <p className="text-gray-600">Automatic 70/8 cycle tracking with violation detection</p>
          </div>
          <div className="card">
            <MapPinIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Smart Routing</h3>
            <p className="text-gray-600">Optimized routes with fuel stops every 1,000 miles</p>
          </div>
          <div className="card">
            <ClockIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">ELD Logs</h3>
            <p className="text-gray-600">Automatic generation of daily log sheets</p>
          </div>
        </div>
      </div>

      {/* Trip Planning Form */}
      <div className="card">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Plan Your Trip</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">
                Current Location
              </label>
              <input
                type="text"
                name="current_location"
                value={formData.current_location}
                onChange={handleInputChange}
                placeholder="e.g., Chicago, IL"
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="form-label">
                Current Cycle Hours Used
              </label>
              <input
                type="number"
                name="current_cycle_hours"
                value={formData.current_cycle_hours}
                onChange={handleInputChange}
                min="0"
                max="70"
                step="0.25"
                placeholder="0"
                className="form-input"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Hours used in current 8-day cycle (0-70)</p>
            </div>
          </div>

          <div>
            <label className="form-label">
              Pickup Location
            </label>
            <input
              type="text"
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleInputChange}
              placeholder="e.g., Detroit, MI"
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label">
              Dropoff Location
            </label>
            <input
              type="text"
              name="dropoff_location"
              value={formData.dropoff_location}
              onChange={handleInputChange}
              placeholder="e.g., Atlanta, GA"
              className="form-input"
              required
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Trip Assumptions:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Property-carrying driver (70 hours/8 days cycle)</li>
              <li>• 1 hour for pickup and 1 hour for delivery</li>
              <li>• Fuel stops required every 1,000 miles (30 minutes each)</li>
              <li>• 30-minute rest break required after 8 hours of driving</li>
              <li>• No adverse driving conditions</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 text-lg"
          >
            {loading ? 'Planning Trip...' : 'Plan Trip & Generate ELD Logs'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TripPlanner;