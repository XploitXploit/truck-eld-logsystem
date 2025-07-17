import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef, useState } from "react";
import type { GasStation, TripData } from "../types/index";

function decodePolyline(str: string, precision: number = 5): [number, number][] {
  try {
    let index = 0,
      lat = 0,
      lng = 0,
      coordinates: [number, number][] = [];
    const factor = Math.pow(10, precision);

    while (index < str.length) {
      let shift = 0;
      let result = 0;

      let byte;
      do {
        byte = str.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = str.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
  } catch (error) {
    console.error("Error decoding polyline:", error);
    return [];
  }
}

interface RouteMapProps {
  tripData: TripData;
}

const RouteMap: React.FC<RouteMapProps> = ({ tripData }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);
  const mapInitialized = useRef(false);

  useEffect(() => {
    const addPrintStyles = () => {
      const style = document.createElement("style");
      style.setAttribute("data-print-map-styles", "true");
      style.textContent = `
        @media print {
          .route-map-container {
            width: 100% !important;
            height: 18cm !important;
            max-width: 100% !important;
            page-break-inside: avoid;
          }

          .map-legend {
            font-size: 0.7rem !important;
            padding: 0.2cm !important;
          }

          .map-info {
            font-size: 0.8rem !important;
            padding: 0.2cm !important;
          }

          .fuel-station-popup {
            font-size: 0.7rem !important;
            max-width: 200px !important;
          }

          .custom-div-icon div {
            border: 2px solid black !important;
            color: black !important;
            font-weight: bold !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }
      `;
      document.head.appendChild(style);
      return style;
    };

    const styleElement = addPrintStyles();

    return () => {
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !tripData.route_geometry || mapInitialized.current) {
      return;
    }

    const createIcon = (color: string, icon: string) =>
      L.divIcon({
        html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid black; box-shadow: 0 2px 4px rgba(0,0,0,0.5); color: black; font-weight: bold;">${icon}</div>`,
        className: "custom-div-icon print-visible-icon",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

    const extractCoordinates = (routeData: any, label: string = ""): [number, number][] => {
      if (!routeData) return [];

      if (routeData.routes?.[0]) {
        if (routeData.routes[0].geometry?.coordinates) {
          return routeData.routes[0].geometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]] as [number, number],
          );
        }

        if (routeData.routes[0].geometry && typeof routeData.routes[0].geometry === "string") {
          const decoded = decodePolyline(routeData.routes[0].geometry);
          return decoded;
        }
      }

      if (routeData.features?.[0]?.geometry?.coordinates) {
        return routeData.features[0].geometry.coordinates.map(
          (coord: number[]) => [coord[1], coord[0]] as [number, number],
        );
      }

      if (routeData.geometry && typeof routeData.geometry === "string") {
        const decoded = decodePolyline(routeData.geometry);
        return decoded;
      }

      if (routeData.geometry && typeof routeData.geometry !== "string") {
        if (routeData.geometry.coordinates) {
          return routeData.geometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]] as [number, number],
          );
        }
      }

      return [];
    };

    const initializeMap = () => {
      try {
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }

        mapInstance.current = L.map(mapRef.current!).setView([39.8283, -98.5795], 4);

        L.tileLayer("https:
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapInstance.current);

        mapInitialized.current = true;

        populateMap();
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    const populateMap = () => {
      if (!mapInstance.current) return;

      const map = mapInstance.current;
      let routes = tripData.route_geometry;
      const allCoordinates: [number, number][] = [];

      if (typeof routes === "string") {
        try {
          const parsedRoutes = JSON.parse(routes);
          if (parsedRoutes) {
            routes = parsedRoutes;
          }
        } catch (e) {
          console.log("Could not parse routes string", e);
        }
      }

      const startIcon = createIcon("#10B981", "S");
      const pickupIcon = createIcon("#3B82F6", "P");
      const deliveryIcon = createIcon("#EF4444", "D");
      const fuelIcon = createIcon("#F59E0B", "⛽");

      const realFuelIcon = L.divIcon({
        html: `<div style="background-color: #F59E0B; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid black; box-shadow: 0 2px 4px rgba(0,0,0,0.5); color: black; font-weight: bold;">⛽</div>`,
        className: "custom-div-icon print-visible-icon",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (routes.to_pickup) {
        const pickupCoords = extractCoordinates(routes.to_pickup, "to_pickup");
        if (pickupCoords.length > 0) {
          L.polyline(pickupCoords, { color: "#3B82F6", weight: 4, opacity: 0.8 }).addTo(map);
          allCoordinates.push(...pickupCoords);
        }
      }

      if (routes.to_delivery) {
        const deliveryCoords = extractCoordinates(routes.to_delivery, "to_delivery");
        if (deliveryCoords.length > 0) {
          L.polyline(deliveryCoords, { color: "#EF4444", weight: 4, opacity: 0.8 }).addTo(map);
          allCoordinates.push(...deliveryCoords);
        }
      }

      if (allCoordinates.length === 0) {
        const singleRouteCoords = extractCoordinates(routes, "single_route");
        if (singleRouteCoords.length > 0) {
          L.polyline(singleRouteCoords, { color: "#6B7280", weight: 4, opacity: 0.8 }).addTo(map);
          allCoordinates.push(...singleRouteCoords);
        }
      }

      if (allCoordinates.length > 0) {
        L.marker(allCoordinates[0], { icon: startIcon })
          .addTo(map)
          .bindPopup(`<b>Current Location</b><br>${tripData.current_location}`);

        const pickupIndex = routes.to_pickup
          ? extractCoordinates(routes.to_pickup).length - 1
          : Math.floor(allCoordinates.length / 2);
        if (pickupIndex >= 0 && pickupIndex < allCoordinates.length) {
          L.marker(allCoordinates[pickupIndex], { icon: pickupIcon })
            .addTo(map)
            .bindPopup(`<b>Pickup Location</b><br>${tripData.pickup_location}`);
        }

        L.marker(allCoordinates[allCoordinates.length - 1], { icon: deliveryIcon })
          .addTo(map)
          .bindPopup(`<b>Delivery Location</b><br>${tripData.dropoff_location}`);

        if (tripData.fuel_stops && tripData.fuel_stops.length > 0) {
          tripData.fuel_stops.forEach((stop) => {
            const realFuelIcon = L.divIcon({
              html: `<div style="background-color: #F59E0B; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid black; box-shadow: 0 2px 4px rgba(0,0,0,0.5); color: black; font-weight: bold;">⛽</div>`,
              className: "custom-div-icon print-visible-icon",
              iconSize: [36, 36],
              iconAnchor: [18, 18],
            });
            const marker = L.marker([stop.location.lat, stop.location.lng], { icon: realFuelIcon })
              .addTo(map)
              .bindPopup(
                `<div class="fuel-station-popup">
                  <b>${stop.name}</b><br>
                  ${stop.address}<br>
                  <small>${stop.amenities.join(", ")}</small>
                </div>`,
              );

            marker.on("click", () => {
              setSelectedStation(stop);
            });
          });
        } else if (tripData.fuel_stops_required > 0) {
          const fuelStopInterval = Math.floor(
            allCoordinates.length / (tripData.fuel_stops_required + 1),
          );
          for (let i = 1; i <= tripData.fuel_stops_required; i++) {
            const fuelStopIndex = i * fuelStopInterval;
            if (fuelStopIndex < allCoordinates.length) {
              const fuelStopCoord = allCoordinates[fuelStopIndex];
              L.marker(fuelStopCoord, { icon: fuelIcon })
                .addTo(map)
                .bindPopup(
                  `<div class="fuel-station-popup">
                    <b>Estimated Fuel Stop ${i}</b><br>
                    Based on route distance<br>
                    <small>Approximate distance: ${Math.round((tripData.total_distance / (tripData.fuel_stops_required + 1)) * i)} miles from start</small>
                  </div>`,
                );
            }
          }
        }

        if (allCoordinates.length > 0) {
          map.fitBounds(L.latLngBounds(allCoordinates));
        }
      } else {
        console.log("No coordinates found to display on map");
      }
    };

    const timeoutId = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [tripData.route_geometry]);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      mapInitialized.current = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <style jsx>{`
        @media print {
          .leaflet-container {
            height: 16cm !important;
            page-break-inside: avoid;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          .card {
            break-inside: avoid;
            border: 1px solid #ddd;
            box-shadow: none;
            margin-bottom: 0.3cm;
          }
          .no-print-map {
            display: none !important;
          }
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 mr-1"></div>
          <span>Pickup Route</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 mr-1"></div>
          <span>Delivery Route</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 mr-1 rounded-full"></div>
          <span>Start</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 mr-1 rounded-full"></div>
          <span>Pickup</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 mr-1 rounded-full"></div>
          <span>Delivery</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-orange-500 mr-1 rounded-full"></div>
          <span>Fuel Stop</span>
        </div>
      </div>

      {}
      <div className="card overflow-hidden no-print-map">
        <div
          ref={mapRef}
          style={{ height: "500px", width: "100%" }}
          className="relative print:h-[16cm] no-print-map"
          id="routeMap"
        />
        <div className="hidden print:block mt-2 text-center text-xs">
          Note: Icons may appear faded in print. Fuel stops are marked with ⛽ symbol.
        </div>
      </div>

      {}
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-3">Route Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Distance</p>
            <p className="font-bold">{Math.round(tripData.total_distance)} mi</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Driving Time</p>
            <p className="font-bold">{Math.round(tripData.total_duration)} h</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fuel Stops</p>
            <p className="font-bold">{tripData.fuel_stops_required}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Gas Stations</p>
            <p className="font-bold">{tripData.fuel_stops?.length || 0}</p>
          </div>
        </div>
      </div>

      {}
      {selectedStation && (
        <div className="card no-print-map p-4 border border-orange-200 bg-orange-50">
          <h3 className="text-lg font-semibold mb-2 text-orange-800">
            <span className="inline-block mr-2">⛽</span>
            {selectedStation.name}
          </h3>
          <p className="text-gray-700 mb-2">{selectedStation.address}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedStation.amenities.map((amenity, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {}
      {!selectedStation && tripData.fuel_stops && tripData.fuel_stops.length > 0 && (
        <div className="card p-4 no-print-map">
          <h3 className="text-lg font-semibold mb-3">Fuel Stops</h3>
          <div className="space-y-2 text-sm">
            {tripData.fuel_stops.map((stop, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{stop.name}</p>
                  <p className="text-gray-600 text-xs">{stop.address}</p>
                </div>
                <button
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => setSelectedStation(stop)}
                >
                  Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMap;
