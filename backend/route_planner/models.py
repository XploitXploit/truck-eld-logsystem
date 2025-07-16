from django.db import models
from django.conf import settings
import logging

logger = logging.getLogger("route_planner.models")


class TripPlan(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trips",
        null=True,
        blank=True,
    )
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_hours = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    total_distance = models.FloatField(null=True, blank=True)
    total_duration = models.FloatField(null=True, blank=True)  # in hours
    route_geometry = models.JSONField(null=True, blank=True)

    eld_logs = models.JSONField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("planned", "Planned"),
            ("in_progress", "In Progress"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled"),
        ],
        default="planned",
    )

    def __str__(self):
        return f"Trip from {self.current_location} to {self.dropoff_location}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        action = "Creating" if is_new else "Updating"
        logger.info(
            f"{action} TripPlan from {self.current_location} to {self.dropoff_location}"
        )
        super().save(*args, **kwargs)
        if is_new:
            logger.info(f"Created TripPlan with ID: {self.pk}")


class HOSViolation(models.Model):
    trip = models.ForeignKey(TripPlan, on_delete=models.CASCADE)
    violation_type = models.CharField(max_length=100)
    description = models.TextField()
    severity = models.CharField(
        max_length=20,
        choices=[
            ("warning", "Warning"),
            ("violation", "Violation"),
            ("critical", "Critical"),
        ],
    )

    def __str__(self):
        return f"{self.violation_type} - {self.trip.id}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        action = "Creating" if is_new else "Updating"
        logger.info(
            f"{action} HOSViolation of type {self.violation_type} with severity {self.severity}"
        )
        super().save(*args, **kwargs)
        if is_new:
            logger.info(
                f"Created HOSViolation with ID: {self.pk} for Trip ID: {self.trip.id}"
            )
