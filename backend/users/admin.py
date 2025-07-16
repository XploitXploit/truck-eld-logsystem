from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import TruckUser


class TruckUserAdmin(UserAdmin):
    list_display = ("username", "email", "truck_id", "license_number", "is_staff")
    search_fields = ("username", "email", "truck_id", "license_number")
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "email")}),
        ("Truck info", {"fields": ("truck_id", "license_number", "license_expiry")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "password1",
                    "password2",
                    "truck_id",
                    "license_number",
                ),
            },
        ),
    )


admin.site.register(TruckUser, TruckUserAdmin)
