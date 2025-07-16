import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef, useState } from "react";
import type { GasStation, TripData } from "../types/index";

// Polyline decoding utility for OpenRouteService
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
  const map = useRef<L.Map | null>(null);
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);

  useEffect(() => {
    if (!mapRef.current || !tripData.route_geometry) {
      console.log("Map ref or route_geometry missing", {
        mapRef: !!mapRef.current,
        geometry: !!tripData.route_geometry,
      });
      return;
    }

    console.log("Route geometry data:", tripData.route_geometry);

    // Clean up any existing map instance
    if (map.current) {
      map.current.remove();
    }

    // Initialize map
    map.current = L.map(mapRef.current).setView([39.8283, -98.5795], 4);

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map.current);

    // Custom icons
    const createIcon = (color: string, icon: string) =>
      L.divIcon({
        html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); color: white; font-weight: bold;">${icon}</div>`,
        className: "custom-div-icon",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

    const startIcon = createIcon("#10B981", "S");
    const pickupIcon = createIcon("#3B82F6", "P");
    const deliveryIcon = createIcon("#EF4444", "D");
    const fuelIcon = createIcon("#F59E0B", "⛽");
    const realFuelIcon = L.divIcon({
      html: `<div style="background-color: #F59E0B; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); color: white; font-weight: bold;">⛽</div>`,
      className: "custom-div-icon",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    // Add route lines
    let routes = tripData.route_geometry;
    const allCoordinates: [number, number][] = [];

    console.log("Route geometry type:", typeof routes);

    // Extract coordinates from polyline geometry or parse from encoded polyline
    const extractCoordinates = (routeData: any, label: string = ""): [number, number][] => {
      console.log(`Extracting coords from route data (${label}):`, routeData);

      if (!routeData) return [];

      // Case 1: OpenRouteService v2 API with routes array
      if (routeData.routes?.[0]) {
        console.log("Found routes array structure");

        // Check for geometry.coordinates array
        if (routeData.routes[0].geometry?.coordinates) {
          console.log("Found coordinates array in routes[0].geometry");
          return routeData.routes[0].geometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]] as [number, number],
          );
        }

        // Check for encoded polyline
        if (routeData.routes[0].geometry && typeof routeData.routes[0].geometry === "string") {
          console.log("Found encoded polyline string");
          // Decode the polyline string
          const decoded = decodePolyline(routeData.routes[0].geometry);
          console.log("Decoded polyline:", decoded.length, "points");
          // Convert from [lat, lng] to [lng, lat] format
          return decoded;
        }
      }

      // Case 2: GeoJSON format with features array
      if (routeData.features?.[0]?.geometry?.coordinates) {
        console.log("Found GeoJSON features structure");
        return routeData.features[0].geometry.coordinates.map(
          (coord: number[]) => [coord[1], coord[0]] as [number, number],
        );
      }

      // Case 3: Direct geometry string
      if (routeData.geometry && typeof routeData.geometry === "string") {
        console.log("Found direct geometry string");
        // Decode the polyline string
        const decoded = decodePolyline(routeData.geometry);
        console.log("Decoded polyline:", decoded.length, "points");
        return decoded;
      }

      // Case 4: Try parsing the "geometry" field directly
      if (routeData.geometry && typeof routeData.geometry !== "string") {
        console.log("Found geometry object");
        if (routeData.geometry.coordinates) {
          const coords = routeData.geometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]] as [number, number],
          );
          console.log("Found geometry.coordinates with length:", coords.length);
          return coords;
        }
      }

      console.log("Could not extract coordinates from route data");
      return [];
    };

    // Extract the route geometry data directly if we have a single route in a different format
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

    // Process the route based on different possible formats
    let routeCoordinates: [number, number][] = [];

    // Process to_pickup route
    if (routes.to_pickup) {
      const pickupCoords = extractCoordinates(routes.to_pickup, "to_pickup");
      console.log("Pickup coordinates:", pickupCoords.length);

      if (pickupCoords.length > 0) {
        L.polyline(pickupCoords, { color: "#3B82F6", weight: 4, opacity: 0.8 }).addTo(map.current!);
        allCoordinates.push(...pickupCoords);
        routeCoordinates.push(...pickupCoords);
      }
    }

    // Process to_delivery route
    if (routes.to_delivery) {
      const deliveryCoords = extractCoordinates(routes.to_delivery, "to_delivery");
      console.log("Delivery coordinates:", deliveryCoords.length);

      if (deliveryCoords.length > 0) {
        L.polyline(deliveryCoords, { color: "#EF4444", weight: 4, opacity: 0.8 }).addTo(
          map.current!,
        );
        allCoordinates.push(...deliveryCoords);
        routeCoordinates.push(...deliveryCoords);
      }
    }

    // If we didn't find coordinates in the standard format, try parsing the entire route_geometry directly
    if (routeCoordinates.length === 0) {
      console.log("Trying to parse route_geometry directly");
      routeCoordinates = extractCoordinates(routes, "direct");
      if (routeCoordinates.length > 0) {
        console.log("Found coordinates in direct parsing:", routeCoordinates.length);
        L.polyline(routeCoordinates, { color: "#10B981", weight: 4, opacity: 0.8 }).addTo(
          map.current!,
        );
        allCoordinates.push(...routeCoordinates);
      }
    }

    // Add markers (simplified - would need geocoding for exact coordinates)
    if (allCoordinates.length > 0) {
      console.log("Total coordinates:", allCoordinates.length);

      try {
        const bounds = L.latLngBounds(allCoordinates);
        map.current!.fitBounds(bounds, { padding: [20, 20] });

        // Add location markers
        const startCoord = allCoordinates[0];
        const endCoord = allCoordinates[allCoordinates.length - 1];

        // For pickup location, try to find the junction between routes
        let pickupIndex = 0;
        if (routes.to_pickup) {
          if (routes.to_pickup.routes?.[0]?.geometry?.coordinates) {
            pickupIndex = routes.to_pickup.routes[0].geometry.coordinates.length - 1;
          } else if (routes.to_pickup.features?.[0]?.geometry?.coordinates) {
            pickupIndex = routes.to_pickup.features[0].geometry.coordinates.length - 1;
          } else if (typeof routes.to_pickup.routes?.[0]?.geometry === "string") {
            // Estimate from decoded polyline
            const decodedLength = decodePolyline(routes.to_pickup.routes[0].geometry).length;
            pickupIndex = decodedLength - 1;
          }
        }

        console.log("Pickup index:", pickupIndex, "All coordinates length:", allCoordinates.length);

        const midCoord =
          pickupIndex > 0 && pickupIndex < allCoordinates.length
            ? allCoordinates[pickupIndex]
            : allCoordinates[Math.floor(allCoordinates.length / 2)];

        console.log("Marker coordinates:", {
          start: startCoord,
          pickup: midCoord,
          delivery: endCoord,
        });

        L.marker(startCoord, { icon: startIcon })
          .addTo(map.current!)
          .bindPopup(`<b>Current Location</b><br>${tripData.current_location}`);

        L.marker(midCoord, { icon: pickupIcon })
          .addTo(map.current!)
          .bindPopup(`<b>Pickup Location</b><br>${tripData.pickup_location}`);

        L.marker(endCoord, { icon: deliveryIcon })
          .addTo(map.current!)
          .bindPopup(`<b>Delivery Location</b><br>${tripData.dropoff_location}`);
      } catch (error) {
        console.error("Error creating map bounds or markers:", error);
      }

      // Add fuel stop markers
      if (tripData.fuel_stops && tripData.fuel_stops.length > 0) {
        // Real gas stations available
        tripData.fuel_stops.forEach((station, index) => {
          if (station.location && station.location.lat && station.location.lng) {
            const marker = L.marker([station.location.lat, station.location.lng], {
              icon: realFuelIcon,
            })
              .addTo(map.current!)
              .bindPopup(
                `<b>${station.name}</b><br>${station.address || "Address not available"}<br>Fuel Stop ${index + 1}`,
              );

            marker.on("click", () => {
              setSelectedStation(station);
            });
          }
        });
      } else if (tripData.fuel_stops_required > 0) {
        // Fallback to estimated positions
        const fuelStopInterval = Math.floor(
          allCoordinates.length / (tripData.fuel_stops_required + 1),
        );
        for (let i = 1; i <= tripData.fuel_stops_required; i++) {
          const fuelStopCoord = allCoordinates[i * fuelStopInterval];
          if (fuelStopCoord) {
            L.marker(fuelStopCoord, { icon: fuelIcon })
              .addTo(map.current!)
              .bindPopup(`<b>Fuel Stop ${i}</b><br>Estimated position based on distance`);
          }
        }
      }
    }

    // Return a cleanup function to remove the map when component unmounts
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [tripData]);

  return (
    <div className="space-y-6">
      {!tripData.route_geometry && (
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-md mb-4">
          No route data available. This could be due to missing coordinates or an error in the route
          calculation.
        </div>
      )}

      {/* Map Legend */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Route Map</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span>Current Location</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span>Pickup</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span>Delivery</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
            <span>
              {tripData.fuel_stops && tripData.fuel_stops.length > 0
                ? "Gas Station"
                : "Estimated Fuel Stop"}
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="card overflow-hidden">
        <div ref={mapRef} style={{ height: "500px", width: "100%" }} className="relative" />
      </div>

      {/* Route Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Route Segments</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Current → Pickup</span>
              <span className="font-medium text-blue-600">Segment 1</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Pickup → Delivery</span>
              <span className="font-medium text-red-600">Segment 2</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Trip Statistics</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Distance:</span>
              <span className="font-medium">{Math.round(tripData.total_distance)} miles</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Driving Time:</span>
              <span className="font-medium">{Math.round(tripData.total_duration)} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fuel Stops Required:</span>
              <span className="font-medium">{tripData.fuel_stops_required}</span>
            </div>
            {tripData.fuel_stops && tripData.fuel_stops.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Gas Stations Found:</span>
                <span className="font-medium">{tripData.fuel_stops.length}</span>
              </div>
            )}
          </div>

          {/* Selected Gas Station Info */}
          {selectedStation && (
            <div className="mt-4 pt-4 border-t">
              <h5 className="font-semibold mb-2">Gas Station Details</h5>
              <p className="font-medium">{selectedStation.name}</p>
              <p className="text-sm text-gray-700">
                {selectedStation.address || "Address not available"}
              </p>
              {selectedStation.amenities && selectedStation.amenities.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 mb-1">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedStation.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
