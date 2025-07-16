from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import TruckUser
from .serializers import TruckUserSerializer, RegisterSerializer, LoginSerializer
import logging
import json

logger = logging.getLogger("users.views")


class TruckUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing truck user instances.
    """

    queryset = TruckUser.objects.all()
    serializer_class = TruckUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """
        Override to allow admins to list/retrieve and only allow users to see their own profile
        """
        if self.action in ["create"]:
            permission_classes = [permissions.AllowAny]
        elif self.action in ["update", "partial_update", "destroy", "me"]:
            permission_classes = [permissions.IsAuthenticated]
        else:  # list and retrieve
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=["get"])
    def me(self, request):
        """
        Return the authenticated user's profile
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["put", "patch"])
    def update_me(self, request):
        """
        Update the authenticated user's profile
        """
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(generics.CreateAPIView):
    """
    API endpoint for registering new truck users
    """

    queryset = TruckUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        logger.info("Processing user registration request")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": TruckUserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "User registered successfully",
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(generics.GenericAPIView):
    """
    API endpoint for user login and JWT token generation
    """

    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        logger.info("Processing user login request")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": TruckUserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "Login successful",
            }
        )


@api_view(["GET", "POST"])
@permission_classes([permissions.AllowAny])
def debug_auth(request):
    """
    Debug endpoint to test authentication functionality
    """
    if request.method == "POST":
        logger.info(f"Debug auth POST received: {request.data}")
        try:
            # Echo back the POST data to help debug client-server communication
            return Response(
                {
                    "message": "Debug auth endpoint (POST)",
                    "received_data": request.data,
                    "content_type": request.content_type,
                    "headers": dict(request.headers),
                }
            )
        except Exception as e:
            logger.error(f"Error in debug auth: {str(e)}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    else:
        # For GET requests, just return basic info
        return Response(
            {
                "message": "Debug auth endpoint (GET)",
                "auth_status": "Authentication system is running",
                "timestamp": timezone.now().isoformat(),
            }
        )


@api_view(["GET", "POST"])
@permission_classes([permissions.AllowAny])
def debug_auth(request):
    """
    Debug endpoint to test authentication functionality
    """
    if request.method == "POST":
        logger.info(f"Debug auth POST received: {request.data}")
        try:
            # Echo back the POST data to help debug client-server communication
            return Response(
                {
                    "message": "Debug auth endpoint (POST)",
                    "received_data": request.data,
                    "content_type": request.content_type,
                    "headers": dict(request.headers),
                }
            )
        except Exception as e:
            logger.error(f"Error in debug auth: {str(e)}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    else:
        # For GET requests, just return basic info
        return Response(
            {
                "message": "Debug auth endpoint (GET)",
                "auth_status": "Authentication system is running",
                "timestamp": timezone.now().isoformat(),
            }
        )
