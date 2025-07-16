from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import TripPlan, HOSViolation
from .services import HOSCalculator, ELDLogRenderer
import logging

logger = logging.getLogger("route_planner.views")


@api_view(["POST"])
def plan_trip(request):
    """Plan a trip with HOS compliance"""
    try:
        logger.info("Processing trip planning request")
        data = request.data

        required_fields = [
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_hours",
        ]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            logger.warning(
                f"Missing required fields in request: {', '.join(missing_fields)}"
            )
            return Response(
                {
                    "error": f"Missing required fields: {', '.join(missing_fields)}",
                    "error_type": "missing_fields",
                    "missing_fields": missing_fields,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        logger.debug(
            f"Calculating trip plan from {data['current_location']} to {data['dropoff_location']}"
        )
        hos_calculator = HOSCalculator()
        trip_result = hos_calculator.calculate_eld_logs(data)

        trip = TripPlan.objects.create(
            current_location=data["current_location"],
            pickup_location=data["pickup_location"],
            dropoff_location=data["dropoff_location"],
            current_cycle_hours=float(data["current_cycle_hours"]),
            total_distance=trip_result["total_distance"],
            total_duration=trip_result["total_duration"],
            route_geometry=trip_result["route_geometry"],
            eld_logs=trip_result["eld_logs"],
        )

        logger.debug(f"Generating ELD log grids for trip ID: {trip.id}")
        
        for violation in trip_result["violations"]:
            HOSViolation.objects.create(
                trip=trip,
                violation_type=violation["type"],
                description=violation["description"],
                severity=violation["severity"]
            )
        
        log_renderer = ELDLogRenderer()
        eld_grids = []
        for log_entry in trip_result["eld_logs"]:
            grid_data = log_renderer.generate_log_grid_data(log_entry)
            eld_grids.append(grid_data)
        
        

        response_data = {
            "trip_id": trip.id,
            "total_distance": trip_result["total_distance"],
            "total_duration": trip_result["total_duration"],
            "fuel_stops_required": trip_result["fuel_stops_required"],
            "route_geometry": trip_result["route_geometry"],
            "eld_logs": trip_result["eld_logs"],
            "eld_grids": eld_grids,
            "violations": trip_result["violations"],
            "summary": {
                "total_days": len(trip_result["eld_logs"]),
                "total_driving_time": sum(
                    log["daily_totals"]["driving"] for log in trip_result["eld_logs"]
                ),
                "total_duty_time": sum(
                    log["daily_totals"]["driving"]
                    + log["daily_totals"]["on_duty_not_driving"]
                    for log in trip_result["eld_logs"]
                ),
                "compliant": len(trip_result["violations"]) == 0,
            },
        }

        logger.info(f"Trip planning completed successfully. Trip ID: {trip.id}")
        return Response(response_data, status=status.HTTP_200_OK)

    except ValueError as e:
        logger.warning(f"Trip planning validation error: {str(e)}", exc_info=True)
        return Response(
            {
                "error": f"Trip planning failed: {str(e)}",
                "error_type": "validation_error",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        logger.error(f"Trip planning failed: {str(e)}", exc_info=True)
        return Response(
            {"error": f"Trip planning failed: {str(e)}", "error_type": "server_error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_trip(request, trip_id):
    """Get existing trip plan"""
    try:
        logger.info(f"Getting trip plan for ID: {trip_id}")
        trip = TripPlan.objects.get(id=trip_id)

        logger.debug(f"Generating ELD grids for trip ID: {trip_id}")
        log_renderer = ELDLogRenderer()
        eld_grids = []
        if trip.eld_logs:
            for log_entry in trip.eld_logs:
                grid_data = log_renderer.generate_log_grid_data(log_entry)
                eld_grids.append(grid_data)

        violations = []
        for log in trip.eld_logs:
            if "violations" in log and log["violations"]:
                violations.extend(log["violations"])

        summary = {
            "total_days": len(trip.eld_logs),
            "total_driving_time": sum(
                log["daily_totals"]["driving"] for log in trip.eld_logs
            ),
            "total_duty_time": sum(
                log["daily_totals"]["driving"]
                + log["daily_totals"]["on_duty_not_driving"]
                for log in trip.eld_logs
            ),
            "compliant": len(violations) == 0,
        }

        response_data = {
            "trip_id": trip.id,
            "current_location": trip.current_location,
            "pickup_location": trip.pickup_location,
            "dropoff_location": trip.dropoff_location,
            "current_cycle_hours": trip.current_cycle_hours,
            "total_distance": trip.total_distance,
            "total_duration": trip.total_duration,
            "route_geometry": trip.route_geometry,
            "eld_logs": trip.eld_logs,
            "eld_grids": eld_grids,
            "created_at": trip.created_at,
            "violations": violations,
            "summary": summary,
            "fuel_stops_required": int(trip.total_distance / 500),
        }

        logger.info(f"Successfully retrieved trip plan for ID: {trip_id}")
        return Response(response_data, status=status.HTTP_200_OK)

    except TripPlan.DoesNotExist:
        logger.warning(f"Trip not found for ID: {trip_id}")
        return Response(
            {"error": "Trip not found", "error_type": "not_found", "trip_id": trip_id},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        logger.error(f"Error retrieving trip {trip_id}: {str(e)}", exc_info=True)
        return Response(
            {
                "error": f"Failed to retrieve trip: {str(e)}",
                "error_type": "server_error",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
