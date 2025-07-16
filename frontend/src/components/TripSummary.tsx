import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import React from "react";
import type { TripData } from "../types";

interface TripSummaryProps {
  tripData: TripData;
}

const TripSummary: React.FC<TripSummaryProps> = ({ tripData }) => {
  // Add default values to handle undefined properties
  const { summary = {}, violations = [] } = tripData || {};
  const isCompliant = summary?.compliant ?? true;

  return (
    <div className="space-y-6">
      {/* Compliance Status */}
      <div
        className={`p-6 rounded-lg border ${
          isCompliant ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center">
          {isCompliant ? (
            <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
          ) : (
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
          )}
          <div>
            <h3
              className={`text-xl font-semibold ${isCompliant ? "text-green-900" : "text-red-900"}`}
            >
              {isCompliant ? "HOS Compliant Trip" : "HOS Violations Detected"}
            </h3>
            <p className={`${isCompliant ? "text-green-700" : "text-red-700"}`}>
              {isCompliant
                ? "This trip can be completed within federal HOS regulations"
                : `${violations?.length || 0} violation(s) found in trip plan`}
            </p>
          </div>
        </div>
      </div>

      {/* Trip Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <MapIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Distance</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(tripData?.total_distance || 0)} mi
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Driving Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(summary?.total_driving_time || 0)}h
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <TruckIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Days</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.total_days || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-orange-600 font-bold">⛽</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fuel Stops</p>
              <p className="text-2xl font-bold text-gray-900">
                {tripData?.fuel_stops_required || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Route Details */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Current Location:</span>
            <span className="font-medium">{tripData?.current_location || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pickup Location:</span>
            <span className="font-medium">{tripData?.pickup_location || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Location:</span>
            <span className="font-medium">{tripData?.dropoff_location || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Current Cycle Hours:</span>
            <span className="font-medium">{tripData?.current_cycle_hours || 0}h / 70h</span>
          </div>
        </div>
      </div>

      {/* Violations */}
      {violations?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-red-900 mb-4">HOS Violations</h3>
          <div className="space-y-3">
            {violations.map((violation, index) => (
              <div key={index} className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">{violation.type}</p>
                  <p className="text-red-700 text-sm">{violation.description}</p>
                  <p className="text-gray-500 text-xs">Date: {violation.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HOS Regulations Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">HOS Regulations Applied</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Daily Limits</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• 11 hours maximum driving</li>
              <li>• 14 hours maximum duty window</li>
              <li>• 10 hours minimum off-duty rest</li>
              <li>• 30-minute break after 8 hours driving</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Weekly Limits</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• 70 hours maximum in 8 days</li>
              <li>• 34-hour restart available</li>
              <li>• Property-carrying regulations</li>
              <li>• No adverse driving conditions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripSummary;
