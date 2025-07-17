import requests
import logging
from datetime import datetime, timedelta
from django.conf import settings
import math
from .utils import find_gas_stations_along_route

logger = logging.getLogger("route_planner.services")


class RouteService:
    def __init__(self):
        self.api_key = settings.OPENROUTE_API_KEY
        self.base_url = "https://api.openrouteservice.org"

    def geocode_location(self, location):
        """Convert address to coordinates"""
        if not location or not isinstance(location, str):
            logger.error(f"Invalid location parameter: {location}")
            return None

        url = f"{self.base_url}/geocode/search"
        params = {"api_key": self.api_key, "text": location, "size": 1}

        try:
            logger.debug(f"Making geocoding request for '{location}'")
            response = requests.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                if data.get("features") and len(data["features"]) > 0:
                    coords = data["features"][0]["geometry"]["coordinates"]
                    logger.debug(f"Successfully geocoded '{location}' to {coords}")
                    return [coords[1], coords[0]]
                logger.debug(f"No geocoding results found for '{location}'")
            else:
                logger.error(
                    f"Geocoding API returned status {response.status_code} for '{location}': {response.text}"
                )
        except Exception as e:
            logger.error(f"Geocoding error for location '{location}': {e}")

        return None

    def get_route(self, start_coords, end_coords, waypoints=None):
        """Get route between coordinates"""
        url = f"{self.base_url}/v2/directions/driving-hgv"

        coordinates = [[start_coords[1], start_coords[0]]]
        if waypoints and len(waypoints) > 0:
            for wp in waypoints:
                coordinates.append([wp[1], wp[0]])
        coordinates.append([end_coords[1], end_coords[0]])

        logger.debug(f"Requesting route with coordinates: {coordinates}")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        data = {
            "coordinates": coordinates,
            "preference": "recommended",
            "units": "mi",
            "language": "en",
            "instructions": True,
            "geometry": True,
        }

        try:
            logger.debug(f"Making routing request from {start_coords} to {end_coords}")
            logger.debug(f"Request URL: {url}")
            logger.debug(f"Request headers: {headers}")
            logger.debug(f"Request data: {data}")

            response = requests.post(url, headers=headers, json=data, timeout=30)

            logger.debug(f"Response status code: {response.status_code}")
            if response.status_code == 200:
                route_data = response.json()
                logger.debug(f"Response data keys: {route_data.keys()}")

                if not route_data:
                    logger.error("Empty response data received from routing API")
                    return None

                if "error" in route_data:
                    error_info = route_data.get("error", {})
                    error_code = error_info.get("code", "unknown")
                    error_message = error_info.get("message", "Unknown error")
                    logger.error(
                        f"API error: code={error_code}, message={error_message}"
                    )
                    return None

                if "routes" in route_data and len(route_data["routes"]) > 0:
                    pass
                else:
                    logger.error(f"Unexpected response format: {route_data.keys()}")
                    return None

                logger.debug(
                    f"Successfully calculated route between {start_coords} and {end_coords}"
                )

                summary = route_data["routes"][0].get("summary", {})
                distance = summary.get("distance", 0)
                duration = summary.get("duration", 0)
                logger.info(
                    f"Route calculated: {distance:.1f} mi, {duration/3600:.1f} hours"
                )

                return route_data
            else:
                error_msg = f"Routing API returned status {response.status_code}"
                try:
                    error_json = response.json()
                    if "error" in error_json:
                        error_details = error_json["error"]
                        error_msg += f": {error_details.get('message', 'Unknown error')} (code: {error_details.get('code', 'unknown')})"
                    else:
                        error_msg += f": {response.text}"
                except Exception:
                    if hasattr(response, "text"):
                        error_msg += f": {response.text}"
                logger.error(
                    f"{error_msg} for route between {start_coords} and {end_coords}"
                )
        except requests.exceptions.Timeout:
            logger.error(
                f"Request timeout for route between {start_coords} and {end_coords}"
            )
            logger.exception("Request timed out:")
        except requests.exceptions.ConnectionError:
            logger.error(
                f"Connection error for route between {start_coords} and {end_coords}"
            )
            logger.exception("Connection failed:")
        except requests.exceptions.RequestException as e:
            logger.error(
                f"Request error for route between {start_coords} and {end_coords}: {e}"
            )
            logger.exception("Request exception:")
        except Exception as e:
            logger.error(f"Route error between {start_coords} and {end_coords}: {e}")
            logger.exception("Detailed exception info for route calculation:")

        return None


class HOSCalculator:
    def __init__(self):
        self.max_driving_hours = 11
        self.max_duty_hours = 14
        self.max_weekly_hours = 70
        self.weekly_period_days = 8
        self.required_rest_break_duration = 0.5
        self.required_rest_break_after = 8
        self.min_off_duty_period = 10

    def calculate_eld_logs(self, trip_data):
        """Calculate ELD logs for the entire trip"""
        try:
            current_location = trip_data["current_location"]
            pickup_location = trip_data["pickup_location"]
            dropoff_location = trip_data["dropoff_location"]
            current_cycle_hours = trip_data["current_cycle_hours"]
        except KeyError as e:
            error_msg = f"Missing required trip data field: {e}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        logger.info(
            f"Calculating ELD logs for trip from {current_location} to {dropoff_location}"
        )
        route_service = RouteService()

        logger.debug(f"Geocoding current location: {current_location}")
        current_coords = route_service.geocode_location(current_location)
        logger.debug(f"Geocoding pickup location: {pickup_location}")
        pickup_coords = route_service.geocode_location(pickup_location)
        logger.debug(f"Geocoding dropoff location: {dropoff_location}")
        dropoff_coords = route_service.geocode_location(dropoff_location)

        missing_locations = []
        if not current_coords:
            missing_locations.append(f"current location '{current_location}'")
        if not pickup_coords:
            missing_locations.append(f"pickup location '{pickup_location}'")
        if not dropoff_coords:
            missing_locations.append(f"dropoff location '{dropoff_location}'")

        if missing_locations:
            error_msg = f"Failed to geocode: {', '.join(missing_locations)}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        logger.info(f"Calculating route from {current_location} to {pickup_location}")
        route_to_pickup = route_service.get_route(current_coords, pickup_coords)
        if not route_to_pickup:
            error_msg = f"Failed to calculate route from {current_location} to {pickup_location}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        logger.info(
            f"Successfully calculated route from {current_location} to {pickup_location}"
        )

        logger.info(f"Calculating route from {pickup_location} to {dropoff_location}")
        route_to_delivery = route_service.get_route(pickup_coords, dropoff_coords)
        if not route_to_delivery:
            error_msg = f"Failed to calculate route from {pickup_location} to {dropoff_location}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        logger.info(
            f"Successfully calculated route from {pickup_location} to {dropoff_location}"
        )

        try:
            pickup_distance = 0
            pickup_duration = 0
            delivery_distance = 0
            delivery_duration = 0

            if (
                route_to_pickup
                and "routes" in route_to_pickup
                and len(route_to_pickup["routes"]) > 0
                and "summary" in route_to_pickup["routes"][0]
            ):
                pickup_distance = route_to_pickup["routes"][0]["summary"].get(
                    "distance", 0
                )
                pickup_duration = route_to_pickup["routes"][0]["summary"].get(
                    "duration", 0
                )
                logger.debug(
                    f"Pickup route: {pickup_distance} miles, {pickup_duration/3600:.2f} hours"
                )
            else:
                logger.warning("Could not extract pickup route data, using defaults")

            if (
                route_to_delivery
                and "routes" in route_to_delivery
                and len(route_to_delivery["routes"]) > 0
                and "summary" in route_to_delivery["routes"][0]
            ):
                delivery_distance = route_to_delivery["routes"][0]["summary"].get(
                    "distance", 0
                )
                delivery_duration = route_to_delivery["routes"][0]["summary"].get(
                    "duration", 0
                )
                logger.debug(
                    f"Delivery route: {delivery_distance} miles, {delivery_duration/3600:.2f} hours"
                )
            else:
                logger.warning("Could not extract delivery route data, using defaults")

            total_distance = pickup_distance + delivery_distance
            total_duration = (
                pickup_duration + delivery_duration
            ) / 3600

            logger.info(f"Total trip distance: {total_distance:.1f} miles")
            logger.info(f"Total driving time: {total_duration:.1f} hours")
        except (KeyError, IndexError, TypeError) as e:
            logger.error(f"Error extracting route data: {e}")
            raise ValueError(f"Invalid route data structure: {e}")

        pickup_time = 1.0
        delivery_time = 1.0
        total_on_duty_time = total_duration + pickup_time + delivery_time

        fuel_stops = math.floor(total_distance / 500)
        fuel_stop_time = fuel_stops * 0.5
        total_on_duty_time += fuel_stop_time

        gas_stations = find_gas_stations_along_route(
            {
                "to_pickup": route_to_pickup,
                "to_delivery": route_to_delivery,
            },
            fuel_stops,
        )
        logger.info(f"Found {len(gas_stations)} gas stations along the route")

        logs = self._generate_daily_logs(
            total_duration,
            total_on_duty_time,
            current_cycle_hours,
            pickup_time,
            delivery_time,
            fuel_stops,
        )

        return {
            "total_distance": total_distance,
            "total_duration": total_duration,
            "route_geometry": {
                "to_pickup": route_to_pickup,
                "to_delivery": route_to_delivery,
            },
            "eld_logs": logs,
            "fuel_stops_required": fuel_stops,
            "fuel_stops": gas_stations,
        }

    def _generate_daily_logs(
        self,
        driving_time,
        total_duty_time,
        current_cycle,
        pickup_time,
        delivery_time,
        fuel_stops,
    ):
        """Generate detailed ELD logs"""
        logs = []
        current_time = datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)
        remaining_driving = driving_time
        remaining_duty = total_duty_time
        cycle_hours_used = current_cycle

        day_number = 1

        while remaining_duty > 0:
            log_entry = {
                "date": current_time.strftime("%Y-%m-%d"),
                "day_number": day_number,
                "activities": [],
                "daily_totals": {
                    "off_duty": 0,
                    "sleeper_berth": 0,
                    "driving": 0,
                    "on_duty_not_driving": 0,
                },
                "violations": [],
            }

            available_driving = min(self.max_driving_hours, remaining_driving)
            available_duty = min(self.max_duty_hours, remaining_duty)
            weekly_remaining = self.max_weekly_hours - cycle_hours_used
            available_duty = min(available_duty, weekly_remaining)

            if available_duty <= 0:
                log_entry["activities"].append(
                    {
                        "start_time": current_time.strftime("%H:%M"),
                        "end_time": (current_time + timedelta(hours=34)).strftime(
                            "%H:%M"
                        ),
                        "status": "off_duty",
                        "duration": 34.0,
                        "location": "Rest Area",
                        "description": "34-hour restart required",
                    }
                )
                log_entry["daily_totals"]["off_duty"] = 34.0
                logs.append(log_entry)

                if len(logs) >= 2:
                    cycle_hours_used = 0

                current_time += timedelta(days=1)
                day_number += 1
                continue

            current_activity_time = current_time
            daily_driving = 0
            daily_duty = 0
            continuous_driving = 0

            if day_number == 1:
                log_entry["activities"].append(
                    {
                        "start_time": current_activity_time.strftime("%H:%M"),
                        "end_time": (
                            current_activity_time + timedelta(minutes=15)
                        ).strftime("%H:%M"),
                        "status": "on_duty_not_driving",
                        "duration": 0.25,
                        "location": (
                            current_time.strftime("%Y-%m-%d")
                            if day_number == 1
                            else "Truck Stop"
                        ),
                        "description": "Pre-trip inspection",
                    }
                )
                current_activity_time += timedelta(minutes=15)
                daily_duty += 0.25

            while (
                remaining_driving > 0
                and daily_driving < available_driving
                and daily_duty < available_duty
                and continuous_driving < self.required_rest_break_after
            ):

                drive_segment = min(
                    remaining_driving,
                    available_driving - daily_driving,
                    available_duty - daily_duty,
                    self.required_rest_break_after - continuous_driving,
                    4.0,
                )

                if drive_segment <= 0:
                    break

                end_time = current_activity_time + timedelta(hours=drive_segment)
                log_entry["activities"].append(
                    {
                        "start_time": current_activity_time.strftime("%H:%M"),
                        "end_time": end_time.strftime("%H:%M"),
                        "status": "driving",
                        "duration": drive_segment,
                        "location": "En Route",
                        "description": f'Driving - Segment {len([a for a in log_entry["activities"] if a["status"] == "driving"]) + 1}',
                    }
                )

                current_activity_time = end_time
                daily_driving += drive_segment
                daily_duty += drive_segment
                remaining_driving -= drive_segment
                remaining_duty -= drive_segment
                continuous_driving += drive_segment

                if (
                    continuous_driving >= self.required_rest_break_after
                    and remaining_driving > 0
                ):
                    break_end = current_activity_time + timedelta(minutes=30)
                    log_entry["activities"].append(
                        {
                            "start_time": current_activity_time.strftime("%H:%M"),
                            "end_time": break_end.strftime("%H:%M"),
                            "status": "off_duty",
                            "duration": 0.5,
                            "location": "Rest Area",
                            "description": "30-minute rest break (required after 8 hours driving)",
                        }
                    )
                    current_activity_time = break_end
                    continuous_driving = 0

                if fuel_stops > 0 and daily_driving > 0 and daily_driving % 4 == 0:
                    fuel_end = current_activity_time + timedelta(minutes=30)
                    log_entry["activities"].append(
                        {
                            "start_time": current_activity_time.strftime("%H:%M"),
                            "end_time": fuel_end.strftime("%H:%M"),
                            "status": "on_duty_not_driving",
                            "duration": 0.5,
                            "location": "Fuel Station",
                            "description": "Fueling",
                        }
                    )
                    current_activity_time = fuel_end
                    daily_duty += 0.5
                    remaining_duty -= 0.5
                    fuel_stops -= 1

            if day_number == 1 and pickup_time > 0:
                pickup_end = current_activity_time + timedelta(hours=pickup_time)
                log_entry["activities"].append(
                    {
                        "start_time": current_activity_time.strftime("%H:%M"),
                        "end_time": pickup_end.strftime("%H:%M"),
                        "status": "on_duty_not_driving",
                        "duration": pickup_time,
                        "location": "Pickup Location",
                        "description": "Loading/Pickup",
                    }
                )
                current_activity_time = pickup_end
                daily_duty += pickup_time
                remaining_duty -= pickup_time
                pickup_time = 0

            if remaining_driving <= 0 and delivery_time > 0:
                delivery_end = current_activity_time + timedelta(hours=delivery_time)
                log_entry["activities"].append(
                    {
                        "start_time": current_activity_time.strftime("%H:%M"),
                        "end_time": delivery_end.strftime("%H:%M"),
                        "status": "on_duty_not_driving",
                        "duration": delivery_time,
                        "location": "Delivery Location",
                        "description": "Unloading/Delivery",
                    }
                )
                current_activity_time = delivery_end
                daily_duty += delivery_time
                remaining_duty -= delivery_time
                delivery_time = 0

            hours_in_day = 24
            total_logged_hours = sum(
                activity["duration"] for activity in log_entry["activities"]
            )
            off_duty_hours = hours_in_day - total_logged_hours

            if off_duty_hours > 0:
                log_entry["activities"].append(
                    {
                        "start_time": current_activity_time.strftime("%H:%M"),
                        "end_time": current_activity_time.replace(
                            hour=23, minute=59
                        ).strftime("%H:%M"),
                        "status": (
                            "sleeper_berth" if off_duty_hours >= 10 else "off_duty"
                        ),
                        "duration": off_duty_hours,
                        "location": (
                            "Truck Stop" if off_duty_hours >= 10 else "Rest Area"
                        ),
                        "description": f'{"Required 10-hour rest" if off_duty_hours >= 10 else "Off duty"}',
                    }
                )

            for activity in log_entry["activities"]:
                status = activity["status"]
                duration = activity["duration"]
                if status in log_entry["daily_totals"]:
                    log_entry["daily_totals"][status] += duration

            cycle_hours_used += daily_duty

            logs.append(log_entry)
            current_time += timedelta(days=1)
            day_number += 1

        return logs


class ELDLogRenderer:
    def __init__(self):
        self.grid_width = 24 * 4
        self.row_height = 30

    def generate_log_grid_data(self, log_entry):
        """Generate data for drawing ELD log grid"""
        grid_data = {
            "date": log_entry["date"],
            "driver_name": "Driver Name",
            "carrier_name": "Carrier Name",
            "truck_number": "Truck
            "activities": [],
            "totals": log_entry["daily_totals"],
            "grid_segments": [],
        }

        for activity in log_entry["activities"]:
            start_minutes = self._time_to_minutes(activity["start_time"])
            end_minutes = self._time_to_minutes(activity["end_time"])

            if end_minutes < start_minutes:
                end_minutes += 24 * 60

            grid_data["grid_segments"].append(
                {
                    "status": activity["status"],
                    "start_position": (start_minutes / 15),
                    "width": ((end_minutes - start_minutes) / 15),
                    "description": activity["description"],
                    "location": activity["location"],
                }
            )

        return grid_data

    def _time_to_minutes(self, time_str):
        """Convert HH:MM to minutes since midnight"""
        hours, minutes = map(int, time_str.split(":"))
        return hours * 60 + minutes
