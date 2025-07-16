from django.contrib import admin
import logging
from .models import TripPlan, HOSViolation

logger = logging.getLogger("route_planner.admin")


@admin.register(TripPlan)
class TripPlanAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "current_location",
        "pickup_location",
        "dropoff_location",
        "created_at",
    )
    list_filter = ("created_at",)
    search_fields = ("current_location", "pickup_location", "dropoff_location")
    readonly_fields = ("created_at",)

    def save_model(self, request, obj, form, change):
        action = "Updated" if change else "Created"
        logger.info(
            f"{action} TripPlan: ID={obj.id}, From={obj.current_location}, To={obj.dropoff_location}"
        )
        super().save_model(request, obj, form, change)


@admin.register(HOSViolation)
class HOSViolationAdmin(admin.ModelAdmin):
    list_display = ("violation_type", "severity", "trip", "description")
    list_filter = ("violation_type", "severity")
    search_fields = ("violation_type", "description")

    def save_model(self, request, obj, form, change):
        action = "Updated" if change else "Created"
        logger.info(
            f"{action} HOSViolation: Type={obj.violation_type}, Severity={obj.severity}, Trip ID={obj.trip.id}"
        )
        super().save_model(request, obj, form, change)
