import { ArrowLeftIcon, PrinterIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useRef, useState } from "react";
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
  const [mapKey, setMapKey] = useState<number>(0);
  const [printMode, setPrintMode] = useState<"active" | "all">("active");

  const summaryRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTripData = async () => {
      if (!tripId) return;

      try {
        const data = await tripAPI.getTrip(parseInt(tripId));
        setTripData(data);
      } catch (err) {
        setError("Failed to load trip data");
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId]);

  // Handle printing
  const handlePrint = (mode: "active" | "all") => {
    setPrintMode(mode);

    // Create optimized print styles
    const style = document.createElement("style");
    style.textContent = `
      @page {
        margin: 0.3cm !important;
      }

      @media print {
        body, html {
          width: 100vw !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
        }

        .max-w-7xl {
          max-width: none !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .trip-content {
          width: 100% !important;
          padding: 0 !important;
        }

        .eld-logs-print {
          width: 100vw !important;
          max-width: none !important;
          transform: scale(1) !important;
          transform-origin: top left !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `;

    document.head.appendChild(style);

    setTimeout(() => {
      window.print();
      document.head.removeChild(style);
    }, 100);
  };

  // Main print function
  const printActiveTab = () => {
    // For ELD logs, force landscape orientation
    if (activeTab === "logs") {
      const style = document.createElement("style");
      style.textContent = `
        @page {
          size: A4 landscape !important;
          margin: 0.5cm !important;
        }
  
        @media print {
          body, html {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden !important;
          }
  
          .max-w-7xl, .trip-container, .eld-logs-print {
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
  
          .print-page, .card, .border-2, .border-black {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
          }
  
          .grid-cols-25 {
            width: 100% !important;
            max-width: none !important;
            grid-template-columns: 100px repeat(24, 1fr) !important;
          }
        }
      `;

      document.head.appendChild(style);

      setTimeout(() => {
        window.print();
        document.head.removeChild(style);
      }, 200);
    } else {
      // For other tabs, use default orientation with optimized styles
      const style = document.createElement("style");
      style.textContent = `
        @media print {
          body, html {
            width: 100vw !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }

          .max-w-7xl {
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .trip-content {
            width: 100% !important;
            padding: 0 !important;
          }

          .print-container {
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `;

      document.head.appendChild(style);

      setTimeout(() => {
        window.print();
        document.head.removeChild(style);
      }, 100);
    }
  };

  // Print all function
  const printAllTabs = () => {
    handlePrint("all");
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

  return (
    <div className="max-w-7xl mx-auto trip-container print:max-w-none print:w-full print:mx-0">
      <style jsx>{`
        @media print {
          .trip-container {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden !important;
          }

          .print-title {
            font-size: 18pt !important;
            margin-bottom: 0.3cm !important;
          }

          .print-compact {
            padding: 0.2cm !important;
            margin: 0 !important;
          }

          .eld-logs-print {
            width: 100vw !important;
            max-width: none !important;
            transform: scale(1) !important;
            transform-origin: top left !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          @page {
            size: landscape !important;
            margin: 0.2cm !important;
          }
        }
      `}</style>
      {/* Header - will be hidden in print */}
      <div className="flex justify-between items-center mb-6 no-print">
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
        <div className="flex space-x-2">
          <button 
            onClick={printActiveTab}
            disabled={activeTab === "map"}
            className={`btn ${activeTab === "map" ? "btn-disabled opacity-50 cursor-not-allallowed" : "btn-secondary"} inline-flex items-center`}>
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print Current Tab
          </button>
          <button onClick={printAllTabs} className="btn btn-outline inline-flex items-center">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print All
          </button>
        </div>
      </div>

      {/* Print Title - only visible when printing */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold text-center print-title">
          Trip Plan: {tripData.current_location} → {tripData.pickup_location} →{" "}
          {tripData.dropoff_location}
        </h1>
      </div>

      {/* Navigation Tabs - hidden in print */}
      <div className="border-b border-gray-200 mb-6 no-print">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: "summary", label: "Trip Summary" },
            { key: "map", label: "Route Map" },
            { key: "logs", label: "ELD Logs" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === "map") {
                  setMapKey((prev) => prev + 1);
                }
                setActiveTab(tab.key as "summary" | "map" | "logs");
              }}
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

      {/* Tab Content for Screen View - hidden in print if printing all */}
      <div className={`mb-8 trip-content ${printMode === "all" ? "print:hidden" : ""}`}>
        {activeTab === "summary" && (
          <div ref={summaryRef} className="trip-summary-print print-compact">
            {!tripData.summary && (
              <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-md mb-4 print-compact">
                Warning: Trip summary data is missing
              </div>
            )}
            <TripSummary tripData={tripData} />
          </div>
        )}
        {activeTab === "map" && (
          <div ref={mapRef} className="route-map-print print-compact" key={`map-tab-${mapKey}`}>
            <RouteMap tripData={tripData} />
          </div>
        )}
        {activeTab === "logs" && (
          <div ref={logsRef} className="eld-logs-print print-compact" style={{ width: "100%" }}>
            <div style={{ width: "100%", overflowX: "hidden" }}>
              <ELDLogGrid tripData={tripData} />
            </div>
          </div>
        )}
      </div>

      {/* All Content for Print Mode - only visible when printing all */}
      <div className="hidden print:block">
        {printMode === "all" && (
          <>
            <div className="trip-summary-print avoid-break print-compact">
              <h2 className="text-xl font-bold border-b pb-2 mb-2">Trip Summary</h2>
              <TripSummary tripData={tripData} />
            </div>

            <div className="route-map-print avoid-break page-break-before print-compact">
              <h2 className="text-xl font-bold border-b pb-2 mb-2">Route Map</h2>
              <RouteMap tripData={tripData} key={`print-map-${mapKey}`} />
            </div>

            <div
              className="eld-logs-print page-break-before print-compact"
              style={{ width: "100%" }}
            >
              <h2 className="text-xl font-bold border-b pb-2 mb-2">ELD Logs</h2>
              <div style={{ width: "100%", overflowX: "hidden" }}>
                <ELDLogGrid tripData={tripData} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TripResults;
