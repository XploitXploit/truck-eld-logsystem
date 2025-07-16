from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"trips", views.TripPlanViewSet, basename="trip")
router.register(r"violations", views.HOSViolationViewSet, basename="violation")

urlpatterns = [
    path("", include(router.urls)),
    # Keep legacy URLs for backward compatibility
    path(
        "plan-trip/",
        views.TripPlanViewSet.as_view({"post": "plan_trip"}),
        name="plan_trip",
    ),
    path(
        "trip/<int:pk>/",
        views.TripPlanViewSet.as_view({"get": "get_trip"}),
        name="get_trip",
    ),
]
