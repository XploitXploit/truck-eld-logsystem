from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import TripPlan, HOSViolation
from .serializers import (
    TripPlanSerializer,
    TripPlanCreateSerializer,
    TripPlanDetailSerializer,
    HOSViolationSerializer,
)
from .services import HOSCalculator, ELDLogRenderer
import logging

logger = logging.getLogger("route_planner.views")


class TripPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TripPlan model.

    Provides CRUD operations and additional actions for trip planning.
    """

    queryset = TripPlan.objects.all()
    serializer_class = TripPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """Return appropriate serializer class based on action"""
        if self.action == "create" or self.action == "plan_trip":
            return TripPlanCreateSerializer
        elif self.action in ["retrieve", "get_trip"]:
            return TripPlanDetailSerializer
        return TripPlanSerializer

    def get_queryset(self):
        """Filter queryset to only show trips owned by the current user"""
        user = self.request.user
        if user.is_staff:
            return TripPlan.objects.all()
        return TripPlan.objects.filter(user=user)

    @action(detail=False, methods=["post"])
    def plan_trip(self, request):
        """Plan a trip with HOS compliance"""
        try:
            logger.info("Processing trip planning request")

            # Validate input data
            serializer = TripPlanCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            logger.debug(
                f"Calculating trip plan from {data['current_location']} to {data['dropoff_location']}"
            )

            # Calculate trip details
            hos_calculator = HOSCalculator()
            trip_result = hos_calculator.calculate_eld_logs(data)

            # Create trip
            trip = TripPlan.objects.create(
                user=request.user,
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

            # Create violation records
            for violation in trip_result["violations"]:
                HOSViolation.objects.create(
                    trip=trip,
                    violation_type=violation["type"],
                    description=violation["description"],
                    severity=violation["severity"],
                )

            # Return detailed trip information
            return Response(
                TripPlanDetailSerializer(trip, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )

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
                {
                    "error": f"Trip planning failed: {str(e)}",
                    "error_type": "server_error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"])
    def get_trip(self, request, pk=None):
        """Get detailed information for an existing trip plan"""
        try:
            logger.info(f"Getting trip plan for ID: {pk}")
            trip = self.get_object()

            serializer = TripPlanDetailSerializer(trip, context={"request": request})
            logger.info(f"Successfully retrieved trip plan for ID: {pk}")
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error retrieving trip {pk}: {str(e)}", exc_info=True)
            return Response(
                {
                    "error": f"Failed to retrieve trip: {str(e)}",
                    "error_type": "server_error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class HOSViolationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for HOS Violations.
    Read-only as violations are created by the system, not directly by users.
    """

    queryset = HOSViolation.objects.all()
    serializer_class = HOSViolationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter violations to only show those related to the user's trips"""
        user = self.request.user
        if user.is_staff:
            return HOSViolation.objects.all()
        return HOSViolation.objects.filter(trip__user=user)
