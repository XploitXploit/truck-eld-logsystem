import { ClockIcon, MapPinIcon, TruckIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tripAPI } from "../services/api";
import type { TripFormData } from "../types";
import Autocomplete from "./common/Autocomplete";

const TripPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TripFormData>({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    current_cycle_hours: 0,
  });
  const [loading, setLoading] = useState(false);
  const [calculatingTrip, setCalculatingTrip] = useState(false);
  const [calculationStep, setCalculationStep] = useState(0);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "current_cycle_hours" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculatingTrip(true);
    setCalculationStep(1);
    setError("");

    try {
      // Simulate step progression for better UX
      const simulateSteps = async () => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setCalculationStep(2);
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setCalculationStep(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setCalculationStep(4);
      };

      // Start the step simulation
      simulateSteps();

      // Actual API call
      const response = await tripAPI.planTrip(formData);
      navigate(`/trip/${response.trip_id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to plan trip. Please try again.");
    } finally {
      setCalculatingTrip(false);
      setCalculationStep(0);
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

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          {calculatingTrip && (
            <div className="absolute inset-0 bg-white bg-opacity-80 z-10 flex flex-col items-center justify-center rounded-md">
              <svg
                className="animate-spin h-10 w-10 text-blue-600 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <div className="text-lg font-medium text-blue-700">
                {calculationStep === 1 && "Calculating optimal route..."}
                {calculationStep === 2 && "Analyzing HOS compliance..."}
                {calculationStep === 3 && "Planning fuel stops..."}
                {calculationStep === 4 && "Generating ELD logs..."}
              </div>
              <div className="text-sm text-gray-600 mt-2 mb-6">
                This may take a moment to ensure regulatory compliance
              </div>

              {/* Step indicator */}
              <div className="w-64 bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${calculationStep * 25}%` }}
                ></div>
              </div>

              {/* Step labels */}
              <div className="w-64 flex justify-between mt-2 text-xs text-gray-500">
                <div className={calculationStep >= 1 ? "text-blue-600 font-medium" : ""}>Route</div>
                <div className={calculationStep >= 2 ? "text-blue-600 font-medium" : ""}>HOS</div>
                <div className={calculationStep >= 3 ? "text-blue-600 font-medium" : ""}>Stops</div>
                <div className={calculationStep >= 4 ? "text-blue-600 font-medium" : ""}>Logs</div>
              </div>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Current Location</label>
              <Autocomplete
                value={formData.current_location}
                onChange={(value) => setFormData((prev) => ({ ...prev, current_location: value }))}
                onSelect={(value) => setFormData((prev) => ({ ...prev, current_location: value }))}
                placeholder="e.g., Chicago, IL"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Current Cycle Hours Used</label>
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
            <label className="form-label">Pickup Location</label>
            <Autocomplete
              value={formData.pickup_location}
              onChange={(value) => setFormData((prev) => ({ ...prev, pickup_location: value }))}
              onSelect={(value) => setFormData((prev) => ({ ...prev, pickup_location: value }))}
              placeholder="e.g., Detroit, MI"
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label">Dropoff Location</label>
            <Autocomplete
              value={formData.dropoff_location}
              onChange={(value) => setFormData((prev) => ({ ...prev, dropoff_location: value }))}
              onSelect={(value) => setFormData((prev) => ({ ...prev, dropoff_location: value }))}
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
            disabled={calculatingTrip}
            className="btn btn-primary w-full py-3 text-lg relative"
          >
            {calculatingTrip ? (
              <>
                <span className="opacity-0">Plan Trip & Generate ELD Logs</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="animate-spin h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="ml-2">Planning Trip...</span>
                </div>
              </>
            ) : (
              "Plan Trip & Generate ELD Logs"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TripPlanner;
