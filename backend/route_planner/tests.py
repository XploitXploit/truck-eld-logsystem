from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from .models import TripPlan, HOSViolation
from unittest.mock import patch
import logging
import io


class LoggingTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.log_stream = io.StringIO()
        self.handler = logging.StreamHandler(self.log_stream)
        self.logger = logging.getLogger("route_planner")
        self.logger.setLevel(logging.DEBUG)
        self.logger.addHandler(self.handler)

    def tearDown(self):
        self.logger.removeHandler(self.handler)

    def test_views_logging(self):
        """Test that views are logging properly"""
        with patch("route_planner.views.HOSCalculator") as mock_calculator:
            mock_calculator.return_value.calculate_eld_logs.return_value = {
                "total_distance": 500,
                "total_duration": 10,
                "route_geometry": {"test": "data"},
                "eld_logs": [
                    {
                        "date": "2023-01-01",
                        "daily_totals": {"driving": 8, "on_duty_not_driving": 2},
                    }
                ],
                "fuel_stops_required": 0,
                "violations": [],
            }

            test_data = {
                "current_location": "Test Start",
                "pickup_location": "Test Pickup",
                "dropoff_location": "Test Destination",
                "current_cycle_hours": 0,
            }

            response = self.client.post(reverse("plan_trip"), test_data, format="json")
            self.assertEqual(response.status_code, 200)

            log_contents = self.log_stream.getvalue()
            self.assertIn("Processing trip planning request", log_contents)
            self.assertIn("Trip planning completed successfully", log_contents)

            self.log_stream.truncate(0)
            self.log_stream.seek(0)

            response = self.client.post(reverse("plan_trip"), {}, format="json")
            self.assertEqual(response.status_code, 400)

            log_contents = self.log_stream.getvalue()
            self.assertIn("Missing required field", log_contents)

    def test_model_logging(self):
        """Test that models are logging properly"""
        self.log_stream.truncate(0)
        self.log_stream.seek(0)

        trip = TripPlan.objects.create(
            current_location="Test Start",
            pickup_location="Test Pickup",
            dropoff_location="Test Destination",
            current_cycle_hours=0,
            total_distance=500,
            total_duration=10,
        )

        log_contents = self.log_stream.getvalue()
        self.assertIn(
            f"Creating TripPlan from Test Start to Test Destination", log_contents
        )
        self.assertIn(f"Created TripPlan with ID: {trip.id}", log_contents)

        self.log_stream.truncate(0)
        self.log_stream.seek(0)

        violation = HOSViolation.objects.create(
            trip=trip,
            violation_type="Test Violation",
            description="Test Description",
            severity="warning",
        )

        log_contents = self.log_stream.getvalue()
        self.assertIn(
            "Creating HOSViolation of type Test Violation with severity warning",
            log_contents,
        )
        self.assertIn(f"Created HOSViolation with ID: {violation.id}", log_contents)


class ServiceLoggingTestCase(TestCase):
    def setUp(self):
        self.log_stream = io.StringIO()
        self.handler = logging.StreamHandler(self.log_stream)
        self.logger = logging.getLogger("route_planner.services")
        self.logger.setLevel(logging.DEBUG)
        self.logger.addHandler(self.handler)

    def tearDown(self):
        self.logger.removeHandler(self.handler)

    @patch("route_planner.services.requests.get")
    def test_geocode_logging(self, mock_get):
        """Test that geocoding logs errors properly"""
        from .services import RouteService

        mock_get.side_effect = Exception("Test geocoding error")

        service = RouteService()
        result = service.geocode_location("Test Location")

        self.assertIsNone(result)
        log_contents = self.log_stream.getvalue()
        self.assertIn("Geocoding error: Test geocoding error", log_contents)

    @patch("route_planner.services.requests.post")
    def test_route_logging(self, mock_post):
        """Test that route calculation logs errors properly"""
        from .services import RouteService

        mock_post.side_effect = Exception("Test route error")

        service = RouteService()
        result = service.get_route([1, 1], [2, 2])

        self.assertIsNone(result)
        log_contents = self.log_stream.getvalue()
        self.assertIn("Route error: Test route error", log_contents)
