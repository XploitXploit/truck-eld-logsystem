import { ArrowLeftIcon, PrinterIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { tripAPI } from "../services/api";
import type { TripData } from "../types";
import ELDLogGrid from "./ELDLogGrid";
import RouteMap from "./RouteMap";
import TripSummary from "./TripSummary";

const TripResults: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "map" | "logs">("summary");

  useEffect(() => {
    const fetchTripData = async () => {
      if (!tripId) return;

      try {
        const data = await tripAPI.getTrip(parseInt(tripId));
        console.log("Fetched trip data:", data);
        console.log("Summary data:", data.summary);
        setTripData(data);
      } catch (err) {
        setError("Failed to load trip data");
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Trip Planner
        </Link>
      </div>
    );
  }

  if (!tripData) {
    return <div>No trip data found</div>;
  }

  console.log("Rendering trip data:", tripData);
  console.log("Trip summary:", tripData.summary);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Trip Planner
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Trip Results</h1>
          <p className="text-gray-600">
            {tripData.current_location} → {tripData.pickup_location} → {tripData.dropoff_location}
          </p>
        </div>
        <button onClick={handlePrint} className="btn btn-secondary inline-flex items-center">
          <PrinterIcon className="h-4 w-4 mr-2" />
          Print Logs
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: "summary", label: "Trip Summary" },
            { key: "map", label: "Route Map" },
            { key: "logs", label: "ELD Logs" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "summary" | "map" | "logs")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === "summary" && (
          <>
            {!tripData.summary && (
              <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-md mb-4">
                Warning: Trip summary data is missing
              </div>
            )}
            <TripSummary tripData={tripData} />
          </>
        )}
        {activeTab === "map" && <RouteMap tripData={tripData} />}
        {activeTab === "logs" && <ELDLogGrid tripData={tripData} />}
      </div>
    </div>
  );
};

export default TripResults;
