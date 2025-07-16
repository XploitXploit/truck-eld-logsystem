from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import TruckUser


class TruckUserSerializer(serializers.ModelSerializer):
    """Serializer for TruckUser model"""

    class Meta:
        model = TruckUser
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "truck_id",
            "license_number",
            "license_expiry",
            "phone_number",
        ]
        read_only_fields = ["id"]


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for registering new truck users"""

    password = serializers.CharField(
        max_length=128, min_length=8, write_only=True, style={"input_type": "password"}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
        label="Confirm password",
    )

    class Meta:
        model = TruckUser
        fields = [
            "username",
            "email",
            "password",
            "password2",
            "first_name",
            "last_name",
            "truck_id",
            "license_number",
            "license_expiry",
            "phone_number",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        # Remove password2 as it's not needed for creating the user
        validated_data.pop("password2", None)

        # Create user with the validated data
        user = TruckUser.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            truck_id=validated_data.get("truck_id", ""),
            license_number=validated_data.get("license_number", ""),
            license_expiry=validated_data.get("license_expiry", None),
            phone_number=validated_data.get("phone_number", ""),
        )

        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login and JWT token generation"""

    username = serializers.CharField(max_length=255)
    password = serializers.CharField(
        max_length=128, write_only=True, style={"input_type": "password"}
    )

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        if username and password:
            user = authenticate(
                request=self.context.get("request"),
                username=username,
                password=password,
            )

            if not user:
                msg = "Unable to log in with provided credentials."
                raise serializers.ValidationError(msg, code="authorization")
        else:
            msg = 'Must include "username" and "password".'
            raise serializers.ValidationError(msg, code="authorization")

        attrs["user"] = user
        return attrs
