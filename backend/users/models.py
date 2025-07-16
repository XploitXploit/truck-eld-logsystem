from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class TruckUser(AbstractUser):
    """
    Custom user model for truck drivers.

    Extends the standard Django User model with truck-specific fields.
    """

    truck_id = models.CharField(
        _("truck ID"),
        max_length=50,
        blank=True,
        help_text=_("The truck identification number."),
    )
    license_number = models.CharField(
        _("license number"),
        max_length=50,
        blank=True,
        help_text=_("Driver's license number."),
    )
    license_expiry = models.DateField(
        _("license expiry date"),
        null=True,
        blank=True,
        help_text=_("Expiry date of the driver's license."),
    )
    phone_number = models.CharField(
        _("phone number"),
        max_length=20,
        blank=True,
        help_text=_("Contact phone number."),
    )

    # Additional fields can be added here as needed

    class Meta:
        verbose_name = _("truck user")
        verbose_name_plural = _("truck users")

    def __str__(self):
        return f"{self.username} ({self.truck_id})" if self.truck_id else self.username
