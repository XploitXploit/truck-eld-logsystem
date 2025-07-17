import requests
import logging
import math
from typing import List, Dict, Tuple, Optional, Any

logger = logging.getLogger("route_planner.utils")


def find_gas_stations_along_route(
    route_geometry: Dict[str, Any], number_of_stops: int, radius_km: float = 2.0
) -> List[Dict[str, Any]]:
    """
    Find gas stations at intervals along a route

    Args:
        route_geometry: The route geometry from OpenRouteService API
        number_of_stops: The number of fuel stops to find
        radius_km: Search radius in kilometers around each point

    Returns:
        List of dictionaries with gas station information
    """
    if not route_geometry or number_of_stops <= 0:
        logger.warning("Invalid parameters for finding gas stations")
        return []

    try:
        all_coordinates = extract_route_coordinates(route_geometry)

        if not all_coordinates:
            logger.warning("No valid coordinates found in route geometry")
            return []

        route_length = len(all_coordinates)
        if route_length <= 2:
            logger.warning("Route too short to calculate fuel stops")
            return []

        stop_positions = calculate_stop_positions(all_coordinates, number_of_stops)

        gas_stations = []
        for position in stop_positions:
            lat, lng = position
            stations = find_nearby_gas_stations(lat, lng, radius_km)
            if stations:
                closest = stations[0]
                gas_stations.append(
                    {
                        "name": closest.get("name", "Gas Station"),
                        "location": {
                            "lat": closest.get("lat"),
                            "lng": closest.get("lng"),
                        },
                        "address": closest.get("address", ""),
                        "amenities": closest.get("amenities", []),
                    }
                )

        return gas_stations

    except Exception as e:
        logger.error(f"Error finding gas stations: {str(e)}", exc_info=True)
        return []


def extract_route_coordinates(
    route_geometry: Dict[str, Any]
) -> List[Tuple[float, float]]:
    """
    Extract coordinates from route geometry

    Args:
        route_geometry: The route geometry from OpenRouteService API

    Returns:
        List of [lat, lng] coordinate pairs
    """
    all_coordinates = []

    try:
        if "to_pickup" in route_geometry:
            pickup_coords = []
            pickup_data = route_geometry["to_pickup"]

            if "routes" in pickup_data and pickup_data["routes"]:
                route = pickup_data["routes"][0]
                if "geometry" in route:
                    if (
                        isinstance(route["geometry"], dict)
                        and "coordinates" in route["geometry"]
                    ):
                        pickup_coords = [
                            [coord[1], coord[0]]
                            for coord in route["geometry"]["coordinates"]
                        ]
                    elif isinstance(route["geometry"], str):
                        pass

            elif "features" in pickup_data and pickup_data["features"]:
                feature = pickup_data["features"][0]
                if "geometry" in feature and "coordinates" in feature["geometry"]:
                    pickup_coords = [
                        [coord[1], coord[0]]
                        for coord in feature["geometry"]["coordinates"]
                    ]

            all_coordinates.extend(pickup_coords)

        if "to_delivery" in route_geometry:
            delivery_coords = []
            delivery_data = route_geometry["to_delivery"]

            if "routes" in delivery_data and delivery_data["routes"]:
                route = delivery_data["routes"][0]
                if "geometry" in route:
                    if (
                        isinstance(route["geometry"], dict)
                        and "coordinates" in route["geometry"]
                    ):
                        delivery_coords = [
                            [coord[1], coord[0]]
                            for coord in route["geometry"]["coordinates"]
                        ]
                    elif isinstance(route["geometry"], str):
                        pass

            elif "features" in delivery_data and delivery_data["features"]:
                feature = delivery_data["features"][0]
                if "geometry" in feature and "coordinates" in feature["geometry"]:
                    delivery_coords = [
                        [coord[1], coord[0]]
                        for coord in feature["geometry"]["coordinates"]
                    ]

            all_coordinates.extend(delivery_coords)

    except Exception as e:
        logger.error(f"Error extracting coordinates: {str(e)}", exc_info=True)

    return all_coordinates


def calculate_stop_positions(
    coordinates: List[Tuple[float, float]], number_of_stops: int
) -> List[Tuple[float, float]]:
    """
    Calculate positions for fuel stops along the route

    Args:
        coordinates: List of [lat, lng] coordinates
        number_of_stops: Number of stops to calculate

    Returns:
        List of [lat, lng] positions for fuel stops
    """
    if not coordinates or number_of_stops <= 0:
        return []

    try:
        route_length = len(coordinates)

        segment_length = route_length / (number_of_stops + 1)

        stop_positions = []
        for i in range(1, number_of_stops + 1):
            index = int(i * segment_length)
            if 0 <= index < route_length:
                stop_positions.append(coordinates[index])

        return stop_positions

    except Exception as e:
        logger.error(f"Error calculating stop positions: {str(e)}", exc_info=True)
        return []


def find_nearby_gas_stations(
    lat: float, lng: float, radius_km: float = 2.0
) -> List[Dict[str, Any]]:
    """
    Find gas stations near a specific location using Overpass API (OpenStreetMap)

    Args:
        lat: Latitude
        lng: Longitude
        radius_km: Search radius in kilometers

    Returns:
        List of gas station dictionaries
    """
    try:
        overpass_url = "https://overpass-api.de/api/interpreter"
        overpass_query = f"""
        [out:json];
        node["amenity"="fuel"](around:{radius_km * 1000},{lat},{lng});
        out body;
        """

        response = requests.post(overpass_url, data={"data": overpass_query})

        if response.status_code != 200:
            logger.error(f"Overpass API error: {response.status_code}, {response.text}")
            return []

        data = response.json()

        stations = []
        for element in data.get("elements", []):
            if element.get("type") == "node":
                tags = element.get("tags", {})

                station = {
                    "id": element.get("id"),
                    "name": tags.get("name", "Gas Station"),
                    "lat": element.get("lat"),
                    "lng": element.get("lon"),
                    "address": format_address(tags),
                    "amenities": extract_amenities(tags),
                }

                stations.append(station)

        stations.sort(key=lambda x: calculate_distance(lat, lng, x["lat"], x["lng"]))

        return stations

    except Exception as e:
        logger.error(f"Error finding nearby gas stations: {str(e)}", exc_info=True)
        return []


def format_address(tags: Dict[str, str]) -> str:
    """Format the address from OSM tags"""
    parts = []

    if "addr:housenumber" in tags and "addr:street" in tags:
        parts.append(f"{tags['addr:housenumber']} {tags['addr:street']}")
    elif "addr:street" in tags:
        parts.append(tags["addr:street"])

    if "addr:city" in tags:
        city_part = tags["addr:city"]
        if "addr:state" in tags:
            city_part += f", {tags['addr:state']}"
        parts.append(city_part)

    if "addr:postcode" in tags:
        parts.append(tags["addr:postcode"])

    return ", ".join(parts) if parts else "Unknown address"


def extract_amenities(tags: Dict[str, str]) -> List[str]:
    """Extract amenities from OSM tags"""
    amenities = []

    if tags.get("hgv", "no") == "yes":
        amenities.append("Truck Friendly")

    if tags.get("hgv:parking", "no") == "yes":
        amenities.append("Truck Parking")

    if tags.get("shower", "no") == "yes":
        amenities.append("Showers")

    if tags.get("restaurant", "no") == "yes":
        amenities.append("Restaurant")

    if tags.get("shop", "") == "convenience":
        amenities.append("Convenience Store")

    if "brand" in tags:
        amenities.append(f"Brand: {tags['brand']}")

    return amenities


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees)
    """
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    radius = 6371

    return c * radius
