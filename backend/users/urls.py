from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TruckUserViewSet, RegisterView, LoginView, debug_auth

router = DefaultRouter()
router.register(r"users", TruckUserViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("debug/", debug_auth, name="debug_auth"),
]
