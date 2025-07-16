from django.urls import path
from . import views

urlpatterns = [
    path('plan-trip/', views.plan_trip, name='plan_trip'),
    path('trip/<int:trip_id>/', views.get_trip, name='get_trip'),
]