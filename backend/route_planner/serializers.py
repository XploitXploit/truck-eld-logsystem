from rest_framework import serializers
from .models import TripPlan, HOSViolation


class HOSViolationSerializer(serializers.ModelSerializer):
    """Serializer for Hours of Service violations"""

    class Meta:
        model = HOSViolation
        fields = ["id", "violation_type", "description", "severity"]
        read_only_fields = ["id"]


class TripPlanSerializer(serializers.ModelSerializer):
    """Serializer for Trip Plans"""

    violations = HOSViolationSerializer(
        many=True, read_only=True, source="hosviolation_set"
    )

    class Meta:
        model = TripPlan
        fields = [
            "id",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_hours",
            "total_distance",
            "total_duration",
            "route_geometry",
            "eld_logs",
            "violations",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "total_distance",
            "total_duration",
            "route_geometry",
            "eld_logs",
            "created_at",
        ]


class TripPlanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Trip Plans"""

    class Meta:
        model = TripPlan
        fields = [
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_hours",
        ]

    def validate(self, attrs):
        """Validate the input data"""
        # Add any validation logic here
        if attrs.get("current_cycle_hours", 0) < 0:
            raise serializers.ValidationError(
                {"current_cycle_hours": "Hours cannot be negative"}
            )
        return attrs


class TripPlanDetailSerializer(TripPlanSerializer):
    """Detailed serializer for Trip Plans with additional computed fields"""

    summary = serializers.SerializerMethodField()
    fuel_stops_required = serializers.SerializerMethodField()
    eld_grids = serializers.SerializerMethodField()

    class Meta(TripPlanSerializer.Meta):
        fields = TripPlanSerializer.Meta.fields + [
            "summary",
            "fuel_stops_required",
            "eld_grids",
        ]

    def get_summary(self, obj):
        """Calculate trip summary information"""
        if not obj.eld_logs:
            return None

        violations = []
        for log in obj.eld_logs:
            if "violations" in log and log["violations"]:
                violations.extend(log["violations"])

        return {
            "total_days": len(obj.eld_logs),
            "total_driving_time": sum(
                log["daily_totals"]["driving"] for log in obj.eld_logs
            ),
            "total_duty_time": sum(
                log["daily_totals"]["driving"]
                + log["daily_totals"]["on_duty_not_driving"]
                for log in obj.eld_logs
            ),
            "compliant": len(violations) == 0,
        }

    def get_fuel_stops_required(self, obj):
        """Calculate number of fuel stops required"""
        if not obj.total_distance:
            return 0
        return int(obj.total_distance / 500)  # Assuming 500 miles per tank

    def get_eld_grids(self, obj):
        """Generate ELD grid data for the logs"""
        from .services import ELDLogRenderer

        if not obj.eld_logs:
            return []

        log_renderer = ELDLogRenderer()
        eld_grids = []

        for log_entry in obj.eld_logs:
            grid_data = log_renderer.generate_log_grid_data(log_entry)
            eld_grids.append(grid_data)

        return eld_grids
